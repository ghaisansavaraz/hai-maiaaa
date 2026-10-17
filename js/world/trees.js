/* Trees: an autumn grove at the entrance (the "seasons" nod), a dark ring of
   pines and broadleaves around the meadow, and a few lone trees inside it.
   Stylized: displaced icosahedron crowns with soft normals and per-vertex
   color, tapered bent trunks. Merged per 40m cell so frustum culling (camera
   and shadow) still works; crowns sway gently in the wind. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, noise2 } from './util.js';
import {
  lakeDist, pathEdgeDist, autumnAt, boundsDist, hillDist, greenhouseSdf, dapurSdf, DOCK, pierDist, BUNNY_HOME,
} from './layout.js';

const CELL = 40;

const PALETTES = {
  autumn: ['#e0662d', '#f08f35', '#f2bb52', '#c2481f', '#e57a30', '#d49a3e'],
  broad: ['#335a3a', '#3f6844', '#2b4d36', '#477048', '#365a46'],
  pine: ['#21423a', '#285046', '#1e3b36', '#2c5548'],
};

function colorize(g, fn) {
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const sway = new Float32Array(p.count);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const s = fn(p.getX(i), p.getY(i), p.getZ(i), c);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    sway[i] = s;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}

function blob(rng, radius, center, baseColor, groundY, crownH, detail = 1) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const p = g.attributes.position;
  const seed = rng() * 50;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise2(v.x * 1.4 + seed, v.y * 1.4 + v.z * 0.9) * 0.22 + noise2(v.x * 3 - seed, v.z * 3) * 0.08;
    v.multiplyScalar(1 + n);
    v.y *= 0.85;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  // soft normals: blend outward direction with face normal
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const nx = nrm.getX(i) * 0.12 + v.x * 0.88, ny = nrm.getY(i) * 0.12 + v.y * 0.88, nz = nrm.getZ(i) * 0.12 + v.z * 0.88;
    const l = Math.hypot(nx, ny, nz);
    nrm.setXYZ(i, nx / l, ny / l, nz / l);
  }
  g.translate(center.x, center.y, center.z);
  const base = new THREE.Color(baseColor);
  return colorize(g, (x, y, z, c) => {
    const up = THREE.MathUtils.clamp((y - (center.y - radius)) / (radius * 2), 0, 1);
    c.copy(base).multiplyScalar(0.62 + 0.55 * up + noise2(x * 2, z * 2) * 0.1);
    return THREE.MathUtils.clamp((y - groundY) / crownH, 0, 1);
  });
}

function trunk(rng, x, y, z, h, r, lean, hexColor) {
  const g = new THREE.CylinderGeometry(r * 0.55, r, h, 7, 5);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  const lx = Math.cos(lean.a) * lean.m, lz = Math.sin(lean.a) * lean.m;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / h;
    p.setX(i, p.getX(i) + lx * t * t + (rng() - 0.5) * 0.02);
    p.setZ(i, p.getZ(i) + lz * t * t + (rng() - 0.5) * 0.02);
  }
  g.computeVertexNormals();
  g.translate(x, y - 0.15, z);
  const col = new THREE.Color(hexColor);
  return colorize(g, (gx, gy, gz, c) => { c.copy(col).multiplyScalar(0.8 + noise2(gy * 2, gx) * 0.15); return 0; });
}

function broadleaf(rng, x, y, z, scale, palette, out, detail = 1) {
  const h = (3.2 + rng() * 2.6) * scale;
  const r = (0.16 + rng() * 0.1) * scale;
  const lean = { a: rng() * Math.PI * 2, m: rng() * 0.6 * scale };
  out.trunks.push(trunk(rng, x, y, z, h, r, lean, '#4a3527'));
  const top = new THREE.Vector3(x + Math.cos(lean.a) * lean.m, y + h, z + Math.sin(lean.a) * lean.m);
  const blobs = 8 + Math.floor(rng() * 5);
  const crownH = h + 3 * scale;
  for (let i = 0; i < blobs; i++) {
    // a fluffy dome of overlapping clumps rather than a few big boulders
    const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * 1.9 * scale;
    const rad = (0.8 + rng() * 0.75) * scale * (1.15 - rr / (2.4 * scale));
    const c = new THREE.Vector3(
      top.x + Math.cos(a) * rr,
      top.y + (0.3 + rng() * 1.5 - rr * 0.35) * scale,
      top.z + Math.sin(a) * rr,
    );
    out.leaves.push(blob(rng, rad, c, palette[Math.floor(rng() * palette.length)], y, crownH, detail));
  }
  return { x, z, r: r + 0.25 };
}

function pine(rng, x, y, z, scale, out) {
  const h = (7 + rng() * 6) * scale;
  const r = (0.18 + rng() * 0.08) * scale;
  out.trunks.push(trunk(rng, x, y, z, h * 0.35, r, { a: 0, m: 0 }, '#3e2c22'));
  const tiers = 4 + Math.floor(rng() * 2);
  const base = new THREE.Color(PALETTES.pine[Math.floor(rng() * PALETTES.pine.length)]);
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const rad = (2.4 - t * 1.7) * scale * (0.9 + rng() * 0.2);
    const ch = (3.2 - t * 1.2) * scale;
    const g = new THREE.ConeGeometry(rad, ch, 9, 2).toNonIndexed();
    const pp = g.attributes.position;
    for (let k = 0; k < pp.count; k++) {
      const vx = pp.getX(k), vz = pp.getZ(k);
      const n = noise2(vx * 2 + i, vz * 2) * 0.12;
      pp.setX(k, vx * (1 + n));
      pp.setZ(k, vz * (1 + n));
    }
    g.computeVertexNormals();
    const cy = y + h * 0.28 + t * h * 0.7 + ch / 2;
    g.translate(x, cy, z);
    out.leaves.push(colorize(g, (gx, gy, gz, c) => {
      const up = THREE.MathUtils.clamp((gy - (cy - ch / 2)) / ch, 0, 1);
      c.copy(base).multiplyScalar(0.55 + 0.55 * up);
      return THREE.MathUtils.clamp((gy - y) / (h * 1.1), 0, 1);
    }));
  }
  return { x, z, r: r + 0.3 };
}

export function createTrees(hf, shared) {
  const rng = mulberry32(1919);
  const cells = new Map();
  const colliders = [];
  const placed = [];
  const cellFor = (x, z) => {
    const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
    if (!cells.has(key)) cells.set(key, { trunks: [], leaves: [] });
    return cells.get(key);
  };
  const free = (x, z, minD) => placed.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > minD * minD);
  const blocked = (x, z) =>
    lakeDist(x, z) < 1.18 || pathEdgeDist(x, z) < 2.6 || greenhouseSdf(x, z) < 3.5 || dapurSdf(x, z) < 3.5 ||
    hillDist(x, z) < 10 || pierDist(x, z) < 4 ||
    Math.hypot(x - BUNNY_HOME.x, z - BUNNY_HOME.z) < BUNNY_HOME.r * 0.6;

  // autumn grove framing the entrance
  for (let tries = 0; tries < 3000 && placed.length < 70; tries++) {
    const x = (rng() - 0.5) * 120, z = 52 + rng() * 66;
    if (autumnAt(x, z) < 0.5 || boundsDist(x, z) > 1.05 || blocked(x, z) || !free(x, z, 5.2)) continue;
    const y = hf.sample(x, z);
    placed.push([x, z]);
    colliders.push(broadleaf(rng, x, y, z, 0.85 + rng() * 0.45, PALETTES.autumn, cellFor(x, z), 2));
  }
  // treeline ring around the meadow
  for (let tries = 0; tries < 9000; tries++) {
    const a = rng() * Math.PI * 2;
    const bd = 0.9 + rng() * 0.42;
    const x = Math.cos(a) * 98 * bd, z = Math.sin(a) * 120 * bd;
    if (blocked(x, z) || autumnAt(x, z) > 0.4 || !free(x, z, bd > 1.05 ? 4.6 : 5.6)) continue;
    const y = hf.sample(x, z);
    placed.push([x, z]);
    const cell = cellFor(x, z);
    const c = rng() < 0.55 ? pine(rng, x, y, z, 0.9 + rng() * 0.5, cell) : broadleaf(rng, x, y, z, 1.1 + rng() * 0.5, PALETTES.broad, cell);
    if (bd < 1.02) colliders.push(c);
  }
  // a few lone trees in the meadow and on the hill flanks
  const lone = [[-52, 16], [-44, -26], [42, -38], [-30, -52], [26, 40], [48, 22], [-18, -40], [36, -66], [-34, -74]];
  for (const [x, z] of lone) {
    if (blocked(x, z)) continue;
    const y = hf.sample(x, z);
    placed.push([x, z]);
    colliders.push(rng() < 0.4 ? pine(rng, x, y, z, 1.1, cellFor(x, z)) : broadleaf(rng, x, y, z, 1.35, PALETTES.broad, cellFor(x, z), 2));
  }

  const trunkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  leafMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uMoonView = shared.uMoonView;
    // backlit leaves: glow softly when she looks toward the moon through them
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uMoonView;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float back = pow(max(dot(-normalize(vViewPosition), uMoonView), 0.0), 5.0);
        totalEmissiveRadiance += vColor.rgb * back * 0.55;`);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float aSway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float sw = aSway * aSway;
        float ph = position.x * 0.08 + position.z * 0.06;
        transformed.x += (sin(uTime * 0.9 + ph) * 0.12 + sin(uTime * 2.3 + ph * 3.0) * 0.03) * sw;
        transformed.z += cos(uTime * 0.7 + ph) * 0.09 * sw;`);
  };

  const group = new THREE.Group();
  for (const cell of cells.values()) {
    if (cell.trunks.length) {
      const m = new THREE.Mesh(mergeGeometries(cell.trunks.map((g) => g.index ? g.toNonIndexed() : g)), trunkMat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    }
    if (cell.leaves.length) {
      const m = new THREE.Mesh(mergeGeometries(cell.leaves.map((g) => g.index ? g.toNonIndexed() : g)), leafMat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    }
  }
  return { group, colliders };
}
