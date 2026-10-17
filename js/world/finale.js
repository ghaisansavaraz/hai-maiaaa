/* The birthday ending (replaces the old moon-gate).
   On the hilltop stands a stone pedestal holding one paper sky lantern. On her
   birthday she lights it and lets it go, and the whole valley answers:
     1. her lantern glows and lifts off toward the moon
     2. hundreds of sky lanterns ignite in waves across the valley and rise
     3. the lake fills with floating lotus candles, the water lilies brighten
     4. stars draw a constellation: her flower, then a little bunny
     5. fireworks over the lake (chrysanthemum, willow, ring, heart),
        lighting the sky and reflected in the water
     6. a meteor shower (sky.js) and the birthday card (main.js)
   Everything is driven by one clock `t` (seconds since she lit the lantern),
   so the same scene plays identically every time. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, smoothstep, clamp } from './util.js';
import {
  HILL, HILLTOP_Y, LAKE, DOCK, BOUNDS, pierDist, lakeDist, boundsDist, pathEdgeDist, greenhouseSdf,
} from './layout.js';

// seconds since she lit her lantern
export const FINALE_T = {
  lift: 3.5,          // her lantern leaves the pedestal
  turn: 9.0,          // she's gently turned toward the valley
  valley: 9.5,        // first valley lanterns ignite
  candles: 14.0,      // floating candles start appearing on the lake
  stars: 34.0,        // constellation stars brighten
  flower: 38.0,       // ...and the flower is drawn
  bunny: 49.0,        // ...then the bunny
  fireworks: 60.0,    // first rocket
  barrage: 104.0,     // grand finale salvo
  shower: 100.0,      // meteor shower begins
  card: 120.0,        // birthday card (if texts are on)
};

const WIND = new THREE.Vector2(-0.18, -0.62); // lanterns drift north-west, toward the moon

/* ------------------------------------------------------------------ */
/* glow points: additive sprites, optionally drawn as their reflection */
/* on the lake (the mirror point, projected onto the water surface)    */
/* ------------------------------------------------------------------ */

const LAKE_MIRROR_GLSL = /* glsl */ `
  uniform vec4 uLake;
  // Where the reflection of p shows up on the lake (y = 0) as seen from cam.
  // w is 0 when that spot isn't on the water.
  vec4 lakeMirror(vec3 p, vec3 cam) {
    vec3 m = vec3(p.x, -p.y, p.z);
    float denom = cam.y - m.y;
    if (cam.y <= 0.05 || denom <= 0.001) return vec4(0.0);
    vec3 s = cam + (m - cam) * (cam.y / denom);
    float ld = length((s.xz - uLake.xy) / uLake.zw);
    return vec4(s.x, 0.03, s.z, 1.0 - smoothstep(0.86, 0.97, ld));
  }
`;

class GlowPoints {
  constructor(capacity, { fogMix = 0.5, reflect = true, reflectGain = 0.4, maxSize = 96 } = {}) {
    this.capacity = capacity;
    this.count = 0;
    this.pos = new Float32Array(capacity * 3);
    this.col = new Float32Array(capacity * 3);
    this.size = new Float32Array(capacity);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    this.geo = geo;
    this.uniforms = {
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uFogDensity: { value: 0.0115 },
      uFogMix: { value: fogMix },
      uLake: { value: new THREE.Vector4(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz) },
      uGain: { value: 1 },
    };
    const make = (isReflection) => new THREE.ShaderMaterial({
      uniforms: { ...this.uniforms, uGain: { value: isReflection ? reflectGain : 1 } },
      defines: isReflection ? { REFLECT: 1 } : {},
      vertexShader: /* glsl */ `
        ${LAKE_MIRROR_GLSL}
        uniform float uPixelRatio;
        uniform vec3 uCamPos;
        uniform float uFogDensity;
        uniform float uFogMix;
        uniform float uGain;
        attribute vec3 aColor;
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
          float w = uGain;
          float dist;
          #ifdef REFLECT
            vec4 m = lakeMirror(p, uCamPos);
            w *= m.w;
            dist = distance(uCamPos, vec3(p.x, -p.y, p.z));
            p = m.xyz;
          #endif
          vec4 mv = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          #ifndef REFLECT
            dist = -mv.z;
          #endif
          float px = aSize * uPixelRatio * 900.0 / max(dist, 0.3);
          gl_PointSize = clamp(px, 0.0, ${maxSize.toFixed(1)});
          float fog = exp(-(uFogDensity * dist * uFogMix) * (uFogDensity * dist * uFogMix));
          // keep tiny far sprites from vanishing: trade size for brightness
          float shrink = px < 1.5 ? max(px, 0.0) / 1.5 : 1.0;
          vColor = aColor * fog * w * shrink;
          if (aSize <= 0.0 || w <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          #ifdef REFLECT
            c.x += sin(gl_FragCoord.y * 0.35 + uTime * 4.0) * 0.07;
            c *= vec2(1.8, 0.62);
          #endif
          float d = length(c);
          float halo = max(1.0 - d * 2.0, 0.0);
          halo *= halo;
          float core = max(1.0 - d * 6.0, 0.0);
          vec3 col = vColor * (halo + core * core * 2.0);
          if (col.r + col.g + col.b < 0.003) discard;
          gl_FragColor = vec4(col, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.material = make(false);
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
    this.object = new THREE.Group();
    this.object.add(this.points);
    this.materials = [this.material];
    if (reflect) {
      this.reflMaterial = make(true);
      this.refl = new THREE.Points(geo, this.reflMaterial);
      this.refl.frustumCulled = false;
      this.refl.renderOrder = 2;
      this.object.add(this.refl);
      this.materials.push(this.reflMaterial);
    }
  }
  begin() { this.count = 0; }
  push(x, y, z, r, g, b, size) {
    if (this.count >= this.capacity) return;
    const i = this.count++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b;
    this.size[i] = size;
  }
  end(camPos, time, fogDensity, pixelRatio) {
    this.geo.setDrawRange(0, this.count);
    for (const k of ['position', 'aColor', 'aSize']) {
      const a = this.geo.attributes[k];
      a.clearUpdateRanges();
      a.addUpdateRange(0, this.count * a.itemSize);
      a.needsUpdate = true;
    }
    for (const m of this.materials) {
      m.uniforms.uCamPos.value.copy(camPos);
      m.uniforms.uTime.value = time;
      m.uniforms.uFogDensity.value = fogDensity;
      m.uniforms.uPixelRatio.value = pixelRatio;
    }
  }
}

/* ------------------------------------------------------------------ */
/* models                                                              */
/* ------------------------------------------------------------------ */

// paper sky lantern (kongming): open at the bottom, rounded closed top, 1 unit tall
function skyLanternGeometry(segments) {
  const pts = [
    [0.17, 0.0], [0.19, 0.08], [0.225, 0.3], [0.255, 0.55], [0.262, 0.72],
    [0.25, 0.86], [0.205, 0.95], [0.12, 0.99], [0.0, 1.0],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, segments);
  // v along the height, used by the shader for the inner-flame gradient
  return g;
}

// lotus float with a little candle, ~0.24 m across
function lotusCandleGeometry() {
  const parts = [];
  const color = (g, hex) => {
    const c = new THREE.Color(hex);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  const petal = (len, wid, tilt, rotY, y, hex) => {
    const g = new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(wid, len * 0.35, len);
    g.translate(0, 0, len * 0.9);
    g.rotateX(-tilt);
    g.rotateY(rotY);
    g.translate(0, y, 0);
    return color(g.toNonIndexed(), hex);
  };
  for (let i = 0; i < 8; i++) parts.push(petal(0.06, 0.035, 0.55, (i / 8) * Math.PI * 2, 0.0, i % 2 ? '#f29ab0' : '#f7b8c6'));
  for (let i = 0; i < 6; i++) parts.push(petal(0.045, 0.028, 1.0, (i / 6) * Math.PI * 2 + 0.3, 0.008, '#ffd7df'));
  const base = new THREE.CylinderGeometry(0.06, 0.05, 0.02, 12).translate(0, 0.0, 0);
  parts.push(color(base.toNonIndexed(), '#5e8a52'));
  const candle = new THREE.CylinderGeometry(0.022, 0.024, 0.055, 10).translate(0, 0.035, 0);
  parts.push(color(candle.toNonIndexed(), '#fff3dc'));
  for (const p of parts) { p.deleteAttribute('uv'); }
  return mergeGeometries(parts);
}

/* ------------------------------------------------------------------ */
/* constellation shapes (unit coordinates, y up)                       */
/* ------------------------------------------------------------------ */

function flowerShape() {
  const stars = [[0, 0]]; // 0 = heart of the flower
  const add = (x, y) => stars.push([x, y]) - 1;
  const mids = [], petals = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + (i / 5) * Math.PI * 2;
    // three stars round off each petal tip
    petals.push([
      add(Math.cos(a - 0.3) * 0.86, Math.sin(a - 0.3) * 0.86),
      add(Math.cos(a) * 1.05, Math.sin(a) * 1.05),
      add(Math.cos(a + 0.3) * 0.86, Math.sin(a + 0.3) * 0.86),
    ]);
    const b = a + Math.PI / 5;
    mids.push(add(Math.cos(b) * 0.36, Math.sin(b) * 0.36));
  }
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const [l, tip, rgt] = petals[i];
    const prevMid = mids[(i + 4) % 5];
    segs.push([prevMid, l], [l, tip], [tip, rgt], [rgt, mids[i]]);
  }
  // stem + leaf, hanging from the bottom notch (mid 2 sits at 270°)
  const s1 = add(0.05, -1.45);
  const s2 = add(-0.02, -2.45);
  const leaf = add(0.62, -1.75);
  segs.push([mids[2], s1], [s1, s2], [s1, leaf], [leaf, s2]);
  return { stars, segs };
}

function bunnyShape() {
  const p = {
    foot: [0.75, -0.95], chest: [0.95, -0.05], nose: [1.15, 0.55], head: [0.7, 1.0],
    ear1: [0.85, 2.15], earBase: [0.45, 1.05], ear2: [0.2, 2.05], back: [-0.45, 0.55],
    tail: [-1.05, -0.25], rump: [-0.7, -0.95],
  };
  const order = ['foot', 'chest', 'nose', 'head', 'ear1', 'earBase', 'ear2', 'back', 'tail', 'rump'];
  const stars = order.map((k) => p[k]);
  const segs = order.map((_, i) => [i, (i + 1) % order.length]);
  return { stars, segs };
}

/* ------------------------------------------------------------------ */

export function createFinale(hf, { audio } = {}) {
  const rng = mulberry32(2019);
  const group = new THREE.Group();
  const top = new THREE.Vector3(HILL.x, HILLTOP_Y, HILL.z + 0.5); // pedestal spot, centre of the plaza

  /* ---------- pedestal + her lantern ---------- */
  const stone = new THREE.MeshStandardMaterial({ color: '#a9a497', roughness: 0.9 });
  const ped = new THREE.Group();
  ped.position.copy(top);
  const pedParts = [
    new THREE.CylinderGeometry(0.62, 0.7, 0.18, 8).translate(0, 0.09, 0),
    new THREE.CylinderGeometry(0.5, 0.56, 0.12, 8).translate(0, 0.24, 0),
    new THREE.CylinderGeometry(0.2, 0.26, 0.72, 12).translate(0, 0.66, 0),
    new THREE.TorusGeometry(0.22, 0.035, 6, 16).rotateX(Math.PI / 2).translate(0, 0.98, 0),
    new THREE.CylinderGeometry(0.42, 0.24, 0.14, 12).translate(0, 1.07, 0),
    new THREE.CylinderGeometry(0.44, 0.42, 0.05, 12).translate(0, 1.16, 0),
  ].map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; });
  const pedMesh = new THREE.Mesh(mergeGeometries(pedParts), stone);
  pedMesh.castShadow = true;
  pedMesh.receiveShadow = true;
  ped.add(pedMesh);
  group.add(ped);

  const paperMat = new THREE.MeshStandardMaterial({
    color: '#f3dcb4', emissive: '#ff9f4a', emissiveIntensity: 0, roughness: 0.85, side: THREE.DoubleSide,
  });
  const herLantern = new THREE.Group();
  const herMesh = new THREE.Mesh(skyLanternGeometry(20), paperMat);
  herMesh.scale.setScalar(0.62);
  herLantern.add(herMesh);
  // wire cross + fuel cell at the opening
  const wire = new THREE.MeshStandardMaterial({ color: '#3a3330', roughness: 0.6 });
  for (const r of [0, Math.PI / 2]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.21, 4), wire);
    bar.rotation.z = Math.PI / 2;
    bar.rotation.y = r;
    bar.position.y = 0.03;
    herLantern.add(bar);
  }
  const fuel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10),
    new THREE.MeshStandardMaterial({ color: '#ffd38a', emissive: '#ff8a2a', emissiveIntensity: 0 }));
  fuel.position.y = 0.03;
  herLantern.add(fuel);
  const restY = 1.19;
  herLantern.position.set(top.x, top.y + restY, top.z);
  group.add(herLantern);

  const light = new THREE.PointLight('#ffb56b', 0, 16, 2);
  light.position.copy(herLantern.position).add(new THREE.Vector3(0, 0.3, 0));
  group.add(light);

  const interactCenter = herLantern.position.clone().add(new THREE.Vector3(0, 0.3, 0));

  // the four stone lanterns (tōrō) around the plaza, kept from the old gate
  const fireMat = new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ff9f4a', emissiveIntensity: 2.2 });
  const toroSpots = [[-4.2, -2.6], [4.2, -2.6], [-4.2, 2.4], [4.2, 2.4]];
  for (const [ox, oz] of toroSpots) {
    const tg = new THREE.Group();
    tg.position.set(HILL.x + ox, HILLTOP_Y, HILL.z + 1.5 + oz);
    tg.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42).translate(0, 0.06, 0), stone));
    tg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.75, 8).translate(0, 0.5, 0), stone));
    tg.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.34).translate(0, 0.9, 0), stone));
    tg.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24).translate(0, 1.05, 0), fireMat));
    tg.add(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 4).rotateY(Math.PI / 4).translate(0, 1.28, 0), stone));
    tg.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6).translate(0, 1.42, 0), stone));
    tg.traverse((o) => { if (o.isMesh && o.material === stone) o.castShadow = true; });
    group.add(tg);
  }

  /* ---------- valley of sky lanterns ---------- */
  const lanternData = [];
  const hillPt = new THREE.Vector2(HILL.x, HILL.z);
  // a ring of lanterns right around her on the plaza edge, first to light
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rng() * 0.2;
    const r = 7.2 + rng() * 3.5;
    const x = HILL.x + Math.cos(a) * r, z = HILL.z + Math.sin(a) * r;
    lanternData.push({ x, y: hf.sample(x, z), z, ign: FINALE_T.valley + rng() * 3.5 });
  }
  for (let tries = 0; tries < 40000 && lanternData.length < 440; tries++) {
    const x = (rng() - 0.5) * BOUNDS.rx * 1.9, z = (rng() - 0.5) * BOUNDS.rz * 1.9;
    if (boundsDist(x, z) > 0.9) continue;
    const ld = lakeDist(x, z);
    if (ld < 1.03) continue;
    let w = 0.12;
    if (ld < 1.3) w += 0.9;                        // lakeshore
    if (pathEdgeDist(x, z) < 5) w += 0.45;        // along her path
    if (greenhouseSdf(x, z) < 9) w += 0.5;         // around the greenhouse
    if (pierDist(x, z) < 5 && pierDist(x, z) > 0.8) w += 0.6; // around the pier
    if (rng() > w) continue;
    const d = Math.hypot(x - hillPt.x, z - hillPt.y);
    // waves rolling outward from the hilltop
    const ign = FINALE_T.valley + 3 + d / 5.2 + rng() * 6;
    lanternData.push({ x, y: hf.sample(x, z), z, ign });
  }
  const NL = lanternData.length;
  for (const l of lanternData) {
    l.rise = 0.55 + rng() * 0.6;
    l.drift = 0.5 + rng() * 0.9;
    l.ph = rng() * 6.28;
    l.size = 0.78 + rng() * 0.32;
    l.flick = rng() * 40;
  }

  const lanternMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color() },
      uFogDensity: { value: 0.0115 },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      varying float vBright;
      varying float vSeed;
      varying float vDist;
      void main() {
        vY = position.y;
        #ifdef USE_INSTANCING_COLOR
          vBright = instanceColor.r;
          vSeed = instanceColor.g;
        #else
          vBright = 1.0; vSeed = 0.0;
        #endif
        vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying float vY;
      varying float vBright;
      varying float vSeed;
      varying float vDist;
      void main() {
        float flick = 0.86 + 0.14 * sin(uTime * 13.0 + vSeed * 40.0) * sin(uTime * 7.3 + vSeed * 13.0);
        vec3 warm = mix(vec3(1.0, 0.36, 0.07), vec3(1.0, 0.66, 0.3), smoothstep(0.0, 0.9, vY));
        float inner = mix(1.9, 0.75, smoothstep(0.0, 1.0, vY));
        vec3 col = warm * inner * flick * vBright;
        // paper seams: faint darker vertical ribs
        float f = 1.0 - exp(-(uFogDensity * vDist * 0.45) * (uFogDensity * vDist * 0.45));
        col = mix(col, uFogColor, f * 0.8);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
  const lanterns = new THREE.InstancedMesh(skyLanternGeometry(9), lanternMat, NL);
  lanterns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lanterns.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NL * 3), 3).setUsage(THREE.DynamicDrawUsage);
  lanterns.frustumCulled = false;
  lanterns.visible = false;
  group.add(lanterns);

  /* ---------- floating lotus candles ---------- */
  const candles = [];
  const dockEnd = new THREE.Vector2(DOCK.x, DOCK.zEnd);
  for (let tries = 0; tries < 6000 && candles.length < 240; tries++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.88;
    const x = LAKE.cx + Math.cos(a) * LAKE.rx * r, z = LAKE.cz + Math.sin(a) * LAKE.rz * r;
    if (pierDist(x, z) < 1.6) continue; // keep the pier clear
    const d = Math.hypot(x - dockEnd.x, z - dockEnd.y);
    candles.push({
      x, z, a: Math.atan2(z - LAKE.cz, x - LAKE.cx), r: Math.hypot((x - LAKE.cx) / LAKE.rx, (z - LAKE.cz) / LAKE.rz),
      t0: FINALE_T.candles + d / 1.7 + rng() * 5, ph: rng() * 6.28, spin: (rng() - 0.5) * 0.4,
      size: 0.85 + rng() * 0.4, flick: rng() * 30,
    });
  }
  const NC = candles.length;
  const candleMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.6, emissive: '#ff9a7a', emissiveIntensity: 0.0,
  });
  const candleMesh = new THREE.InstancedMesh(lotusCandleGeometry(), candleMat, NC);
  candleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  candleMesh.frustumCulled = false;
  candleMesh.visible = false;
  group.add(candleMesh);

  /* ---------- glow layers ---------- */
  const halos = new GlowPoints(NL + 4, { fogMix: 0.42, reflectGain: 0.45 });
  const flames = new GlowPoints(NC, { fogMix: 0.6, reflectGain: 0.7, maxSize: 48 });
  const sparks = new GlowPoints(16000, { fogMix: 0.28, reflectGain: 0.35, maxSize: 64 });
  const starPts = new GlowPoints(64, { fogMix: 0, reflect: false, maxSize: 40 });
  group.add(halos.object, flames.object, sparks.object, starPts.object);

  /* ---------- constellation ---------- */
  const conGroup = new THREE.Group();
  const toLake = new THREE.Vector2(LAKE.cx - HILL.x, LAKE.cz - HILL.z).normalize();
  const el = THREE.MathUtils.degToRad(37);
  const conDir = new THREE.Vector3(toLake.x * Math.cos(el), Math.sin(el), toLake.y * Math.cos(el)).normalize();
  const CON_R = 620, CON_S = 52;
  const figures = [
    { shape: flowerShape(), off: [-150, 30], draw: [FINALE_T.flower, FINALE_T.flower + 10] },
    { shape: bunnyShape(), off: [150, 0], draw: [FINALE_T.bunny, FINALE_T.bunny + 8] },
  ];
  const conStars = [];
  const ribbon = { pos: [], seg: [], t: [], side: [] };
  let segBase = 0;
  for (const f of figures) {
    const local = f.shape.stars.map(([x, y]) => [f.off[0] + x * CON_S, f.off[1] + y * CON_S]);
    local.forEach((p, i) => conStars.push({ p, tw: rng() * 6.28, big: i === 0 ? 1.4 : 0.9 + rng() * 0.4 }));
    f.segBase = segBase;
    f.segCount = f.shape.segs.length;
    f.shape.segs.forEach(([a, b], k) => {
      const A = local[a], B = local[b];
      const dx = B[0] - A[0], dy = B[1] - A[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const W = 2.0;
      const quad = [[A, 0, -1], [A, 0, 1], [B, 1, -1], [B, 1, 1]];
      const verts = [quad[0], quad[2], quad[1], quad[1], quad[2], quad[3]];
      for (const [P, t, s] of verts) {
        ribbon.pos.push(P[0] + nx * W * s, P[1] + ny * W * s, 0);
        ribbon.seg.push(segBase + k);
        ribbon.t.push(t);
        ribbon.side.push(s);
      }
    });
    segBase += f.segCount;
  }
  const ribGeo = new THREE.BufferGeometry();
  ribGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbon.pos, 3));
  ribGeo.setAttribute('aSeg', new THREE.Float32BufferAttribute(ribbon.seg, 1));
  ribGeo.setAttribute('aT', new THREE.Float32BufferAttribute(ribbon.t, 1));
  ribGeo.setAttribute('aSide', new THREE.Float32BufferAttribute(ribbon.side, 1));
  const ribMat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uAlpha: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSeg; attribute float aT; attribute float aSide;
      varying float vSeg; varying float vT; varying float vSide;
      void main() {
        vSeg = aSeg; vT = aT; vSide = aSide;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw; uniform float uAlpha;
      varying float vSeg; varying float vT; varying float vSide;
      void main() {
        float drawn = clamp(uDraw - vSeg, 0.0, 1.0);
        float a = 1.0 - smoothstep(drawn - 0.03, drawn, vT);
        float edge = 1.0 - abs(vSide);
        a *= edge * edge * uAlpha;
        // a bright drawing tip at the front of the current line
        float dd = (vT - drawn) * 18.0;
        float tip = (drawn > 0.0 && drawn < 1.0) ? exp(-dd * dd) : 0.0;
        vec3 col = vec3(0.72, 0.82, 1.0) * 1.4 + vec3(1.0, 0.95, 0.85) * tip * 3.0;
        if (a < 0.002) discard;
        gl_FragColor = vec4(col * a, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const ribbonMesh = new THREE.Mesh(ribGeo, ribMat);
  ribbonMesh.frustumCulled = false;
  ribbonMesh.renderOrder = -7;
  conGroup.add(ribbonMesh);
  conGroup.visible = false;
  group.add(conGroup);
  // viewer's frame when looking along conDir: local x = right, y = up, z = back toward her
  const conRight = new THREE.Vector3().crossVectors(conDir, new THREE.Vector3(0, 1, 0)).normalize();
  const conUp = new THREE.Vector3().crossVectors(conRight, conDir).normalize();
  conGroup.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(conRight, conUp, conDir.clone().negate()));

  /* ---------- fireworks ---------- */
  const PALETTE = [
    [1.0, 0.78, 0.35], [1.0, 0.45, 0.62], [0.55, 0.75, 1.0], [0.95, 0.95, 1.0],
    [0.65, 1.0, 0.6], [0.85, 0.55, 1.0], [1.0, 0.55, 0.25],
  ];
  const shells = [];
  const schedule = [];
  {
    const r2 = mulberry32(77);
    let t = FINALE_T.fireworks;
    const types = ['chrys', 'chrys', 'willow', 'ring', 'chrys', 'peony'];
    while (t < FINALE_T.barrage) {
      const build = (t - FINALE_T.fireworks) / (FINALE_T.barrage - FINALE_T.fireworks);
      const n = build > 0.55 && r2() < 0.5 ? 2 : 1;
      for (let k = 0; k < n; k++) schedule.push({ t: t + k * 0.35, type: types[Math.floor(r2() * types.length)] });
      t += 2.6 - build * 1.4 + r2() * 0.8;
    }
    schedule.push({ t: FINALE_T.fireworks + 14, type: 'heart' });
    schedule.push({ t: FINALE_T.fireworks + 31, type: 'heart' });
    // the grand finale: a fast salvo, golden willows, then three hearts
    for (let i = 0; i < 14; i++) schedule.push({ t: FINALE_T.barrage + i * 0.42, type: i % 3 === 0 ? 'willow' : i % 3 === 1 ? 'chrys' : 'ring' });
    schedule.push({ t: FINALE_T.barrage + 7.0, type: 'willow', big: true });
    schedule.push({ t: FINALE_T.barrage + 7.3, type: 'willow', big: true });
    for (let i = 0; i < 3; i++) schedule.push({ t: FINALE_T.barrage + 9.2 + i * 0.5, type: 'heart', slot: i - 1 });
    schedule.sort((a, b) => a.t - b.t);
  }
  let schedIdx = 0;

  const flash = new THREE.Color(0, 0, 0);
  const tmpCol = new THREE.Color();
  const camPos = new THREE.Vector3();

  function launch(spec, now, cam) {
    const r = Math.random;
    const big = !!spec.big;
    const bx = LAKE.cx + (spec.slot !== undefined ? spec.slot * 13 : (r() - 0.5) * 26);
    const bz = LAKE.cz + (r() - 0.5) * 14;
    const by = (spec.type === 'heart' ? 46 : 36) + r() * 18 + (big ? 6 : 0);
    const burst = new THREE.Vector3(bx, by, bz);
    const origin = new THREE.Vector3(bx + (r() - 0.5) * 3, 0.3, bz + (r() - 0.5) * 3);
    const col = PALETTE[Math.floor(r() * PALETTE.length)];
    const col2 = PALETTE[Math.floor(r() * PALETTE.length)];
    const shell = {
      type: spec.type, t0: now, ascent: 1.5 + r() * 0.5, origin, burst, big,
      col: spec.type === 'willow' ? [1.0, 0.72, 0.32] : spec.type === 'heart' ? [1.0, 0.42, 0.6] : col,
      col2, burstDone: false, v: null,
    };
    // spark velocities
    const n = spec.type === 'willow' ? 110 : spec.type === 'heart' ? 90 : spec.type === 'ring' ? 70 : 150;
    const count = big ? Math.round(n * 1.6) : n;
    const v = new Float32Array(count * 3);
    const speed = spec.type === 'willow' ? 14 : spec.type === 'heart' ? 1.3 : 19 + r() * 5;
    if (spec.type === 'ring') {
      const nrm = new THREE.Vector3(r() - 0.5, r() * 0.6 + 0.4, r() - 0.5).normalize();
      const a1 = new THREE.Vector3().crossVectors(nrm, new THREE.Vector3(1, 0, 0)).normalize();
      const a2 = new THREE.Vector3().crossVectors(nrm, a1);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const d = a1.clone().multiplyScalar(Math.cos(a)).addScaledVector(a2, Math.sin(a)).multiplyScalar(speed);
        v[i * 3] = d.x; v[i * 3 + 1] = d.y; v[i * 3 + 2] = d.z;
      }
    } else if (spec.type === 'heart') {
      // drawn in the plane facing her, so it reads as a heart from where she stands
      const toCam = new THREE.Vector3().subVectors(cam, burst); toCam.y = 0; toCam.normalize();
      const right = new THREE.Vector3(-toCam.z, 0, toCam.x);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(a), 3);
        const hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
        v[i * 3] = right.x * hx * speed; v[i * 3 + 1] = hy * speed + 1.5; v[i * 3 + 2] = right.z * hx * speed;
      }
    } else {
      // fibonacci sphere, slightly jittered
      for (let i = 0; i < count; i++) {
        const y = 1 - (i + 0.5) / count * 2;
        const rr = Math.sqrt(1 - y * y);
        const phi = i * 2.399963;
        const s = speed * (0.92 + r() * 0.16) * (spec.type === 'peony' ? 0.8 : 1);
        v[i * 3] = Math.cos(phi) * rr * s; v[i * 3 + 1] = y * s; v[i * 3 + 2] = Math.sin(phi) * rr * s;
      }
    }
    shell.v = v;
    shell.count = count;
    shell.k = spec.type === 'willow' ? 0.55 : spec.type === 'heart' ? 1.1 : 1.25;
    shell.g = spec.type === 'willow' ? 4.2 : spec.type === 'heart' ? 0.9 : 3.0;
    shell.life = spec.type === 'willow' ? 4.2 : spec.type === 'heart' ? 2.6 : 2.4 + Math.random() * 0.6;
    shell.trail = spec.type === 'willow' ? 0.11 : 0.04;
    shell.crackle = spec.type === 'chrys' && Math.random() < 0.5;
    shells.push(shell);
    if (audio) audio.fireworkLaunch?.(cam.distanceTo(origin));
  }

  const TRAIL = [1, 0.55, 0.3, 0.16];
  function drawShells(now, dt, cam) {
    for (let si = shells.length - 1; si >= 0; si--) {
      const s = shells[si];
      const age = now - s.t0;
      if (age < s.ascent) {
        // rocket climbing with a fading tail
        for (let k = 0; k < 6; k++) {
          const a = Math.max(age - k * 0.045, 0) / s.ascent;
          const e = 1 - (1 - a) * (1 - a);
          const x = s.origin.x + (s.burst.x - s.origin.x) * e;
          const y = s.origin.y + (s.burst.y - s.origin.y) * e;
          const z = s.origin.z + (s.burst.z - s.origin.z) * e;
          const b = (k === 0 ? 2.4 : 1.2 * (1 - k / 6)) * (0.6 + 0.4 * Math.random());
          sparks.push(x, y, z, 1.0 * b, 0.72 * b, 0.4 * b, k === 0 ? 0.32 : 0.22);
        }
        continue;
      }
      const tau = age - s.ascent;
      if (!s.burstDone) {
        s.burstDone = true;
        const strength = s.big ? 1.9 : s.type === 'heart' ? 1.2 : 1.0;
        flash.r += s.col[0] * strength; flash.g += s.col[1] * strength; flash.b += s.col[2] * strength;
        if (audio) audio.fireworkBoom?.(cam.distanceTo(s.burst), s.big || s.type === 'willow', s.crackle);
      }
      if (tau > s.life + 0.6) { shells.splice(si, 1); continue; }
      // central flash
      if (tau < 0.3) {
        const f = (1 - tau / 0.3) * 6;
        sparks.push(s.burst.x, s.burst.y, s.burst.z, s.col[0] * f, s.col[1] * f, s.col[2] * f, s.big ? 9 : 6);
      }
      for (let i = 0; i < s.count; i++) {
        const vx = s.v[i * 3], vy = s.v[i * 3 + 1], vz = s.v[i * 3 + 2];
        const life = s.life * (0.85 + ((i * 7919) % 100) / 100 * 0.3);
        const colA = s.type === 'peony' && i % 2 ? s.col2 : s.col;
        for (let k = 0; k < TRAIL.length; k++) {
          const tt = tau - k * s.trail;
          if (tt < 0) break;
          const u = tt / life;
          if (u >= 1) continue;
          const e = Math.exp(-s.k * tt);
          const f = (1 - e) / s.k;
          const gy = (s.g / s.k) * (tt - f);
          const x = s.burst.x + vx * f, y = s.burst.y + vy * f - gy, z = s.burst.z + vz * f;
          let b = Math.pow(1 - u, 1.4) * TRAIL[k] * 2.0;
          if (s.crackle && u > 0.6) b *= ((i * 13 + Math.floor(now * 22)) % 3 === 0) ? 2.2 : 0.15;
          if (s.type === 'willow') b *= 0.85 + 0.15 * Math.sin(now * 30 + i);
          // colour shifts slightly warmer as sparks cool
          const warm = u * 0.35;
          // squared colour = more saturated after tone mapping
          sparks.push(x, y, z,
            Math.min(colA[0] + warm * 0.3, 1) ** 2 * b, (colA[1] * (1 - warm * 0.4)) ** 2 * b, (colA[2] * (1 - warm)) ** 2 * b,
            (k === 0 ? 0.75 : 0.55) * (s.big ? 1.25 : 1));
        }
      }
    }
  }

  /* ---------- state ---------- */
  let started = false;
  let t = 0;
  let turnSent = false;
  let cardSent = false;
  const dummy = new THREE.Object3D();
  const lilyMat = { ref: null };

  function updateLanterns(time) {
    const arr = lanterns.instanceMatrix.array;
    const colArr = lanterns.instanceColor.array;
    for (let i = 0; i < NL; i++) {
      const l = lanternData[i];
      const age = t - l.ign;
      const o = i * 16;
      if (age < 0) { arr[o] = arr[o + 5] = arr[o + 10] = 0; arr[o + 15] = 1; colArr[i * 3] = 0; continue; }
      const infl = smoothstep(0, 1.6, age);
      const air = Math.max(age - 1.8, 0);
      const x = l.x + WIND.x * air * l.drift + Math.sin(age * 0.45 + l.ph) * 0.7 * Math.min(air * 0.2, 1);
      const z = l.z + WIND.y * air * l.drift + Math.cos(age * 0.38 + l.ph) * 0.7 * Math.min(air * 0.2, 1);
      const y = l.y + 0.35 + air * l.rise + Math.min(air, 40) * air * 0.004 * l.rise;
      const s = l.size * (0.55 + 0.45 * infl);
      arr[o] = s; arr[o + 1] = 0; arr[o + 2] = 0; arr[o + 3] = 0;
      arr[o + 4] = 0; arr[o + 5] = s; arr[o + 6] = 0; arr[o + 7] = 0;
      arr[o + 8] = 0; arr[o + 9] = 0; arr[o + 10] = s; arr[o + 11] = 0;
      arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
      const high = 1 - smoothstep(150, 230, y - l.y);
      const bright = (1 + 1.8 * Math.exp(-age * 2.5)) * smoothstep(0, 0.6, age) * high;
      colArr[i * 3] = bright; colArr[i * 3 + 1] = l.flick; colArr[i * 3 + 2] = 0;
      if (bright > 0.01) {
        const fl = 0.85 + 0.15 * Math.sin(time * 11 + l.flick);
        const hb = 0.55 * bright * fl;
        halos.push(x, y + 0.42 * s, z, 1.0 * hb, 0.55 * hb, 0.22 * hb, 2.1 * s);
      }
    }
    lanterns.instanceMatrix.needsUpdate = true;
    lanterns.instanceColor.needsUpdate = true;
  }

  function updateCandles(time) {
    let lit = 0;
    for (let i = 0; i < NC; i++) {
      const c = candles[i];
      const age = t - c.t0;
      if (age < 0) { dummy.scale.setScalar(0); dummy.position.set(0, -10, 0); dummy.updateMatrix(); candleMesh.setMatrixAt(i, dummy.matrix); continue; }
      lit++;
      const appear = smoothstep(0, 2.2, age);
      // slow drift around the lake, gently bobbing
      const a = c.a + age * 0.004 * (c.r > 0.5 ? 1 : -1);
      const x = LAKE.cx + Math.cos(a) * LAKE.rx * c.r;
      const z = LAKE.cz + Math.sin(a) * LAKE.rz * c.r;
      const y = 0.02 + Math.sin(time * 1.3 + c.ph) * 0.012 - (1 - appear) * 0.08;
      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.sin(time * 0.9 + c.ph) * 0.05, c.ph + age * c.spin, Math.cos(time * 0.8 + c.ph) * 0.05);
      dummy.scale.setScalar(c.size * appear);
      dummy.updateMatrix();
      candleMesh.setMatrixAt(i, dummy.matrix);
      const fl = (0.8 + 0.2 * Math.sin(time * 14 + c.flick) * Math.sin(time * 9.1 + c.flick * 2)) * appear;
      flames.push(x, y + 0.085 * c.size, z, 1.0 * 1.8 * fl, 0.62 * 1.8 * fl, 0.25 * 1.8 * fl, 0.2 * c.size);
    }
    candleMesh.instanceMatrix.needsUpdate = true;
    return lit / Math.max(NC, 1);
  }

  return {
    group,
    light,
    colliders: [
      { x: top.x, z: top.z, r: 0.7 },
      ...toroSpots.map(([ox, oz]) => ({ x: HILL.x + ox, z: HILL.z + 1.5 + oz, r: 0.3 })),
    ],
    get started() { return started; },
    get t() { return t; },
    flash,
    warm: 0,
    setLilies(mat) { lilyMat.ref = mat; },
    interact: { center: interactCenter, radius: 0.65, reach: 3.6 },
    start() {
      if (started) return;
      started = true;
      t = 0;
      lanterns.visible = true;
      candleMesh.visible = true;
    },
    /** Returns events for main.js: { turn, card, shower }. */
    update(time, dt, unlocked, cam, fog, pixelRatio) {
      camPos.copy(cam);
      const ev = { turn: false, card: false, shower: false };
      halos.begin(); flames.begin(); sparks.begin(); starPts.begin();

      if (!started) {
        // invite her: a faint breathing glow in the paper once it's her birthday
        const invite = unlocked ? 0.35 + Math.sin(time * 1.6) * 0.2 : 0;
        paperMat.emissiveIntensity = invite;
        fuel.material.emissiveIntensity = invite * 2;
        light.intensity = invite * 1.2;
      } else {
        t += dt;
        // 1. her lantern: glow up, then lift off toward the moon
        const glow = smoothstep(0, 2.2, t);
        const fl = 0.9 + 0.1 * Math.sin(time * 12) * Math.sin(time * 7.7);
        paperMat.emissiveIntensity = 1.4 * glow * fl;
        fuel.material.emissiveIntensity = 4 * glow;
        const air = Math.max(t - FINALE_T.lift, 0);
        herLantern.position.set(
          top.x + WIND.x * air * 0.55 + Math.sin(air * 0.5) * 0.3 * Math.min(air * 0.3, 1),
          top.y + restY + air * 0.75 + air * air * 0.012,
          top.z + WIND.y * air * 0.55,
        );
        herLantern.rotation.z = Math.sin(time * 0.9) * 0.05 * Math.min(air, 1);
        light.position.copy(herLantern.position).add(new THREE.Vector3(0, 0.25, 0));
        light.intensity = 6.5 * glow * fl * (1 - smoothstep(14, 40, air));
        if (air < 200) halos.push(herLantern.position.x, herLantern.position.y + 0.32, herLantern.position.z, 1.6 * glow, 0.9 * glow, 0.4 * glow, 2.4);

        if (!turnSent && t >= FINALE_T.turn) { turnSent = true; ev.turn = true; }

        // 2. valley of lanterns
        updateLanterns(time);
        this.warm = smoothstep(FINALE_T.valley, FINALE_T.valley + 30, t) * (1 - 0.35 * smoothstep(90, 160, t));

        // 3. lake of lights
        const litFrac = updateCandles(time);
        candleMat.emissiveIntensity = 0.45 * litFrac;
        if (lilyMat.ref) lilyMat.ref.emissiveIntensity = 0.55 + 1.3 * smoothstep(FINALE_T.candles, FINALE_T.candles + 20, t);

        // 4. constellation
        const starA = smoothstep(FINALE_T.stars, FINALE_T.stars + 4, t);
        if (starA > 0) {
          conGroup.visible = true;
          const center = new THREE.Vector3().copy(camPos).addScaledVector(conDir, CON_R);
          conGroup.position.copy(center);
          ribMat.uniforms.uDraw.value = drawnTotal(t);
          ribMat.uniforms.uAlpha.value = starA * (1 - 0.45 * smoothstep(95, 115, t));
          for (const s of conStars) {
            const wp = new THREE.Vector3().copy(center)
              .addScaledVector(conRight, s.p[0]).addScaledVector(conUp, s.p[1]);
            const tw = (0.75 + 0.25 * Math.sin(time * 2.2 + s.tw)) * starA * s.big;
            starPts.push(wp.x, wp.y, wp.z, 0.85 * tw * 2.2, 0.9 * tw * 2.2, 1.0 * tw * 2.2, 5.5 * s.big);
          }
        }

        // 5. fireworks
        while (schedIdx < schedule.length && t >= schedule[schedIdx].t) launch(schedule[schedIdx++], t, camPos);
        drawShells(t, dt, camPos);

        // 6. meteor shower + card
        ev.shower = t >= FINALE_T.shower;
        if (!cardSent && t >= FINALE_T.card) { cardSent = true; ev.card = true; }
      }

      fireMat.emissiveIntensity = 2.0 + Math.sin(time * 5.1) * 0.15;
      // firework flashes decay quickly
      const decay = Math.exp(-dt * 3.2);
      flash.multiplyScalar(decay);
      tmpCol.copy(flash);

      halos.end(camPos, time, fog, pixelRatio);
      flames.end(camPos, time, fog, pixelRatio);
      sparks.end(camPos, time, fog, pixelRatio);
      starPts.end(camPos, time, fog, pixelRatio);
      lanternMat.uniforms.uTime.value = time;
      lanternMat.uniforms.uFogDensity.value = fog;
      return ev;
    },
    setFogColor(c) { lanternMat.uniforms.uFogColor.value.copy(c); },
  };

  function drawnTotal(tt) {
    let d = 0;
    for (const f of figures) d += clamp((tt - f.draw[0]) / (f.draw[1] - f.draw[0]), 0, 1) * f.segCount;
    return d;
  }
}
