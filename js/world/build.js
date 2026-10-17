/* Small shared building helpers for the pier and its stalls: beams and rods
   between two points, canvas textures, signs, and the kawung lattice panel. */

import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const Z = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A box of square section `t` from A to B, pushed into `out`. */
export function beam(A, B, t, out) {
  const d = new THREE.Vector3().subVectors(B, A);
  const len = d.length();
  if (len < 1e-4) return;
  const g = new THREE.BoxGeometry(t, t, len);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  out.push(g);
}

/** A cylinder of radius r from A to B, pushed into `out`. */
export function rod(A, B, r, out, seg = 8) {
  const d = new THREE.Vector3().subVectors(B, A);
  const len = d.length();
  if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  out.push(g);
}

/** Vertical quad standing on the line A→B, spanning y0..y1. */
export function vquad(ax, az, bx, bz, y0, y1) {
  const len = Math.hypot(bx - ax, bz - az);
  const g = new THREE.PlaneGeometry(len, y1 - y0);
  g.rotateY(Math.atan2(-(bz - az), bx - ax));
  g.translate((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
  return g;
}

export function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4;
  return t;
}

/** An elegant sign: title line in italic serif, optional smaller lines. */
export function signTexture(lines, { w = 640, h = 200, bg = '#2a1a12', fg = '#e8c98a', border = '#b8924c', title = 0.34 } = {}) {
  return canvasTex(w, h, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (border) { g.strokeStyle = border; g.lineWidth = 5; g.strokeRect(12, 12, W - 24, H - 24); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      const size = i === 0 ? Math.min(H * title, (W * 1.7) / Math.max(ln.length, 5)) : H * 0.11;
      g.font = `${i === 0 ? 'italic ' : ''}${Math.round(size)}px Georgia, 'Times New Roman', serif`;
      const y = lines.length === 1 ? H * 0.52 : i === 0 ? H * 0.3 : H * 0.3 + i * H * 0.15;
      g.fillText(ln, W / 2, y);
    });
  });
}

/** Kawung lattice (four ovals around a point) cut out of a bronze panel. Use with alphaTest. */
export function kawungPanelTexture() {
  return canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const cell = 32;
    for (let y = cell / 2; y < H; y += cell) {
      for (let x = cell / 2; x < W; x += cell) {
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + Math.PI / 4;
          g.beginPath();
          g.ellipse(x + Math.cos(a) * cell * 0.24, y + Math.sin(a) * cell * 0.24, cell * 0.19, cell * 0.1, a, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillRect(0, 0, 6, H); g.fillRect(W - 6, 0, 6, H);
  });
}

/** Dark wooden shingles (sirap) for pavilion roofs. */
export function sirapTexture() {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#2e2620'; g.fillRect(0, 0, W, H);
    const rng = mulberry32(4);
    const rowH = 21;
    for (let y = 0, r = 0; y < H; y += rowH, r++) {
      for (let x = (r % 2) * 14; x < W + 28; x += 28) {
        const v = 52 + Math.floor(rng() * 26);
        g.fillStyle = `rgb(${v},${v - 8},${v - 16})`;
        g.fillRect(x + 1, y + 1, 26, rowH - 2);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(x + 1, y + rowH - 5, 26, 3);
      }
    }
  }, { repeat: [3, 3] });
}

/** Warm teak planks for counters, panels, decks. */
export function teakTexture(base = '#7a4a28') {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const rng = mulberry32(17);
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = `rgba(${rng() < 0.5 ? '40,20,8' : '160,110,70'},${0.08 + rng() * 0.12})`;
      g.lineWidth = 0.6 + rng() * 1.5;
      const y = rng() * H;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.5);
      g.stroke();
    }
  }, { repeat: [1, 1] });
}

export function shadowAll(o, cast = true, recv = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } });
}

/* ---------------- static baking ---------------- */

const matKey = (m) => [
  m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness,
  m.map?.uuid, m.side, m.transparent, m.opacity, m.vertexColors, m.clearcoat, m.clearcoatRoughness,
  m.alphaTest, m.depthWrite, m.blending, m.polygonOffset,
].join('|');

/** Plain, untextured, non-glowing standard materials differ only by colour:
    those can share one vertex-coloured material per finish. */
const plain = (m) => m.type === 'MeshStandardMaterial' && !m.map && !m.transparent && !m.alphaTest && m.opacity === 1
  && m.emissive.getHex() === 0 && !m.normalMap && !m.envMap;
const q = (v) => Math.round(v * 20) / 20;
const plainKey = (m) => ['VC', q(m.roughness), q(m.metalness), m.side, !!m.flatShading].join('|');

/** Merge every static mesh under `root` into one mesh per (look-alike)
    material, in root space; plain coloured materials collapse into one
    vertex-coloured material per finish. Subtrees marked userData.keep stay as
    they are (anything that moves or animates its own material). Huge draw-call saver. */
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const victims = new Set();
  const rel = new THREE.Matrix4();
  const visit = (o, keep) => {
    keep = keep || !!o.userData.keep;
    if (o.isMesh && !keep && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.visible && o.geometry) {
      let m = o.material;
      const flat = plain(m);
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      rel.multiplyMatrices(inv, o.matrixWorld);
      g.applyMatrix4(rel);
      if (rel.determinant() < 0) {
        // mirrored transform: flip triangle winding to keep faces outward
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i += 3) {
          for (const name of Object.keys(g.attributes)) {
            const a = g.attributes[name], s = a.itemSize;
            for (let k = 0; k < s; k++) {
              const t = a.array[(i + 1) * s + k]; a.array[(i + 1) * s + k] = a.array[(i + 2) * s + k]; a.array[(i + 2) * s + k] = t;
            }
          }
        }
      }
      const keepAttrs = ['position', 'normal', 'uv'];
      if (m.vertexColors || flat) keepAttrs.push('color');
      for (const name of Object.keys(g.attributes)) if (!keepAttrs.includes(name)) g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count;
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      if ((m.vertexColors || flat) && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
      if (flat) {
        // fold the material colour into the vertex colours (both are linear)
        const c = g.attributes.color, mc = m.color;
        for (let i = 0; i < n; i++) c.setXYZ(i, c.getX(i) * mc.r, c.getY(i) * mc.g, c.getZ(i) * mc.b);
      }
      g.morphAttributes = {};
      const key = flat ? plainKey(m) : matKey(m);
      if (flat && !buckets.has(key)) {
        m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: m.roughness, metalness: m.metalness, side: m.side, flatShading: m.flatShading });
      }
      if (!buckets.has(key)) buckets.set(key, { mat: m, geos: [], cast: false, recv: false, order: o.renderOrder });
      const b = buckets.get(key);
      b.geos.push(g);
      b.cast = b.cast || o.castShadow;
      b.recv = b.recv || o.receiveShadow;
      victims.add(o);
    }
    for (const c of o.children) visit(c, keep);
  };
  visit(root, false);
  for (const v of victims) {
    // keep anything non-baked that hangs under a baked mesh (lights, sprites, kept parts)
    for (const c of [...v.children]) if (!victims.has(c)) v.parent.attach(c);
  }
  for (const v of victims) v.parent?.remove(v);
  let count = 0;
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.recv;
    mesh.renderOrder = b.order;
    root.add(mesh);
    count++;
  }
  return { merged: victims.size, into: count };
}
