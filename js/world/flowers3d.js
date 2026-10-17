/* Instanced 3D flowers for the glass house: the Hai Maia garden flowers (rose,
   tulip, daisy, peony, ranunculus, primrose) in their garden colours, plus
   phalaenopsis orchids. Add as many as you like with batch.add(); build()
   returns a group with one instanced mesh per flower type + shared stems and
   leaves, so a thousand blooms cost about ten draw calls. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';

// colours straight from the dashboard's garden (js/valentine.js FLOWER_COLORS)
export const GARDEN_COLORS = {
  rose: ['#d4849b', '#b76e79', '#e8a0b4', '#f0c0cc'],
  tulip: ['#e8a68c', '#d4846a', '#f0b8a0', '#e89878'],
  daisy: ['#f0e0e6', '#e8d0d8', '#fbf4f6'],
  peony: ['#e8b8c8', '#d4a0b0', '#f2ccd8', '#c088a0'],
  ranunculus: ['#f2b8a0', '#f6d0b8', '#e8a088', '#f8dccc'],
  primrose: ['#f3e08a', '#f6eab0', '#e8c870'],
  orchid: ['#d8b0e8', '#c090d8', '#f6f0f4', '#f0c8dc', '#e8d8f0'],
};

const clean = (g) => {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal'].includes(k)) n.deleteAttribute(k);
  return n;
};

function petal(len, wid, cup = 0.3, segs = 4) {
  // a cupped oval petal pointing up the +y axis
  const g = new THREE.PlaneGeometry(wid, len, 2, segs).translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = y / len;
    const w = Math.sin(Math.PI * Math.min(t * 0.9 + 0.1, 1));
    p.setX(i, x * w);
    p.setZ(i, (x / wid) * (x / wid) * wid * cup * 2 - t * t * len * 0.15);
  }
  g.computeVertexNormals();
  return g;
}

function ringOf(n, len, wid, tilt, radius, y, cup, yawOff = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const g = petal(len, wid, cup);
    g.rotateX(tilt);
    g.translate(0, y, radius);
    g.rotateY((i / n) * Math.PI * 2 + yawOff);
    out.push(clean(g));
  }
  return out;
}

/** Flower head geometries, about 6–10 cm across, centred at the origin, facing +y. */
function headGeometry(type) {
  const parts = [];
  switch (type) {
    case 'rose':
      parts.push(...ringOf(6, 0.045, 0.04, 1.05, 0.006, 0, 0.35));
      parts.push(...ringOf(5, 0.04, 0.036, 0.6, 0.004, 0.004, 0.4, 0.6));
      parts.push(...ringOf(4, 0.032, 0.03, 0.25, 0.002, 0.01, 0.45, 0.2));
      parts.push(clean(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 1.3, 1).translate(0, 0.02, 0)));
      break;
    case 'tulip':
      parts.push(...ringOf(3, 0.06, 0.035, 0.18, 0.012, 0, 0.5));
      parts.push(...ringOf(3, 0.058, 0.034, 0.1, 0.008, 0, 0.5, Math.PI / 3));
      break;
    case 'daisy':
      parts.push(...ringOf(16, 0.04, 0.011, 1.45, 0.008, 0, 0.1));
      parts.push(clean(new THREE.SphereGeometry(0.012, 10, 6).scale(1, 0.5, 1)));
      break;
    case 'peony':
      parts.push(...ringOf(8, 0.05, 0.045, 1.15, 0.01, -0.005, 0.4));
      parts.push(...ringOf(8, 0.045, 0.04, 0.75, 0.008, 0.002, 0.45, 0.4));
      parts.push(...ringOf(7, 0.038, 0.035, 0.4, 0.006, 0.008, 0.5, 0.2));
      parts.push(clean(new THREE.SphereGeometry(0.022, 10, 8).scale(1, 0.8, 1).translate(0, 0.02, 0)));
      break;
    case 'ranunculus':
      for (let r = 0; r < 4; r++) parts.push(...ringOf(9 - r, 0.032 - r * 0.004, 0.03 - r * 0.003, 1.1 - r * 0.25, 0.006, r * 0.004, 0.55, r * 0.35));
      parts.push(clean(new THREE.SphereGeometry(0.008, 8, 6).translate(0, 0.016, 0)));
      break;
    case 'primrose':
      parts.push(...ringOf(5, 0.03, 0.03, 1.35, 0.004, 0, 0.15));
      parts.push(clean(new THREE.SphereGeometry(0.006, 8, 6)));
      break;
    case 'orchid':
    default: {
      // three sepals, two broad petals, a lip
      for (let i = 0; i < 3; i++) {
        const g = petal(0.04, 0.022, 0.1);
        g.rotateZ((i / 3) * Math.PI * 2 + Math.PI);
        parts.push(clean(g));
      }
      for (const s of [-1, 1]) {
        const g = petal(0.036, 0.04, 0.12);
        g.rotateZ(s * 1.2);
        g.translate(0, 0, 0.002);
        parts.push(clean(g));
      }
      parts.push(clean(new THREE.SphereGeometry(0.01, 8, 6).scale(1, 1.3, 0.8).translate(0, -0.012, 0.008)));
      const m = mergeGeometries(parts);
      m.rotateX(-Math.PI / 2 + 0.5); // face mostly outward/up
      return m;
    }
  }
  return mergeGeometries(parts);
}

export class FlowerBatch {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.items = {};
    this.stems = [];
    this.leaves = [];
  }

  /** Add one flower: head at (x, y, z) world-or-group space; stem drops `stem` m below it. */
  add(type, x, y, z, { scale = 1, color = null, stem = 0.25, leaf = true, yaw = null, tilt = 0.25 } = {}) {
    const rng = this.rng;
    const cols = GARDEN_COLORS[type] || GARDEN_COLORS.rose;
    const c = new THREE.Color(color || cols[Math.floor(rng() * cols.length)]);
    c.offsetHSL(0, 0, (rng() - 0.5) * 0.06);
    (this.items[type] = this.items[type] || []).push({
      x, y, z, s: scale * (0.85 + rng() * 0.3), c,
      yaw: yaw ?? rng() * Math.PI * 2, tx: (rng() - 0.5) * tilt, tz: (rng() - 0.5) * tilt,
    });
    if (stem > 0) {
      this.stems.push({ x, y: y - stem / 2, z, len: stem, tx: (rng() - 0.5) * 0.12, tz: (rng() - 0.5) * 0.12 });
      if (leaf) this.leaves.push({ x, y: y - stem * (0.4 + rng() * 0.3), z, yaw: rng() * Math.PI * 2, s: scale * (0.8 + rng() * 0.5) });
    }
  }

  /** Scatter n flowers of mixed types over a rectangle at height y (a bed). */
  bed(types, cx, cz, w, d, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const t = types[Math.floor(this.rng() * types.length)];
      const h = (opts.minH ?? 0.18) + this.rng() * (opts.varH ?? 0.25);
      this.add(t, cx + (this.rng() - 0.5) * w, y + h, cz + (this.rng() - 0.5) * d, { stem: h, scale: opts.scale ?? 1.4 });
    }
  }

  build() {
    const group = new THREE.Group();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (const [type, list] of Object.entries(this.items)) {
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.55, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.025,
      });
      const im = new THREE.InstancedMesh(headGeometry(type), mat, list.length);
      list.forEach((f, i) => {
        e.set(f.tx, f.yaw, f.tz);
        q.setFromEuler(e);
        m4.compose(p.set(f.x, f.y, f.z), q, sc.setScalar(f.s));
        im.setMatrixAt(i, m4);
        im.setColorAt(i, f.c);
      });
      im.castShadow = false;
      im.receiveShadow = true;
      group.add(im);
    }
    if (this.stems.length) {
      const stemGeo = new THREE.CylinderGeometry(0.0035, 0.0045, 1, 4);
      const im = new THREE.InstancedMesh(stemGeo, new THREE.MeshStandardMaterial({ color: '#4c7a3a', roughness: 0.6 }), this.stems.length);
      this.stems.forEach((s, i) => {
        e.set(s.tx, 0, s.tz); q.setFromEuler(e);
        m4.compose(p.set(s.x, s.y, s.z), q, sc.set(1, s.len, 1));
        im.setMatrixAt(i, m4);
      });
      group.add(im);
    }
    if (this.leaves.length) {
      const lg = new THREE.SphereGeometry(0.03, 6, 4).scale(1.8, 0.15, 0.6).translate(0.04, 0, 0);
      const im = new THREE.InstancedMesh(lg, new THREE.MeshStandardMaterial({ color: '#4f8a3e', roughness: 0.6 }), this.leaves.length);
      this.leaves.forEach((l, i) => {
        e.set(0, l.yaw, -0.4); q.setFromEuler(e);
        m4.compose(p.set(l.x, l.y, l.z), q, sc.setScalar(l.s));
        im.setMatrixAt(i, m4);
      });
      group.add(im);
    }
    return group;
  }
}
