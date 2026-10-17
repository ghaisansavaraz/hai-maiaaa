/* Grass, reeds and flowers.
   Grass/reeds: instanced blades in 20m chunks with a custom shader — wind
   gusts, per-blade flutter, bending away from her as she walks, silvery
   moonlit translucency and warm pools of lantern light. Chunks beyond the
   draw distance are hidden; blades shrink into the ground near the edge so
   there is no visible pop. Flowers: instanced, swaying, faintly glowing; the
   blue "moonflowers" along the water glow enough to bloom. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, noise2, smoothstep } from './util.js';
import {
  LAKE, DOCK, BOUNDS, pierDist, riverSamples, RIVER_W, lakeDist, pathEdgeDist, autumnAt, boundsDist, hillDist, greenhouseSdf,
} from './layout.js';

export const MAX_LIGHTS = 8;
const CHUNK = 20;

function bladeGeometry() {
  const segs = 3;
  const verts = [];
  const idx = [];
  for (let i = 0; i < segs; i++) {
    const y = i / segs;
    const w = 0.5 * Math.pow(1 - y, 0.7);
    verts.push(-w, y, 0, w, y, 0);
  }
  verts.push(0, 1, 0);
  for (let i = 0; i < segs - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const last = (segs - 1) * 2;
  idx.push(last, last + 1, segs * 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  return g;
}

const grassVert = /* glsl */ `
uniform float uTime;
uniform vec3 uPlayer;
uniform float uWind;
uniform float uMaxDist;
uniform vec3 uCamPos;
attribute vec3 iOffset;
attribute vec4 iParams;   // rot, height, width, seed
attribute vec2 iZone;     // autumn, reed
varying float vT;
varying vec3 vWorld;
varying float vSeed;
varying vec2 vZone;
varying vec3 vNormal;

void main() {
  float rot = iParams.x;
  float h = iParams.y;
  float w = iParams.z;
  float seed = iParams.w;
  float t = position.y;

  float camD = distance(iOffset.xz, uCamPos.xz);
  h *= 1.0 - smoothstep(uMaxDist * 0.7, uMaxDist, camD);

  float c = cos(rot), s = sin(rot);
  vec3 local = vec3(position.x * w * c, t * h, position.x * w * s);
  vec2 facing = vec2(-s, c);

  vec2 wp = iOffset.xz;
  float gust = 0.5 + 0.5 * sin(wp.x * 0.045 + wp.y * 0.03 - uTime * 0.85) * sin(wp.y * 0.06 + uTime * 0.37 + wp.x * 0.01);
  float sway = (0.16 + 0.42 * gust) * uWind * mix(1.0, 0.55, iZone.y);
  float flutter = sin(uTime * (1.7 + seed) + seed * 40.0 + wp.x * 0.5) * 0.07;
  vec2 windDir = vec2(0.91, 0.41);
  vec2 bend = windDir * (sway + flutter) + facing * (seed - 0.5) * 0.45;

  vec2 away = wp - uPlayer.xz;
  float pd = length(away);
  float push = 1.0 - smoothstep(0.25, 1.4, pd);
  bend += (away / max(pd, 0.001)) * push * 1.15;

  float t2 = t * t;
  local.xz += bend * t2 * h;
  local.y *= 1.0 - min(length(bend), 1.2) * t2 * 0.33;

  vec3 world = iOffset + local;
  vWorld = world;
  vT = t;
  vSeed = seed;
  vZone = iZone;
  vNormal = normalize(vec3(facing.x, 0.35 + t * 0.6, facing.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}`;

const grassFrag = /* glsl */ `
#define LIGHTS ${MAX_LIGHTS}
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uSkyAmb;
uniform vec3 uGroundAmb;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;
uniform vec4 uLights[LIGHTS];
uniform vec3 uLightCols[LIGHTS];
uniform vec3 cRoot;
uniform vec3 cTipA;
uniform vec3 cTipB;
uniform vec3 cSilver;
uniform vec3 cAutA;
uniform vec3 cAutB;
uniform vec3 cReed;
varying float vT;
varying vec3 vWorld;
varying float vSeed;
varying vec2 vZone;
varying vec3 vNormal;

void main() {
  vec3 tip = mix(cTipA, cTipB, fract(vSeed * 7.13));
  tip = mix(tip, cSilver, step(0.84, fract(vSeed * 13.7)) * 0.75);
  tip = mix(tip, mix(cAutA, cAutB, fract(vSeed * 3.3)), vZone.x);
  tip = mix(tip, cReed, vZone.y);
  vec3 albedo = mix(cRoot, tip, smoothstep(0.0, 0.85, vT));

  vec3 V = normalize(vWorld - uCamPos);
  vec3 N = vNormal;
  if (dot(N.xz, V.xz) > 0.0) N.xz = -N.xz;

  float ao = mix(0.32, 1.0, vT);
  vec3 light = mix(uGroundAmb, uSkyAmb, vT) * ao;
  float ndl = dot(N, uMoonDir) * 0.5 + 0.5;
  light += uMoonColor * ndl * ao;
  // silvery glow when looking toward the moon through the grass
  float trans = pow(max(dot(V, uMoonDir), 0.0), 5.0) * vT * vT;
  light += uMoonColor * trans * 2.2;

  for (int i = 0; i < LIGHTS; i++) {
    vec3 L = uLights[i].xyz - vWorld;
    float d2 = dot(L, L);
    float window = 1.0 - smoothstep(60.0, 160.0, d2);
    light += uLightCols[i] * uLights[i].w * window / max(d2, 0.35) * (0.45 + 0.55 * vT);
  }

  vec3 col = albedo * light * 0.318;
  float fogD = distance(vWorld, uCamPos);
  float f = 1.0 - exp(-pow(uFogDensity * fogD, 2.0));
  col = mix(col, uFogColor, f);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createGrass(hf, shared) {
  const rng = mulberry32(2024);
  const base = bladeGeometry();
  const buckets = new Map();
  const bucket = (x, z) => {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const key = `${cx},${cz}`;
    if (!buckets.has(key)) buckets.set(key, { cx, cz, off: [], par: [], zone: [], minH: 1e9, maxH: -1e9 });
    return buckets.get(key);
  };
  const push = (x, z, y, rot, h, w, seed, aut, reed) => {
    const b = bucket(x, z);
    b.off.push(x, y, z);
    b.par.push(rot, h, w, seed);
    b.zone.push(aut, reed);
    b.minH = Math.min(b.minH, y);
    b.maxH = Math.max(b.maxH, y + h);
  };

  // --- meadow / grove / hill grass ---
  const MAX_DENSITY = 8.5;
  for (let cz = -BOUNDS.rz - 4; cz < BOUNDS.rz + 4; cz += CHUNK) {
    for (let cx = -BOUNDS.rx - 4; cx < BOUNDS.rx + 4; cx += CHUNK) {
      const n = CHUNK * CHUNK * MAX_DENSITY;
      for (let i = 0; i < n; i++) {
        const x = cx + rng() * CHUNK, z = cz + rng() * CHUNK;
        if (boundsDist(x, z) > 1.02) continue;
        const ground = hf.sample(x, z);
        if (ground < 0.08) continue;
        const pe = pathEdgeDist(x, z);
        if (pe < -0.2) continue;
        if (greenhouseSdf(x, z, 0.2) < 0) continue;
        if (pierDist(x, z) < 0.3) continue;

        const clump = noise2(x * 0.09, z * 0.09) * 0.5 + 0.5;
        const aut = autumnAt(x, z);
        let d = (0.6 + 0.4 * clump) * smoothstep(-0.2, 0.9, pe) * (1 - 0.15 * aut);
        const hd = hillDist(x, z);
        if (hd < 6.4) d *= 0.12;
        const ld = lakeDist(x, z);
        const shore = ld < 1.35 ? 1 - smoothstep(0.08, 0.5, ground) : 0;
        d *= 1 - shore * 0.6;
        if (rng() > d) continue;

        let h = 0.45 + 0.55 * clump + rng() * 0.2;
        h = h * (1 - aut) + (0.3 + rng() * 0.32) * aut;
        h *= 0.35 + 0.65 * smoothstep(-0.2, 1.8, pe);
        if (hd < 6.4) h = 0.14 + rng() * 0.08;
        h *= 1 - shore * 0.4;
        const w = 0.075 + rng() * 0.06;
        push(x, z, ground - 0.02, rng() * Math.PI * 2, h, w, rng(), aut, 0);
      }
    }
  }

  // --- reeds along the shore ---
  for (let i = 0; i < 3400; i++) {
    const a = rng() * Math.PI * 2, ld = 0.84 + rng() * 0.26;
    const x = LAKE.cx + Math.cos(a) * LAKE.rx * ld, z = LAKE.cz + Math.sin(a) * LAKE.rz * ld;
    const ground = hf.sample(x, z);
    if (ground < -0.4 || ground > 0.5) continue;
    if (noise2(x * 0.22, z * 0.22) < -0.05) continue;
    if (pierDist(x, z) < 1.2) continue;
    if (pathEdgeDist(x, z) < 0.6) continue;
    push(x, z, ground - 0.05, rng() * Math.PI * 2, 1.0 + rng() * 1.0, 0.045 + rng() * 0.03, rng(), 0, 1);
  }

  // --- reeds along both river banks ---
  for (let i = 1; i < riverSamples.length; i += 1) {
    const [ax, az] = riverSamples[i - 1], [bx, bz] = riverSamples[i];
    const tl = Math.hypot(bx - ax, bz - az) || 1;
    const nx = -(bz - az) / tl, nz = (bx - ax) / tl;
    for (let k = 0; k < 3; k++) {
      const side = rng() < 0.5 ? -1 : 1;
      const off = RIVER_W * (0.75 + rng() * 0.75);
      const x = bx + nx * off * side + (rng() - 0.5) * 0.8, z = bz + nz * off * side + (rng() - 0.5) * 0.8;
      if (boundsDist(x, z) > 0.98) continue;
      const ground = hf.sample(x, z);
      if (ground < -0.4 || ground > 0.6) continue;
      if (noise2(x * 0.2, z * 0.2) < -0.15) continue;
      if (pathEdgeDist(x, z) < 2.5) continue; // keep the bridge approaches clear
      push(x, z, ground - 0.05, rng() * Math.PI * 2, 0.9 + rng() * 1.0, 0.045 + rng() * 0.03, rng(), 0, 1);
    }
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uPlayer: shared.uPlayer,
      uWind: { value: 1 },
      uMaxDist: { value: 58 },
      uCamPos: shared.uCamPos,
      uMoonDir: shared.uMoonDir,
      uMoonColor: shared.uMoonColor,
      uSkyAmb: shared.uSkyAmb,
      uGroundAmb: shared.uGroundAmb,
      uFogColor: shared.uFogColor,
      uFogDensity: shared.uFogDensity,
      uLights: shared.uLights,
      uLightCols: shared.uLightCols,
      cRoot: { value: new THREE.Color('#14240f') },
      cTipA: { value: new THREE.Color('#4f7a3c') },
      cTipB: { value: new THREE.Color('#6f9450') },
      cSilver: { value: new THREE.Color('#a7bfa8') },
      cAutA: { value: new THREE.Color('#c08d3e') },
      cAutB: { value: new THREE.Color('#9a5a26') },
      cReed: { value: new THREE.Color('#566b3e') },
    },
    vertexShader: grassVert,
    fragmentShader: grassFrag,
    side: THREE.DoubleSide,
  });

  const group = new THREE.Group();
  const chunks = [];
  let total = 0;
  for (const b of buckets.values()) {
    const count = b.off.length / 3;
    if (!count) continue;
    total += count;
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('iOffset', new THREE.InstancedBufferAttribute(new Float32Array(b.off), 3));
    geo.setAttribute('iParams', new THREE.InstancedBufferAttribute(new Float32Array(b.par), 4));
    geo.setAttribute('iZone', new THREE.InstancedBufferAttribute(new Float32Array(b.zone), 2));
    geo.instanceCount = count;
    const center = new THREE.Vector3((b.cx + 0.5) * CHUNK, (b.minH + b.maxH) / 2, (b.cz + 0.5) * CHUNK);
    geo.boundingSphere = new THREE.Sphere(center, Math.SQRT2 * CHUNK * 0.5 + (b.maxH - b.minH) * 0.5 + 2.5);
    const mesh = new THREE.Mesh(geo, material);
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
    chunks.push({ mesh, geo, count, cx: center.x, cz: center.z });
  }

  let density = 1;
  return {
    group,
    material,
    total,
    setQuality(maxDist, dens) {
      material.uniforms.uMaxDist.value = maxDist;
      density = dens;
      for (const c of chunks) c.geo.instanceCount = Math.max(1, Math.floor(c.count * density));
    },
    update(camPos) {
      const lim = material.uniforms.uMaxDist.value + CHUNK * 0.75;
      for (const c of chunks) {
        c.mesh.visible = Math.hypot(c.cx - camPos.x, c.cz - camPos.z) < lim;
      }
    },
  };
}

/* ---------------- flowers ---------------- */

function flowerGeometry() {
  const parts = [];
  const H = 0.42;
  const color = (g, hex, glow) => {
    const c = new THREE.Color(hex);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3), gl = new Float32Array(n);
    for (let i = 0; i < n; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; gl[i] = glow; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
    return g;
  };
  const stem = new THREE.CylinderGeometry(0.004, 0.006, H, 4, 1);
  stem.translate(0, H / 2, 0);
  parts.push(color(stem, '#3f6a35', 0));
  for (let i = 0; i < 6; i++) {
    const p = new THREE.SphereGeometry(1, 6, 4);
    p.scale(0.034, 0.008, 0.058);
    p.translate(0, 0, 0.05);
    p.rotateX(-0.42);
    p.rotateY((i / 6) * Math.PI * 2);
    p.translate(0, H, 0);
    parts.push(color(p, i % 2 ? '#f6e6de' : '#efd3c7', 1));
  }
  const center = new THREE.SphereGeometry(0.018, 8, 6);
  center.scale(1, 0.6, 1);
  center.translate(0, H + 0.008, 0);
  parts.push(color(center, '#d8ac4c', 0.7));
  return mergeGeometries(parts);
}

function swayMaterial(shared, glowHex, glowAmt) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
  const uGlowColor = { value: new THREE.Color(glowHex) };
  const uGlowAmt = { value: glowAmt };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uGlowColor = uGlowColor;
    shader.uniforms.uGlowAmt = uGlowAmt;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float aGlow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float k = clamp(position.y / 0.42, 0.0, 1.0);
        k *= k;
        transformed.x += sin(uTime * 1.3 + ip.x * 0.37 + ip.z * 0.21) * 0.035 * k;
        transformed.z += cos(uTime * 1.05 + ip.z * 0.41) * 0.03 * k;
        vGlow = aGlow;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGlowColor;\nuniform float uGlowAmt;\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uGlowColor * uGlowAmt * vGlow;');
  };
  mat.userData.glow = uGlowAmt;
  return mat;
}

export function createFlowers(hf, shared) {
  const rng = mulberry32(808);
  const geo = flowerGeometry();
  const group = new THREE.Group();
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();

  // meadow flowers (ivory-blush, same family as the vase flower)
  const meadowMat = swayMaterial(shared, '#ffd9cc', 0.07);
  const meadow = new THREE.InstancedMesh(geo, meadowMat, 3200);
  let n = 0;
  for (let tries = 0; tries < 60000 && n < 3200; tries++) {
    const x = (rng() - 0.5) * 190, z = (rng() - 0.5) * 230;
    if (boundsDist(x, z) > 0.96 || autumnAt(x, z) > 0.4) continue;
    const ground = hf.sample(x, z);
    if (ground < 0.2 || pathEdgeDist(x, z) < 0.4 || greenhouseSdf(x, z, 0.3) < 0 || hillDist(x, z) < 6.5) continue;
    // clusters: drifts of flowers rather than an even sprinkle
    const cl = noise2(x * 0.06 + 9, z * 0.06 - 3);
    const nearGh = greenhouseSdf(x, z) < 9 ? 0.35 : 0;
    if (cl + nearGh < 0.25 && rng() > 0.04) continue;
    p.set(x, ground - 0.02, z);
    e.set((rng() - 0.5) * 0.25, rng() * Math.PI * 2, (rng() - 0.5) * 0.25);
    q.setFromEuler(e);
    const sc = 0.75 + rng() * 0.6;
    s.set(sc, sc * (0.8 + rng() * 0.5), sc);
    m.compose(p, q, s);
    meadow.setMatrixAt(n++, m);
  }
  meadow.count = n;
  group.add(meadow);

  // moonflowers: luminous blue-white along the shore and the dock path
  const moonMat = swayMaterial(shared, '#9fd8ff', 1.25);
  const moon = new THREE.InstancedMesh(geo, moonMat, 420);
  n = 0;
  for (let tries = 0; tries < 20000 && n < 420; tries++) {
    let x, z;
    if (rng() < 0.65) {
      const a = rng() * Math.PI * 2, ld = 1.02 + rng() * 0.2;
      x = LAKE.cx + Math.cos(a) * LAKE.rx * ld; z = LAKE.cz + Math.sin(a) * LAKE.rz * ld;
    } else {
      x = -8 + (rng() - 0.5) * 34; z = 18 + rng() * 22;
      if (Math.abs(pathEdgeDist(x, z) - 1.0) > 1.4) continue;
    }
    const ground = hf.sample(x, z);
    if (ground < 0.12 || pathEdgeDist(x, z) < 0.25) continue;
    if (pierDist(x, z) < 0.3) continue;
    p.set(x, ground - 0.02, z);
    e.set((rng() - 0.5) * 0.3, rng() * Math.PI * 2, (rng() - 0.5) * 0.3);
    q.setFromEuler(e);
    const sc = 0.6 + rng() * 0.5;
    s.set(sc, sc * (0.6 + rng() * 0.5), sc);
    m.compose(p, q, s);
    moon.setMatrixAt(n, m);
    moon.setColorAt(n, new THREE.Color('#dff1ff'));
    n++;
  }
  moon.count = n;
  group.add(moon);

  return { group, moonMat, meadowMat };
}
