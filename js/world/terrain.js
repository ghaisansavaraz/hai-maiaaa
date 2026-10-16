/* Ground: one big heightfield mesh painted by region (meadow, worn paths,
   autumn leaf litter, wet shoreline, lake bed, hilltop plaza), plus rocks,
   fallen leaves, lily pads, water lilies and the little wooden dock. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, fbm2, noise2, smoothstep, detailTexture, tileTexture } from './util.js';
import {
  LAKE, HILL, DOCK, HILLTOP_Y,
  lakeDist, pathEdgeDist, autumnAt, boundsDist, hillDist, greenhouseSdf,
} from './layout.js';

const C = (hex) => new THREE.Color(hex);
const PAL = {
  grassA: C('#284625'), grassB: C('#3e6034'), grassDry: C('#55603a'),
  autumnGround: C('#4f3518'), autumnLeaf: C('#7a3416'),
  path: C('#5a4632'), pathCenter: C('#6b573e'),
  shore: C('#6e624a'), wet: C('#463f33'), lakeBed: C('#232c27'),
  ridge: C('#2a3a2b'), plaza: C('#7f7a6c'),
};

export function createTerrain(hf) {
  const geo = new THREE.PlaneGeometry(hf.size, hf.size, hf.seg, hf.seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  const tmp = new THREE.Color();

  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    const h = hf.data[k];
    pos.setY(k, h);

    // meadow base with soft patches
    const patch = fbm2(x * 0.05, z * 0.05, 3) * 0.5 + 0.5;
    col.copy(PAL.grassA).lerp(PAL.grassB, patch);
    col.lerp(PAL.grassDry, smoothstep(0.55, 0.9, fbm2(x * 0.02 + 30, z * 0.02, 2) * 0.5 + 0.5) * 0.5);

    // autumn grove: warm leaf litter
    const aut = autumnAt(x, z);
    if (aut > 0) {
      tmp.copy(PAL.autumnGround).lerp(PAL.autumnLeaf, noise2(x * 0.4, z * 0.4) * 0.5 + 0.5);
      col.lerp(tmp, aut * 0.85);
    }

    // worn paths
    // ragged, organic edges: noise nudges where the path ends
    const pe = pathEdgeDist(x, z) + noise2(x * 0.7, z * 0.7) * 0.35;
    if (pe < 1.4) {
      tmp.copy(PAL.path).lerp(PAL.pathCenter, smoothstep(0.2, -0.9, pe));
      tmp.multiplyScalar(0.85 + noise2(x * 1.3, z * 1.3) * 0.15);
      if (aut > 0) tmp.lerp(PAL.autumnLeaf, aut * 0.35 * (noise2(x * 2.1, z * 2.1) * 0.5 + 0.5));
      col.lerp(tmp, 1 - smoothstep(-0.5, 1.2, pe));
    }

    // shore + lake bed
    const ld = lakeDist(x, z);
    if (ld < 1.35) {
      if (h < 0.0) col.lerp(PAL.lakeBed, smoothstep(0.0, -0.6, h));
      else col.lerp(PAL.wet, (1 - smoothstep(0.0, 0.45, h)) * (1 - smoothstep(1.0, 1.3, ld)));
      if (h >= 0.0 && h < 0.9) col.lerp(PAL.shore, (1 - smoothstep(0.3, 0.9, h)) * 0.4);
    }

    // hilltop plaza ring + beyond-bounds ridges
    const hd = hillDist(x, z);
    if (hd < 7.5) col.lerp(PAL.plaza, (1 - smoothstep(5.0, 7.5, hd)) * 0.7);
    col.lerp(PAL.ridge, smoothstep(0.98, 1.3, boundsDist(x, z)));
    if (greenhouseSdf(x, z) < 0.6) col.lerp(PAL.path, 0.5);

    colors[k * 3] = col.r; colors[k * 3 + 1] = col.g; colors[k * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const tex = detailTexture(256);
  tex.repeat.set(110, 110);
  tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 0.96, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------------- rocks ---------------- */

function rockGeometry(rng, radius) {
  const g = new THREE.IcosahedronGeometry(radius, 1);
  const p = g.attributes.position;
  const seed = rng() * 100;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = noise2(v.x * 2.2 + seed, v.z * 2.2 + v.y * 1.7) * 0.28 + noise2(v.x * 5 - seed, v.y * 5) * 0.08;
    v.multiplyScalar(1 + n);
    v.y *= 0.62;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function createRocks(hf) {
  const rng = mulberry32(31);
  const parts = [];
  const colliders = [];
  const place = (x, z, r) => {
    const g = rockGeometry(rng, r);
    g.rotateY(rng() * Math.PI * 2);
    g.translate(x, hf.sample(x, z) + r * 0.12, z);
    const tone = 0.42 + rng() * 0.18;
    const moss = rng() * 0.25;
    const cols = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < g.attributes.position.count; i++) {
      const up = smoothstep(0.0, r * 0.5, g.attributes.position.getY(i) - hf.sample(x, z));
      cols[i * 3] = tone * (1 - moss * up * 0.5);
      cols[i * 3 + 1] = tone * (1 + moss * up * 0.25);
      cols[i * 3 + 2] = tone * 1.05 * (1 - moss * up * 0.4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    parts.push(g);
    if (r > 0.45) colliders.push({ x, z, r: r * 0.9 });
  };

  // lake shore stones
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2;
    const ld = 1.0 + rng() * 0.16;
    const x = LAKE.cx + Math.cos(a) * LAKE.rx * ld, z = LAKE.cz + Math.sin(a) * LAKE.rz * ld;
    if (Math.abs(x - DOCK.x) < 3 && z > 10) continue;
    if (pathEdgeDist(x, z) < 1.2) continue;
    place(x, z, 0.25 + rng() * 0.7);
  }
  // hill flanks + path-side + meadow scatter
  for (let i = 0; i < 70; i++) {
    const x = (rng() - 0.5) * 180, z = (rng() - 0.5) * 220;
    if (boundsDist(x, z) > 0.97 || lakeDist(x, z) < 1.1) continue;
    if (pathEdgeDist(x, z) < 1.1 || greenhouseSdf(x, z) < 2.5 || hillDist(x, z) < 8) continue;
    const near = pathEdgeDist(x, z) < 4;
    place(x, z, near ? 0.15 + rng() * 0.3 : 0.2 + rng() * (rng() < 0.15 ? 1.4 : 0.5));
  }

  const geo = mergeGeometries(parts);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: false }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, colliders };
}

/* ---------------- fallen leaves (autumn grove) ---------------- */

export function createLeafLitter(hf) {
  const rng = mulberry32(12);
  // a real leaf outline (pointed oval with a little stem), not a square
  const leaf = new THREE.Shape();
  leaf.moveTo(-0.11, 0);
  leaf.quadraticCurveTo(-0.05, 0.075, 0.07, 0.035);
  leaf.lineTo(0.11, 0);
  leaf.lineTo(0.07, -0.035);
  leaf.quadraticCurveTo(-0.05, -0.075, -0.11, 0);
  const geo = new THREE.ShapeGeometry(leaf, 4);
  geo.rotateX(-Math.PI / 2);
  // slight curl so they aren't paper-flat
  const lp = geo.attributes.position;
  for (let i = 0; i < lp.count; i++) lp.setY(i, Math.abs(lp.getZ(i)) * 0.25);
  geo.computeVertexNormals();
  const count = 9000;
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const palette = ['#b4451f', '#cf7228', '#e0a33c', '#8f3218', '#c9902f'].map((h) => new THREE.Color(h));
  let n = 0;
  for (let tries = 0; tries < count * 6 && n < count; tries++) {
    const x = (rng() - 0.5) * 140, z = 48 + rng() * 70;
    const aut = autumnAt(x, z);
    if (rng() > aut || boundsDist(x, z) > 0.98) continue;
    const onPath = pathEdgeDist(x, z) < 0.2;
    if (onPath && rng() < 0.6) continue;
    p.set(x, hf.sample(x, z) + 0.025, z);
    e.set((rng() - 0.5) * 0.3, rng() * Math.PI * 2, (rng() - 0.5) * 0.3);
    q.setFromEuler(e);
    const sc = 0.7 + rng() * 0.9;
    s.set(sc, 1, sc);
    m.compose(p, q, s);
    mesh.setMatrixAt(n, m);
    mesh.setColorAt(n, palette[Math.floor(rng() * palette.length)].clone().multiplyScalar(0.75 + rng() * 0.35));
    n++;
  }
  mesh.count = n;
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------------- lily pads + water lilies ---------------- */

export function createLilies() {
  const rng = mulberry32(44);
  const group = new THREE.Group();
  const padGeo = new THREE.CircleGeometry(0.42, 18, 0.3, Math.PI * 2 - 0.5);
  padGeo.rotateX(-Math.PI / 2);
  const pads = new THREE.InstancedMesh(padGeo, new THREE.MeshStandardMaterial({ roughness: 0.55 }), 46);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const flowerSpots = [];
  let n = 0;
  for (let tries = 0; tries < 400 && n < 46; tries++) {
    const a = rng() * Math.PI * 2, ld = 0.5 + rng() * 0.38;
    const x = LAKE.cx + Math.cos(a) * LAKE.rx * ld, z = LAKE.cz + Math.sin(a) * LAKE.rz * ld;
    if (Math.abs(x - DOCK.x) < 2.6 && z > DOCK.zEnd - 2) continue;
    // cluster: prefer spots near noise peaks
    if (noise2(x * 0.18, z * 0.18) < -0.1) continue;
    p.set(x, 0.02, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2);
    const sc = 0.6 + rng() * 0.8;
    s.set(sc, 1, sc);
    m.compose(p, q, s);
    pads.setMatrixAt(n, m);
    pads.setColorAt(n, new THREE.Color('#2d5632').multiplyScalar(0.8 + rng() * 0.4));
    if (rng() < 0.28) flowerSpots.push([x, z, sc]);
    n++;
  }
  pads.count = n;
  pads.receiveShadow = true;
  group.add(pads);

  // water lilies: cupped petals with a faint inner glow
  const petal = new THREE.SphereGeometry(0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  petal.scale(0.7, 1.4, 1.6);
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const g = petal.clone();
    g.rotateX(-0.9);
    g.translate(0, 0.02, 0.05);
    g.rotateY((i / 8) * Math.PI * 2);
    petals.push(g);
  }
  for (let i = 0; i < 5; i++) {
    const g = petal.clone();
    g.scale(0.8, 1.1, 0.8);
    g.rotateX(-0.35);
    g.translate(0, 0.03, 0.03);
    g.rotateY((i / 5) * Math.PI * 2 + 0.3);
    petals.push(g);
  }
  const lilyGeo = mergeGeometries(petals);
  const lilyMat = new THREE.MeshStandardMaterial({
    color: '#f6e4ea', emissive: '#ffc8dc', emissiveIntensity: 0.55, roughness: 0.5, side: THREE.DoubleSide,
  });
  const lilies = new THREE.InstancedMesh(lilyGeo, lilyMat, flowerSpots.length);
  flowerSpots.forEach(([x, z, sc], i) => {
    m.compose(new THREE.Vector3(x + 0.05, 0.03, z), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
    lilies.setMatrixAt(i, m);
  });
  group.add(lilies);
  return group;
}

/* ---------------- dock ---------------- */

export function createDock(hf) {
  const rng = mulberry32(9);
  const parts = [];
  const len = DOCK.zLand - DOCK.zEnd;
  const plankW = 0.2, gap = 0.035;
  const count = Math.floor(len / (plankW + gap));
  for (let i = 0; i < count; i++) {
    const g = new THREE.BoxGeometry(DOCK.hw * 2 + (rng() - 0.5) * 0.06, 0.05, plankW);
    g.rotateY((rng() - 0.5) * 0.02);
    g.translate(DOCK.x + (rng() - 0.5) * 0.04, DOCK.deckY - 0.025, DOCK.zEnd + i * (plankW + gap) + plankW / 2);
    tint(g, 0.75 + rng() * 0.35);
    parts.push(g);
  }
  // stringers
  for (const sx of [-DOCK.hw + 0.12, DOCK.hw - 0.12]) {
    const g = new THREE.BoxGeometry(0.1, 0.14, len);
    g.translate(DOCK.x + sx, DOCK.deckY - 0.12, DOCK.zEnd + len / 2);
    tint(g, 0.6);
    parts.push(g);
  }
  // posts down to the lake bed
  for (let i = 0; i <= 4; i++) {
    const z = DOCK.zEnd + 0.15 + (i / 4) * (len - 3);
    for (const sx of [-DOCK.hw, DOCK.hw]) {
      const x = DOCK.x + sx;
      const bottom = Math.min(hf.sample(x, z), 0) - 0.3;
      const h = DOCK.deckY + 0.25 - bottom;
      const g = new THREE.CylinderGeometry(0.08, 0.09, h, 8);
      g.translate(x, bottom + h / 2, z);
      tint(g, 0.55);
      parts.push(g);
    }
  }
  const geo = mergeGeometries(parts);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#7a5a3e', vertexColors: true, roughness: 0.82 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tint(g, v) {
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3).fill(v);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  // BoxGeometry/Cylinder are indexed with uv; merged sets must match, so keep uv on all.
}

/* ---------------- hilltop plaza ---------------- */

export function createPlaza() {
  const tex = tileTexture(256);
  tex.repeat.set(5, 5);
  const geo = new THREE.CircleGeometry(6.2, 56);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, color: '#a7a091', roughness: 0.92 }));
  mesh.position.set(HILL.x, HILLTOP_Y + 0.03, HILL.z);
  mesh.receiveShadow = true;
  return mesh;
}
