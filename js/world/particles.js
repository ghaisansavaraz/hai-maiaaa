/* Particles, all GPU-animated: blinking fireflies (they rise into the sky in
   the birthday ending), drifting petals that become tumbling autumn leaves in
   the grove, low mist over the water, and small bursts of warm motes / hearts
   when she lights a lantern or says hi to the bunny. */

import * as THREE from 'three';
import { mulberry32, cloudTexture } from './util.js';
import {
  LAKE, BOUNDS, lakeDist, pathEdgeDist, boundsDist, autumnAt, greenhouseSdf,
} from './layout.js';

/* ---------------- fireflies ---------------- */

export function createFireflies(hf, shared, count = 900) {
  const rng = mulberry32(99);
  const base = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  let n = 0;
  for (let tries = 0; tries < count * 30 && n < count; tries++) {
    const x = (rng() - 0.5) * BOUNDS.rx * 2, z = (rng() - 0.5) * BOUNDS.rz * 2;
    if (boundsDist(x, z) > 0.95) continue;
    const ld = lakeDist(x, z);
    // favor the lakeshore, the greenhouse and the path; fewer in the grove
    let w = 0.25;
    if (ld > 0.85 && ld < 1.5) w += 0.75;
    if (greenhouseSdf(x, z) < 10) w += 0.45;
    if (pathEdgeDist(x, z) < 6) w += 0.3;
    w *= 1 - autumnAt(x, z) * 0.6;
    if (rng() > w) continue;
    const ground = Math.max(hf.sample(x, z), 0);
    base[n * 3] = x; base[n * 3 + 1] = ground + 0.5 + rng() * 1.9; base[n * 3 + 2] = z;
    seed[n * 4] = rng(); seed[n * 4 + 1] = rng(); seed[n * 4 + 2] = rng(); seed[n * 4 + 3] = rng();
    n++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(base, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geo.setDrawRange(0, n);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uCamPos: shared.uCamPos,
      uFogDensity: shared.uFogDensity,
      uPixelRatio: { value: 1 },
      uCelebrate: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCamPos;
      uniform float uFogDensity;
      uniform float uPixelRatio;
      uniform float uCelebrate;
      attribute vec4 aSeed;
      varying float vAlpha;
      varying float vWarm;
      void main() {
        vec3 p = position;
        float t = uTime * (0.22 + aSeed.x * 0.3);
        p.x += sin(t + aSeed.y * 6.28) * 1.5 + sin(t * 2.3 + aSeed.z * 9.0) * 0.35;
        p.z += cos(t * 0.8 + aSeed.z * 6.28) * 1.5 + cos(t * 1.7 + aSeed.w * 5.0) * 0.3;
        p.y += sin(t * 1.6 + aSeed.w * 6.28) * 0.4;

        // birthday ending: they drift up into the sky in slow waves
        float cyc = fract(uTime * 0.035 + aSeed.x);
        p.y += uCelebrate * cyc * 34.0;
        float cycFade = mix(1.0, smoothstep(0.0, 0.08, cyc) * (1.0 - smoothstep(0.75, 1.0, cyc)), uCelebrate);

        float blink = pow(max(sin(uTime * (0.55 + aSeed.w * 1.3) + aSeed.y * 40.0), 0.0), 2.5);
        blink = mix(blink, 0.85 + 0.15 * blink, uCelebrate);

        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        gl_PointSize = clamp((0.16 + aSeed.x * 0.12) * uPixelRatio * 820.0 / max(dist, 0.5), 1.5, 42.0);
        float fog = exp(-pow(uFogDensity * dist * 0.75, 2.0));
        float far = 1.0 - smoothstep(55.0, 75.0, distance(p.xz, uCamPos.xz));
        vAlpha = blink * fog * far * cycFade;
        vWarm = aSeed.z;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vWarm;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = 1.0 - smoothstep(0.0, 0.5, d);
        float a = core * core * vAlpha;
        if (a < 0.002) discard;
        vec3 col = mix(vec3(0.85, 1.0, 0.45), vec3(1.0, 0.82, 0.4), vWarm);
        gl_FragColor = vec4(col * 3.2, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, material: mat, count: n };
}

/* ---------------- drifting petals / autumn leaves ---------------- */

export function createDrift(shared, count = 520) {
  const rng = mulberry32(7);
  const start = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    start[i * 3] = rng() * 44; start[i * 3 + 1] = rng() * 12; start[i * 3 + 2] = rng() * 44;
    seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = rng(); seed[i * 4 + 3] = rng();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime, uCamPos: shared.uCamPos, uFogDensity: shared.uFogDensity,
      uMoonColor: shared.uMoonColor, uSkyAmb: shared.uSkyAmb,
      uPixelRatio: { value: 1 }, uSwirl: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCamPos;
      uniform float uFogDensity;
      uniform float uPixelRatio;
      uniform float uSwirl;
      attribute vec4 aSeed;
      varying float vAlpha;
      varying float vLeaf;
      varying float vRot;
      varying vec3 vTint;
      void main() {
        float t = uTime;
        vec3 p = position;
        p += vec3(t * 0.55, -t * (0.18 + aSeed.x * 0.22), t * 0.22);
        p.x += sin(t * 0.7 + aSeed.y * 6.28) * 1.3;
        p.z += cos(t * 0.5 + aSeed.z * 6.28) * 1.3;
        // swirl around her during the ending
        float sa = t * (0.4 + aSeed.w * 0.4) + aSeed.y * 6.28;
        p.xz += vec2(cos(sa), sin(sa)) * uSwirl * (2.0 + aSeed.z * 4.0);
        p.xz = mod(p.xz - uCamPos.xz + 22.0, 44.0) - 22.0 + uCamPos.xz;
        p.y = mod(p.y - uCamPos.y + 3.0, 12.0) - 3.0 + uCamPos.y;

        float autumn = smoothstep(50.0, 66.0, p.z);
        vLeaf = step(aSeed.w, autumn);
        vRot = t * (0.6 + aSeed.x * 2.0) * (vLeaf > 0.5 ? 1.6 : 0.8) + aSeed.z * 6.28;
        vec3 petal = mix(vec3(0.95, 0.82, 0.78), vec3(1.0, 0.95, 0.9), aSeed.y);
        vec3 leaf = mix(vec3(0.75, 0.28, 0.08), vec3(0.95, 0.62, 0.18), aSeed.y);
        vTint = mix(petal, leaf, vLeaf);

        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        float size = mix(0.05, 0.11, vLeaf) * (0.7 + aSeed.x * 0.6);
        gl_PointSize = clamp(size * uPixelRatio * 900.0 / max(dist, 0.3), 1.0, 48.0);
        float fog = exp(-pow(uFogDensity * dist, 2.0));
        vAlpha = fog * (1.0 - smoothstep(16.0, 22.0, length(p.xz - uCamPos.xz))) * mix(0.55, 1.0, uSwirl);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMoonColor;
      uniform vec3 uSkyAmb;
      uniform float uSwirl;
      varying float vAlpha;
      varying float vLeaf;
      varying float vRot;
      varying vec3 vTint;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float cs = cos(vRot), sn = sin(vRot);
        c = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
        // petal: soft teardrop; leaf: pointed ellipse
        vec2 q = c * vec2(mix(2.6, 2.2, vLeaf), mix(1.7, 1.25, vLeaf));
        float d = length(q) + (vLeaf > 0.5 ? abs(c.x) * 0.9 : c.y * 0.35);
        float a = (1.0 - smoothstep(0.42, 0.5, d)) * vAlpha;
        if (a < 0.01) discard;
        vec3 light = (uMoonColor * 0.55 + uSkyAmb) * 0.32 + uSwirl * 0.25;
        gl_FragColor = vec4(vTint * light, a * 0.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, material: mat };
}

/* ---------------- mist ---------------- */

export function createMist() {
  const rng = mulberry32(3);
  const tex = cloudTexture(128);
  const group = new THREE.Group();
  const sprites = [];
  for (let i = 0; i < 30; i++) {
    const overLake = i < 20;
    let x, z, y;
    if (overLake) {
      const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 1.05;
      x = LAKE.cx + Math.cos(a) * LAKE.rx * r; z = LAKE.cz + Math.sin(a) * LAKE.rz * r; y = 0.35 + rng() * 0.6;
    } else {
      x = (rng() - 0.5) * 120; z = -30 + (rng() - 0.5) * 80; y = 1.2 + rng() * 1.5;
    }
    const mat = new THREE.SpriteMaterial({
      map: tex, color: new THREE.Color('#8ea3cc'), transparent: true, depthWrite: false,
      opacity: overLake ? 0.07 + rng() * 0.06 : 0.04 + rng() * 0.03, rotation: rng() * Math.PI,
    });
    const s = new THREE.Sprite(mat);
    s.position.set(x, y, z);
    s.scale.setScalar(overLake ? 7 + rng() * 6 : 10 + rng() * 8);
    group.add(s);
    sprites.push({ s, x, z, phase: rng() * 6.28, speed: 0.05 + rng() * 0.08 });
  }
  return {
    group,
    update(t) {
      for (const m of sprites) {
        m.s.position.x = m.x + Math.sin(t * m.speed + m.phase) * 2.5;
        m.s.position.z = m.z + Math.cos(t * m.speed * 0.8 + m.phase) * 1.8;
        m.s.material.rotation += 0.0006;
      }
    },
  };
}

/* ---------------- bursts (lantern motes, bunny hearts) ---------------- */

export function createBursts() {
  const N = 240;
  const pos = new Float32Array(N * 3);
  const data = new Float32Array(N * 4); // size, alpha, shape(0 glow / 1 heart), warm
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      attribute vec4 aData;
      varying vec4 vData;
      void main() {
        vData = aData;
        vec4 mv = viewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aData.x * uPixelRatio * 900.0 / max(-mv.z, 0.2), 1.0, 64.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vData;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a;
        if (vData.z > 0.5) {
          vec2 p = vec2(c.x, -c.y + 0.08) * 2.6;
          p.y -= sqrt(abs(p.x)) * 0.5;
          a = 1.0 - smoothstep(0.55, 0.65, length(p));
        } else {
          a = pow(1.0 - smoothstep(0.0, 0.5, length(c)), 2.0);
        }
        a *= vData.y;
        if (a < 0.003) discard;
        vec3 col = vData.z > 0.5 ? vec3(1.0, 0.45, 0.6) * 1.6 : mix(vec3(1.0, 0.75, 0.4), vec3(1.0, 0.9, 0.7), vData.w) * 3.0;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const parts = [];
  for (let i = 0; i < N; i++) parts.push({ life: 0, max: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, size: 0.05, heart: 0, warm: 0 });

  return {
    points, material: mat,
    emit(center, count, heart = false) {
      let made = 0;
      for (const p of parts) {
        if (p.life > 0) continue;
        p.life = p.max = heart ? 1.6 + Math.random() * 0.6 : 1.8 + Math.random() * 1.6;
        p.x = center.x + (Math.random() - 0.5) * 0.3;
        p.y = center.y + (Math.random() - 0.5) * 0.3;
        p.z = center.z + (Math.random() - 0.5) * 0.3;
        const a = Math.random() * Math.PI * 2;
        const sp = heart ? 0.25 : 0.35 + Math.random() * 0.5;
        p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp;
        p.vy = heart ? 0.5 + Math.random() * 0.4 : 0.4 + Math.random() * 0.9;
        p.size = heart ? 0.07 + Math.random() * 0.04 : 0.03 + Math.random() * 0.05;
        p.heart = heart ? 1 : 0;
        p.warm = Math.random();
        if (++made >= count) break;
      }
    },
    update(dt) {
      for (let i = 0; i < N; i++) {
        const p = parts[i];
        if (p.life > 0) {
          p.life -= dt;
          p.vx *= 1 - dt * 0.8; p.vz *= 1 - dt * 0.8; p.vy *= 1 - dt * 0.3;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          if (p.heart) p.x += Math.sin(p.life * 6 + i) * dt * 0.15;
        }
        const k = Math.max(p.life, 0) / p.max;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.life > 0 ? p.y : -999; pos[i * 3 + 2] = p.z;
        data[i * 4] = p.size; data[i * 4 + 1] = Math.min(1, k * 2.5) * Math.min(1, (1 - k) * 6 + 0.2);
        data[i * 4 + 2] = p.heart; data[i * 4 + 3] = p.warm;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aData.needsUpdate = true;
    },
  };
}
