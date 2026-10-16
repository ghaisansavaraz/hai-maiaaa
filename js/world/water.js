/* The lake. Instead of an expensive mirror render it reflects the same
   procedural sky analytically, so it's cheap but gorgeous: fresnel, slow wind
   ripples, a long glittering moon path, warm glints from the lanterns, dark
   tree-line silhouettes near the horizon, and the occasional fish-ring
   ripple spreading out. */

import * as THREE from 'three';
import { SKY_GLSL } from './sky.js';
import { LAKE } from './layout.js';
import { MAX_LIGHTS } from './grass.js';

export function createWater(skyUniforms, shared) {
  const ripples = [];
  for (let i = 0; i < 4; i++) ripples.push(new THREE.Vector4(0, 0, -100, 0));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...skyUniforms,
      uCamPos: shared.uCamPos,
      uFogColor: shared.uFogColor,
      uFogDensity: shared.uFogDensity,
      uLights: shared.uLights,
      uLightCols: shared.uLightCols,
      uRipples: { value: ripples },
      uLake: { value: new THREE.Vector4(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      #define LIGHTS ${MAX_LIGHTS}
      ${SKY_GLSL}
      uniform vec3 uCamPos;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec4 uLights[LIGHTS];
      uniform vec3 uLightCols[LIGHTS];
      uniform vec4 uRipples[4];
      uniform vec4 uLake;
      varying vec3 vWorld;

      float waveH(vec2 p) {
        float t = uTime;
        float h = 0.0;
        h += sin(dot(p, vec2(0.62, 0.21)) * 1.1 + t * 0.9) * 0.018;
        h += sin(dot(p, vec2(-0.33, 0.71)) * 1.7 + t * 1.25) * 0.012;
        h += sin(dot(p, vec2(0.85, -0.44)) * 3.1 + t * 1.9) * 0.006;
        h += (vnoise3(vec3(p * 1.6, t * 0.35)) - 0.5) * 0.02;
        h += (vnoise3(vec3(p * 4.5, t * 0.6 + 3.0)) - 0.5) * 0.008;
        for (int i = 0; i < 4; i++) {
          float age = t - uRipples[i].z;
          if (age < 0.0 || age > 7.0) continue;
          float r = distance(p, uRipples[i].xy);
          float front = age * 1.3;
          float dr = (r - front) * 2.2;
          float env = exp(-dr * dr) * exp(-age * 0.55) * uRipples[i].w;
          h += sin((r - front) * 11.0) * 0.02 * env;
        }
        return h;
      }

      void main() {
        vec2 p = vWorld.xz;
        float e = 0.05;
        float hx = waveH(p + vec2(e, 0.0)) - waveH(p - vec2(e, 0.0));
        float hz = waveH(p + vec2(0.0, e)) - waveH(p - vec2(0.0, e));
        vec3 N = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));

        vec3 V = normalize(uCamPos - vWorld);
        float ndv = max(dot(N, V), 0.0);
        float fres = 0.02 + 0.98 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0);

        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        vec3 refl = skyColor(R, 0.6);
        // tree line / hills block the low sky: darken reflections near the horizon
        refl = mix(vec3(0.004, 0.007, 0.012), refl, smoothstep(0.02, 0.16, R.y));

        float md = max(dot(R, uMoonDir), 0.0);
        refl += vec3(0.95, 0.97, 1.1) * (pow(md, 2600.0) * 55.0 + pow(md, 220.0) * 1.6 + pow(md, 28.0) * 0.07);

        for (int i = 0; i < LIGHTS; i++) {
          vec3 L = uLights[i].xyz - vWorld;
          float d = length(L);
          float g = pow(max(dot(R, L / d), 0.0), 380.0);
          refl += uLightCols[i] * g * uLights[i].w * 0.6 / (1.0 + d * 0.15);
        }

        vec3 deep = vec3(0.004, 0.011, 0.02);
        vec3 col = mix(deep, refl, fres);

        // moon path: a column of dancing glints along the bearing toward the moon
        vec2 toFrag = vWorld.xz - uCamPos.xz;
        float bearing = dot(normalize(toFrag), normalize(uMoonDir.xz));
        float column = smoothstep(0.9965, 0.99985, bearing) * step(0.0, uMoonDir.y);
        float s1 = vnoise3(vec3(p * 6.0, uTime * 1.6));
        float s2 = vnoise3(vec3(p * 11.0 + 7.0, uTime * 2.3));
        float glint = smoothstep(0.5, 0.78, s1) * smoothstep(0.45, 0.75, s2);
        float reach = smoothstep(1.5, 9.0, length(toFrag));
        col += vec3(0.85, 0.9, 1.05) * column * reach * (glint * 3.6 + 0.08) * mix(0.45, 1.0, fres);

        float ld = length((vWorld.xz - uLake.xy) / uLake.zw);
        float alpha = 1.0 - smoothstep(1.02, 1.12, ld);

        float fogD = distance(vWorld, uCamPos);
        float f = 1.0 - exp(-pow(uFogDensity * fogD, 2.0));
        col = mix(col, uFogColor, f);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
  });

  const geo = new THREE.PlaneGeometry(LAKE.rx * 2 + 10, LAKE.rz * 2 + 10, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(LAKE.cx, 0, LAKE.cz);

  let next = 3 + Math.random() * 5;
  let slot = 0;
  return {
    mesh,
    update(dt, time) {
      next -= dt;
      if (next <= 0) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.75;
        ripples[slot].set(LAKE.cx + Math.cos(a) * LAKE.rx * r, LAKE.cz + Math.sin(a) * LAKE.rz * r, time, 0.6 + Math.random() * 0.6);
        slot = (slot + 1) % ripples.length;
        next = 4 + Math.random() * 9;
      }
    },
  };
}
