/* Night sky: gradient dome with procedural twinkling stars, a Milky Way band,
   a faint aurora on the northern horizon, the real moon (moonmap.jpg) with a
   soft halo, and shooting stars. The sky GLSL is shared with the lake so the
   water reflects the same sky. */

import * as THREE from 'three';
import { glowTexture } from './util.js';
import { MOON_DIR } from './layout.js';

export function createSkyUniforms() {
  return {
    uZenith: { value: new THREE.Color('#040917') },
    uHorizon: { value: new THREE.Color('#1a2a4a') },
    uDuskGlow: { value: new THREE.Color('#b8765e') },
    uDusk: { value: 0 },
    uMoonDir: { value: new THREE.Vector3(...MOON_DIR) },
    uTime: { value: 0 },
    uStarBoost: { value: 1 },
    uAurora: { value: 0.35 },
  };
}

export const SKY_GLSL = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uDuskGlow;
uniform float uDusk;
uniform vec3 uMoonDir;
uniform float uTime;
uniform float uStarBoost;
uniform float uAurora;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
             mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
float fbm3(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise3(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s;
}

// One layer of stars: each 3D cell may hold one star, anti-aliased with fwidth.
float starLayer(vec3 dir, float scale, float threshold, float t) {
  vec3 p = dir * scale;
  vec3 cell = floor(p);
  vec3 h = hash33(cell);
  if (h.x < threshold) return 0.0;
  vec3 starPos = cell + 0.2 + h.zxy * 0.6;
  float d = length(p - starPos);
  float size = mix(0.06, 0.16, pow(h.y, 5.0));
  float aa = length(fwidth(p)) * 0.9;
  float r = max(size, aa);
  float core = (1.0 - smoothstep(0.0, r, d)) * (size * size) / (r * r);
  float tw = 0.6 + 0.4 * sin(t * (0.8 + h.z * 2.6) + h.y * 40.0);
  return core * tw * mix(0.5, 2.2, pow(h.z, 4.0));
}

vec3 skyColor(vec3 dir, float starAmt) {
  float y = dir.y;
  float t = clamp(y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(t, 0.42));
  col = mix(col, uHorizon * 0.8, smoothstep(0.0, -0.2, y));

  // last light of dusk toward the south-west
  vec3 sunDir = normalize(vec3(0.55, -0.04, 0.83));
  float sd = max(dot(dir, sunDir), 0.0);
  col += uDuskGlow * pow(sd, 3.0) * (1.0 - smoothstep(-0.05, 0.4, y)) * uDusk;

  // horizon haze band
  col += uHorizon * 0.22 * exp(-abs(y) * 12.0);

  // broad moon glow in the atmosphere
  float md = max(dot(dir, uMoonDir), 0.0);
  col += vec3(0.50, 0.58, 0.85) * (pow(md, 10.0) * 0.045 + pow(md, 90.0) * 0.12 + pow(md, 900.0) * 0.35);

  if (starAmt > 0.0) {
    float above = smoothstep(-0.02, 0.22, y);
    float glare = 1.0 - smoothstep(0.975, 0.997, md);

    // Milky Way: a soft band along a great circle, clumpy, with a dark rift
    vec3 mwN = normalize(vec3(0.42, 0.52, -0.74));
    float band = dot(dir, mwN);
    float mw = exp(-band * band / 0.03);
    float clouds = fbm3(dir * 4.5 + 3.0);
    float dust = fbm3(dir * 10.0 - 5.0);
    float mwGlow = mw * smoothstep(0.3, 0.75, clouds) * (0.55 + 0.45 * dust);
    mwGlow *= 1.0 - 0.65 * exp(-band * band / 0.004) * smoothstep(0.42, 0.68, dust);
    col += mwGlow * vec3(0.42, 0.42, 0.62) * 0.07 * above * uStarBoost * (1.0 - uDusk * 0.6);

    float s = starLayer(dir, 165.0, 0.92 - mw * 0.06, uTime)
            + starLayer(dir, 82.0, 0.955, uTime * 0.8) * 1.3
            + starLayer(dir, 330.0, 0.85 - mw * 0.1, uTime * 1.2) * 0.45;
    vec3 tint = mix(vec3(0.72, 0.8, 1.0), vec3(1.0, 0.88, 0.72), hash13(floor(dir * 165.0)));
    col += s * tint * above * glare * starAmt * uStarBoost * (1.0 - uDusk * 0.55);

    // faint aurora curtains low in the north-east
    float az = atan(dir.x, -dir.z);
    float curtain = smoothstep(0.03, 0.12, y) * (1.0 - smoothstep(0.12, 0.45, y));
    float north = smoothstep(0.0, 0.7, -dir.z) * smoothstep(-0.6, 0.4, dir.x);
    float wave = fbm3(vec3(az * 3.2, y * 2.0, uTime * 0.025));
    float rays = 0.6 + 0.4 * sin(az * 60.0 + wave * 8.0);
    vec3 aur = mix(vec3(0.1, 0.75, 0.55), vec3(0.75, 0.3, 0.6), smoothstep(0.12, 0.38, y));
    col += aur * curtain * north * smoothstep(0.45, 0.8, wave) * rays * 0.05 * uAurora * starAmt;
  }
  return col;
}
`;

export function createSky(scene, skyUniforms) {
  const group = new THREE.Group();

  // --- dome ---
  const domeMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld - cameraPosition);
        gl_FragColor = vec4(skyColor(dir, 1.0), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), domeMat);
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  // --- moon ---
  const moonTex = new THREE.TextureLoader().load('assets/moon/moonmap.jpg');
  moonTex.colorSpace = THREE.SRGBColorSpace;
  moonTex.anisotropy = 4;
  const moonMat = new THREE.MeshBasicMaterial({ map: moonTex, color: new THREE.Color(1.75, 1.72, 1.62), fog: false });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(34, 48, 32), moonMat);
  moon.rotation.set(0.15, -1.9, 0.1); // show a nice face of the maria
  moon.frustumCulled = false;
  moon.renderOrder = -9;
  group.add(moon);

  const haloTex = glowTexture(256, 2.6);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, color: new THREE.Color(0.55, 0.65, 1.0), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.55,
  }));
  halo.scale.setScalar(360);
  halo.renderOrder = -8;
  group.add(halo);

  const outerHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, color: new THREE.Color(0.35, 0.42, 0.8), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.22,
  }));
  outerHalo.scale.setScalar(900);
  outerHalo.renderOrder = -8;
  group.add(outerHalo);

  scene.add(group);

  const moonDir = new THREE.Vector3(...MOON_DIR);
  const shooting = new ShootingStars(scene);
  let moonBoost = 0;

  return {
    moon, halo,
    update(dt, camera, opts = {}) {
      dome.position.copy(camera.position);
      moon.position.copy(camera.position).addScaledVector(moonDir, 720);
      halo.position.copy(camera.position).addScaledVector(moonDir, 740);
      outerHalo.position.copy(camera.position).addScaledVector(moonDir, 760);
      moon.rotation.y += dt * 0.002;
      const target = opts.celebrate ? 1 : 0;
      moonBoost += (target - moonBoost) * Math.min(1, dt * 0.6);
      halo.material.opacity = 0.55 + moonBoost * 0.35;
      halo.scale.setScalar(360 + moonBoost * 120);
      shooting.update(dt, camera, opts.celebrate ? 5 : 0.05);
    },
  };
}

/* ---------------- shooting stars ---------------- */

class ShootingStars {
  constructor(scene) {
    this.pool = [];
    this.timer = 6;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aT;
        varying float vT;
        void main() { vT = aT; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uAlpha;
        varying float vT;
        void main() {
          float a = pow(clamp(vT, 0.0, 1.0), 2.2) * uAlpha;
          gl_FragColor = vec4(vec3(1.0, 0.94, 0.86) * 4.0, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
      geo.setAttribute('aT', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 1]), 1));
      geo.setIndex([0, 1, 2, 1, 3, 2]);
      const m = mat.clone();
      const mesh = new THREE.Mesh(geo, m);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = -7;
      scene.add(mesh);
      this.pool.push({ mesh, active: false });
    }
    this._head = new THREE.Vector3();
    this._tail = new THREE.Vector3();
    this._side = new THREE.Vector3();
    this._view = new THREE.Vector3();
  }

  spawn(camera, shower) {
    const s = this.pool.find((p) => !p.active);
    if (!s) return;
    // fall roughly where she is looking (a shower is no fun behind your back)
    camera.getWorldDirection(this._view);
    const camAz = Math.atan2(this._view.x, -this._view.z);
    const az = camAz + (Math.random() - 0.5) * (shower ? 2.0 : 3.0);
    const el = shower ? 0.22 + Math.random() * 0.6 : 0.35 + Math.random() * 0.75;
    const start = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));
    const tangent = new THREE.Vector3().crossVectors(start, new THREE.Vector3(0, 1, 0)).normalize();
    if (Math.random() < 0.5) tangent.negate();
    tangent.addScaledVector(new THREE.Vector3(0, -1, 0), 0.6).normalize();
    s.start = start;
    s.axis = new THREE.Vector3().crossVectors(start, tangent).normalize();
    s.speed = 0.35 + Math.random() * 0.3;
    s.len = 0.07 + Math.random() * 0.1;
    s.dur = 0.9 + Math.random() * 0.8;
    s.t = 0;
    s.width = 1.5 + Math.random() * 1.2;
    s.active = true;
    s.mesh.visible = true;
  }

  update(dt, camera, ratePerSec) {
    const mean = 1 / Math.max(ratePerSec, 0.0001);
    // when the rate jumps (the finale), don't wait out the old slow timer
    this.timer = Math.min(this.timer, mean * 1.5) - dt;
    if (this.timer <= 0) {
      this.spawn(camera, ratePerSec > 1);
      this.timer = mean * (0.5 + Math.random());
    }
    for (const s of this.pool) {
      if (!s.active) continue;
      s.t += dt;
      const k = s.t / s.dur;
      if (k >= 1) { s.active = false; s.mesh.visible = false; continue; }
      const ang = s.t * s.speed;
      this._head.copy(s.start).applyAxisAngle(s.axis, ang);
      this._tail.copy(s.start).applyAxisAngle(s.axis, Math.max(0, ang - s.len));
      const R = 640;
      const h = this._head.multiplyScalar(R).add(camera.position);
      const tl = this._tail.multiplyScalar(R).add(camera.position);
      this._view.subVectors(h, camera.position);
      this._side.subVectors(h, tl).cross(this._view).normalize().multiplyScalar(s.width);
      const pos = s.mesh.geometry.attributes.position;
      pos.setXYZ(0, tl.x - this._side.x * 0.2, tl.y - this._side.y * 0.2, tl.z - this._side.z * 0.2);
      pos.setXYZ(1, tl.x + this._side.x * 0.2, tl.y + this._side.y * 0.2, tl.z + this._side.z * 0.2);
      pos.setXYZ(2, h.x - this._side.x, h.y - this._side.y, h.z - this._side.z);
      pos.setXYZ(3, h.x + this._side.x, h.y + this._side.y, h.z + this._side.z);
      pos.needsUpdate = true;
      s.mesh.material.uniforms.uAlpha.value = Math.min(1, k / 0.12) * (1 - Math.max(0, (k - 0.6) / 0.4));
    }
  }
}
