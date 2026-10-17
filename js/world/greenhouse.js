/* The glass house: a Javanese-modern luxury conservatory, like a five-star
   hotel's garden restaurant. A long white steel-and-glass hall with arched
   window heads, carved white (gebyok-inspired) brackets, a white coffered
   ceiling band with crystal chandeliers, and a polished cream marble floor.

   Straight ahead of the south door, a marble staircase with white balusters,
   brass caps and gold rope stanchions rises to an elevated floor at the far
   end where her desk sits, facing the glass and the moon. Under it, behind a
   carved teak doorway, a small powder room. On the ground floor: café tables,
   orchids and sansevieria, and a jamu gendong self-serve bar. */

import * as THREE from 'three';
import { mulberry32, marbleTexture } from './util.js';
import { GREENHOUSE, GREENHOUSE_FLOOR_Y } from './layout.js';
import { merge, vaseGeometry, bloomedFlower, mug } from './props.js';
import { JAMU, jamuBottle } from './food.js';
import { FlowerBatch } from './flowers3d.js';

const Z = new THREE.Vector3(0, 0, 1);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------------- textures ---------------- */

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4;
  return t;
}

/** Polished cream marble tiles with soft grey veins. */
function marbleFloorTexture() {
  return canvasTex(512, 512, (g, W) => {
    const n = 4, s = W / n;
    const rng = mulberry32(31);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 226 + Math.floor(rng() * 14);
        g.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
        g.fillRect(x * s, y * s, s, s);
        g.strokeStyle = 'rgba(150,140,128,0.35)';
        for (let k = 0; k < 5; k++) {
          g.lineWidth = 0.6 + rng() * 1.8;
          g.beginPath();
          let px = x * s + rng() * s, py = y * s + rng() * s;
          g.moveTo(px, py);
          for (let j = 0; j < 6; j++) { px += (rng() - 0.3) * 40; py += (rng() - 0.5) * 34; g.lineTo(px, py); }
          g.stroke();
        }
      }
    }
    g.strokeStyle = 'rgba(170,160,145,0.6)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, W); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(W, i * s); g.stroke();
    }
  }, { repeat: [1, 1] });
}

/** White carved screen with flowing cut-outs (gebyok-inspired), transparent holes. */
function carvedTexture(kind = 'bracket') {
  return canvasTex(256, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.save();
    if (kind === 'bracket') {
      // a corner bracket: solid along the top and the wall edge, curved underside
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.quadraticCurveTo(W * 0.35, H * 0.15, 0, H); g.closePath(); g.clip();
    }
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const rng = mulberry32(kind.length * 7);
    for (let i = 0; i < (kind === 'bracket' ? 9 : 26); i++) {
      const x = rng() * W, y = rng() * H, r = 10 + rng() * 22;
      g.beginPath();
      g.ellipse(x, y, r, r * 0.45, rng() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    g.fillStyle = '#ffffff';
    if (kind === 'bracket') { g.fillRect(0, 0, W, 14); g.fillRect(0, 0, 14, H); }
    else { g.fillRect(0, 0, W, 10); g.fillRect(0, H - 10, W, 10); g.fillRect(0, 0, 10, H); g.fillRect(W - 10, 0, 10, H); }
  });
}

/** Parang batik (diagonal blade waves). */
export function batikTexture(base = '#1f2c4f', ink = '#e9dcc0') {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    g.strokeStyle = ink; g.lineWidth = 7;
    for (let k = -H; k < W + H; k += 42) {
      g.beginPath();
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const x = k + t * H, y = t * H;
        const wob = Math.sin(t * Math.PI * 6) * 9;
        if (t === 0) g.moveTo(x + wob, y); else g.lineTo(x + wob, y);
      }
      g.stroke();
    }
    g.fillStyle = ink;
    for (let k = -H; k < W + H; k += 42) {
      for (let t = 0.08; t < 1; t += 0.16) { g.beginPath(); g.arc(k + t * H + 18, t * H, 4, 0, Math.PI * 2); g.fill(); }
    }
  }, { repeat: [2, 2] });
}

/** Woven cane / rattan. */
export function caneTexture() {
  return canvasTex(128, 128, (g, W, H) => {
    g.fillStyle = '#c9a26a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#8a6438'; g.lineWidth = 3;
    for (let i = -W; i < W * 2; i += 12) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke();
      g.beginPath(); g.moveTo(i + H, 0); g.lineTo(i, H); g.stroke();
    }
    g.fillStyle = 'rgba(40,25,10,0.55)';
    for (let y = 6; y < H; y += 12) for (let x = 6; x < W; x += 12) { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); }
  }, { repeat: [2, 2] });
}

/** Woven bamboo for the bakul baskets. */
function bambooTexture() {
  return canvasTex(128, 128, (g, W, H) => {
    g.fillStyle = '#c8a46c'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 8) {
      for (let x = 0; x < W; x += 16) {
        g.fillStyle = (x / 16 + y / 8) % 2 ? '#b18a52' : '#dcbd86';
        g.fillRect(x + ((y / 8) % 2) * 8, y, 14, 7);
      }
    }
  }, { repeat: [3, 1] });
}

function signTex(lines, { bg = '#f6f1e6', fg = '#5a3b22', w = 512, h = 220 } = {}) {
  return canvasTex(w, h, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#b8924c'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      g.font = `${i === 0 ? 'italic ' : ''}${Math.round(i === 0 ? H * 0.32 : H * 0.15)}px Georgia, serif`;
      g.fillText(ln, W / 2, H * (lines.length === 1 ? 0.5 : i === 0 ? 0.38 : 0.38 + i * 0.22));
    });
  });
}

/* ---------------- geometry helpers ---------------- */

function beam(A, B, t, out) {
  const d = new THREE.Vector3().subVectors(B, A);
  const len = d.length();
  if (len < 1e-4) return;
  const g = new THREE.BoxGeometry(t, t, len);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  out.push(g);
}
function rod(A, B, r, out, seg = 8) {
  const d = new THREE.Vector3().subVectors(B, A);
  const len = d.length();
  if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  out.push(g);
}
function vquad(ax, az, bx, bz, y0, y1) {
  const len = Math.hypot(bx - ax, bz - az);
  const g = new THREE.PlaneGeometry(len, y1 - y0);
  g.rotateY(Math.atan2(-(bz - az), bx - ax));
  g.translate((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
  return g;
}
function quad(a, b, c, d) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    ...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray(),
  ], 3));
  g.computeVertexNormals();
  return g;
}
function tri(a, b, c) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a.toArray(), ...b.toArray(), ...c.toArray()], 3));
  g.computeVertexNormals();
  return g;
}
const shadowAll = (o, cast = true, recv = true) => o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } });

/* ---------------- plants ---------------- */

export function whitePot(r, h) {
  const prof = [[0, 0], [r * 0.78, 0], [r * 0.95, h * 0.2], [r, h * 0.95], [r * 1.04, h], [r * 0.9, h], [r * 0.9, h * 0.92], [0, h * 0.9]];
  return new THREE.Mesh(new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), 24),
    new THREE.MeshPhysicalMaterial({ color: '#f5f3ee', roughness: 0.3, clearcoat: 0.5 }));
}

export function sansevieria(rng, scale = 1) {
  const g = new THREE.Group();
  g.add(whitePot(0.2 * scale, 0.36 * scale));
  const blades = [];
  for (let i = 0; i < 9; i++) {
    const h = (0.55 + rng() * 0.45) * scale;
    const sh = new THREE.Shape();
    const w = 0.045 * scale;
    sh.moveTo(-w, 0); sh.quadraticCurveTo(-w * 1.2, h * 0.6, 0, h); sh.quadraticCurveTo(w * 1.2, h * 0.6, w, 0); sh.closePath();
    const b = new THREE.ShapeGeometry(sh, 6);
    b.rotateY(rng() * Math.PI);
    b.rotateX((rng() - 0.5) * 0.25); b.rotateZ((rng() - 0.5) * 0.25);
    b.translate((rng() - 0.5) * 0.14 * scale, 0.33 * scale, (rng() - 0.5) * 0.14 * scale);
    blades.push(b);
  }
  g.add(new THREE.Mesh(merge(blades), new THREE.MeshStandardMaterial({ color: '#4d7a3c', roughness: 0.55, side: THREE.DoubleSide })));
  shadowAll(g);
  return g;
}

/** Phalaenopsis orchid in a small white pot. */
export function orchid(rng, scale = 1, flowerHex = '#f8f4f6') {
  const g = new THREE.Group();
  g.add(whitePot(0.07 * scale, 0.12 * scale));
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.07 * scale, 10, 6), leafMat);
    l.scale.set(1.5, 0.12, 0.6);
    l.position.set(Math.cos(i * 2.1) * 0.06 * scale, 0.12 * scale, Math.sin(i * 2.1) * 0.06 * scale);
    l.rotation.y = -i * 2.1;
    g.add(l);
  }
  const stem = new THREE.CatmullRomCurve3([V(0, 0.12, 0), V(0.01, 0.3, 0), V(0.05, 0.42, 0), V(0.13, 0.46, 0)].map((p) => p.multiplyScalar(scale)));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(stem, 12, 0.004 * scale, 4), new THREE.MeshStandardMaterial({ color: '#4b6a32' })));
  const petal = new THREE.MeshStandardMaterial({ color: flowerHex, roughness: 0.5, side: THREE.DoubleSide, emissive: flowerHex, emissiveIntensity: 0.12 });
  for (let i = 0; i < 6; i++) {
    const p = stem.getPoint(Math.min(0.45 + i * 0.1, 1));
    const f = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const c = new THREE.Mesh(new THREE.CircleGeometry(0.022 * scale, 10), petal);
      c.scale.set(1, k < 3 ? 1.1 : 0.6, 1);
      c.position.set(Math.cos(k * 1.256) * 0.018 * scale, Math.sin(k * 1.256) * 0.018 * scale, 0);
      f.add(c);
    }
    f.add(new THREE.Mesh(new THREE.SphereGeometry(0.008 * scale, 6, 4), new THREE.MeshStandardMaterial({ color: '#e8b04a' })));
    f.position.copy(p).add(V(0, -0.02 * scale, 0));
    f.rotation.y = -0.6 + rng() * 0.4;
    g.add(f);
  }
  return g;
}

export function palmFronds(rng, scale) {
  const g = new THREE.Group();
  g.add(whitePot(0.3 * scale, 0.5 * scale));
  const fronds = [];
  for (let i = 0; i < 11; i++) {
    const len = (1.0 + rng() * 0.6) * scale;
    const pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(V(0, Math.sin(t * Math.PI * 0.5) * len * 0.6 - t * t * 0.5 * scale, t * len)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const parts = [new THREE.TubeGeometry(curve, 8, 0.008 * scale, 3)];
    for (let j = 1; j <= 12; j++) {
      const t = j / 13;
      const p = curve.getPoint(t), tan = curve.getTangent(t);
      const l = 0.32 * scale * Math.sin(Math.PI * Math.min(t * 1.1, 1)) + 0.03;
      for (const s of [-1, 1]) {
        const lf = new THREE.PlaneGeometry(0.03 * scale, l, 1, 1).translate(0, l / 2, 0);
        lf.rotateZ(s * -1.25);
        lf.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, tan));
        lf.translate(p.x, p.y, p.z);
        parts.push(lf);
      }
    }
    const f = merge(parts);
    f.rotateX(-0.4 - rng() * 0.6);
    f.rotateY((i / 11) * Math.PI * 2 + rng() * 0.4);
    f.translate(0, 0.9 * scale, 0);
    fronds.push(f);
  }
  g.add(new THREE.Mesh(merge(fronds), new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.6, side: THREE.DoubleSide })));
  const stems = [];
  for (let i = 0; i < 4; i++) rod(V((rng() - 0.5) * 0.1, 0.4 * scale, (rng() - 0.5) * 0.1), V((rng() - 0.5) * 0.2, 1.0 * scale, (rng() - 0.5) * 0.2), 0.02 * scale, stems, 5);
  g.add(new THREE.Mesh(merge(stems), new THREE.MeshStandardMaterial({ color: '#5b6b3a' })));
  return g;
}

/* ---------------- furniture ---------------- */

const BOOK_COLS = ['#6b1f2a', '#1f3b5a', '#2f5a3a', '#7a5a2a', '#4a2a5a', '#8a6a4a', '#2a2a2a', '#9a3a2a', '#e8e0cf'];

function book(w, h, d, hex) {
  const cover = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7 });
  const pages = new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9 });
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [pages, cover, cover, cover, pages, pages]);
}

/** Round marble café table on a brass pedestal with teak-and-cane chairs. */
export function cafeSet(rng, cane, chairs = 3) {
  const g = new THREE.Group();
  const marble = new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.15, clearcoat: 0.8 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 32).translate(0, 0.75, 0), marble));
  const p = [];
  p.push(new THREE.CylinderGeometry(0.035, 0.05, 0.72, 12).translate(0, 0.38, 0));
  p.push(new THREE.CylinderGeometry(0.24, 0.27, 0.03, 24).translate(0, 0.015, 0));
  g.add(new THREE.Mesh(merge(p), brass));
  const teak = new THREE.MeshStandardMaterial({ color: '#7a4f2c', roughness: 0.5 });
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * Math.PI * 2 + rng() * 0.3;
    const ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72);
    ch.rotation.y = -a - Math.PI / 2;
    ch.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.42).translate(0, 0.46, 0), cane));
    const fr = [];
    for (const [x, z] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) rod(V(x, 0, z), V(x * 0.95, 0.46, z * 0.95), 0.016, fr, 6);
    rod(V(-0.2, 0.46, 0.19), V(-0.21, 0.9, 0.24), 0.017, fr, 6);
    rod(V(0.2, 0.46, 0.19), V(0.21, 0.9, 0.24), 0.017, fr, 6);
    fr.push(new THREE.TorusGeometry(0.21, 0.016, 6, 16, Math.PI).translate(0, 0.86, 0.24));
    ch.add(new THREE.Mesh(merge(fr), teak));
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.3), cane);
    back.position.set(0, 0.7, 0.225);
    back.rotation.x = 0.12;
    ch.add(back);
    g.add(ch);
  }
  shadowAll(g);
  return g;
}

/** Her desk: solid teak with slim brass legs, a leather pad, books, journal, lamp, vase, mug, orchid. */
function desk(rng, cane, batik) {
  const g = new THREE.Group();
  const teak = new THREE.MeshStandardMaterial({ color: '#7b4b28', roughness: 0.45 });
  const teakDark = new THREE.MeshStandardMaterial({ color: '#5a341b', roughness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 });
  const leather = new THREE.MeshStandardMaterial({ color: '#4a2f22', roughness: 0.6 });
  const H = 0.78, W = 2.6, D = 1.0;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D).translate(0, H - 0.03, 0), teak));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.025, D + 0.04).translate(0, H - 0.07, 0), teakDark));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.1, D - 0.1).translate(0, H - 0.11, 0), teakDark));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.008, 0.01).translate(0, H - 0.1, D / 2 - 0.045), brass));
  // twin drawer pedestals with brass pulls, a kneehole between, brass plinth bands
  const ped = [], pulls = [];
  for (const s of [-1, 1]) {
    const px = s * (W / 2 - 0.36);
    ped.push(new THREE.BoxGeometry(0.66, H - 0.12, D - 0.08).translate(px, (H - 0.12) / 2 + 0.04, 0));
    for (let i = 0; i < 3; i++) {
      const y = 0.17 + i * 0.2;
      ped.push(new THREE.BoxGeometry(0.58, 0.17, 0.012).translate(px, y, D / 2 - 0.03));
      pulls.push(new THREE.BoxGeometry(0.14, 0.018, 0.02).translate(px, y, D / 2 - 0.015));
    }
    pulls.push(new THREE.BoxGeometry(0.68, 0.04, D - 0.06).translate(px, 0.02, 0));
  }
  ped.push(new THREE.BoxGeometry(W - 1.5, 0.5, 0.04).translate(0, H - 0.37, -D / 2 + 0.06)); // modesty panel
  g.add(new THREE.Mesh(merge(ped), teakDark));
  g.add(new THREE.Mesh(merge(pulls), brass));
  // a brass gallery rail along the back edge
  const gal = [];
  rod(V(-W / 2 + 0.05, H + 0.08, -D / 2 + 0.04), V(W / 2 - 0.05, H + 0.08, -D / 2 + 0.04), 0.008, gal);
  for (let i = 0; i <= 16; i++) rod(V(-W / 2 + 0.05 + (i / 16) * (W - 0.1), H, -D / 2 + 0.04), V(-W / 2 + 0.05 + (i / 16) * (W - 0.1), H + 0.08, -D / 2 + 0.04), 0.004, gal, 5);
  g.add(new THREE.Mesh(merge(gal), brass));
  const top = H + 0.001;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.004, 0.6).translate(0, top + 0.002, 0.1), leather));
  // more on the desk: a brass carriage clock, a letter tray, candlesticks, a framed photo
  const extra = [];
  extra.push(new THREE.BoxGeometry(0.12, 0.15, 0.07).translate(-0.3, top + 0.075, -0.36));
  extra.push(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16).rotateX(Math.PI / 2).translate(-0.3, top + 0.09, -0.32));
  extra.push(new THREE.BoxGeometry(0.3, 0.03, 0.22).translate(0.75, top + 0.015, 0.25));
  for (const x of [-1.15, 1.15]) {
    extra.push(new THREE.CylinderGeometry(0.035, 0.045, 0.02, 14).translate(x, top + 0.01, -0.38));
    extra.push(new THREE.CylinderGeometry(0.01, 0.014, 0.2, 10).translate(x, top + 0.11, -0.38));
  }
  extra.push(new THREE.BoxGeometry(0.2, 0.25, 0.02).rotateX(-0.2).translate(0.35, top + 0.12, -0.35));
  g.add(new THREE.Mesh(merge(extra), brass));
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), new THREE.MeshStandardMaterial({ color: '#e8dcc8', roughness: 0.8 }));
  photo.position.set(0.35, top + 0.12, -0.338); photo.rotation.x = -0.2;
  g.add(photo);
  const candles = new THREE.MeshStandardMaterial({ color: '#f6efe0', emissive: '#ffcf8a', emissiveIntensity: 0.3 });
  for (const x of [-1.15, 1.15]) g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 10).translate(x, top + 0.28, -0.38), candles));
  const letters = [];
  for (let i = 0; i < 4; i++) letters.push(new THREE.BoxGeometry(0.26, 0.004, 0.18).rotateY((i - 1.5) * 0.08).translate(0.75, top + 0.035 + i * 0.005, 0.25));
  g.add(new THREE.Mesh(merge(letters), new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 0.9 })));

  // brass task lamp with a dome shade (back right)
  const lamp = new THREE.Group();
  lamp.position.set(1.0, top, -0.25);
  const lp = [];
  lp.push(new THREE.CylinderGeometry(0.08, 0.09, 0.025, 24).translate(0, 0.012, 0));
  rod(V(0, 0.02, 0), V(0, 0.38, 0), 0.008, lp);
  rod(V(0, 0.38, 0), V(-0.18, 0.46, 0.06), 0.008, lp);
  lamp.add(new THREE.Mesh(merge(lp), brass));
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.25, metalness: 0.9, side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: 0 });
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), shadeMat);
  shade.position.set(-0.2, 0.44, 0.07);
  lamp.add(shade);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffd08a', emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), bulbMat);
  bulb.position.set(-0.2, 0.42, 0.07);
  lamp.add(bulb);
  lamp.userData.keep = true; // its glow animates
  g.add(lamp);

  // books: a row between brass bookends, and a stack
  let bx = -0.9;
  for (let i = 0; i < 8; i++) {
    const w = 0.03 + rng() * 0.025, h = 0.2 + rng() * 0.07, d = 0.15 + rng() * 0.04;
    const b = book(w, h, d, BOOK_COLS[i % BOOK_COLS.length]);
    b.position.set(bx + w / 2, top + h / 2, -0.28);
    g.add(b);
    bx += w + 0.003;
  }
  for (const x of [-0.395, bx + 0.015]) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.11).translate(x, top + 0.08, -0.28), brass));
  let sy = top;
  for (let i = 0; i < 3; i++) {
    const h = 0.035 + rng() * 0.02;
    const b = book(0.17 - i * 0.01, h, 0.24 - i * 0.02, BOOK_COLS[(i * 3 + 2) % BOOK_COLS.length]);
    b.position.set(-0.95, sy + h / 2, 0.2);
    b.rotation.y = (rng() - 0.5) * 0.3;
    g.add(b);
    sy += h;
  }

  // the open journal (story) with a fountain pen
  const journal = new THREE.Group();
  journal.position.set(0.02, top + 0.006, 0.1);
  journal.rotation.y = 0.06;
  journal.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.32), new THREE.MeshStandardMaterial({ color: '#2a3d5a', roughness: 0.6 })));
  const pages = new THREE.PlaneGeometry(0.44, 0.3, 16, 1);
  const pp = pages.attributes.position;
  for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sqrt(Math.abs(pp.getX(i)) / 0.22) * 0.012);
  pages.rotateX(-Math.PI / 2);
  pages.computeVertexNormals();
  const pageTex = canvasTex(512, 360, (gg, Wd, Hd) => {
    gg.fillStyle = '#f6efe0'; gg.fillRect(0, 0, Wd, Hd);
    const r2 = mulberry32(5);
    for (const x0 of [24, Wd / 2 + 24]) {
      for (let y = 40; y < Hd - 20; y += 18) {
        gg.strokeStyle = 'rgba(120,150,190,0.3)'; gg.lineWidth = 1;
        gg.beginPath(); gg.moveTo(x0, y); gg.lineTo(x0 + Wd / 2 - 48, y); gg.stroke();
        if (x0 > Wd / 2 && y > 220) continue;
        gg.strokeStyle = 'rgba(30,40,80,0.7)'; gg.lineWidth = 1.4;
        gg.beginPath();
        let x = x0 + 4;
        const end = x0 + Wd / 2 - 60 - r2() * 60;
        gg.moveTo(x, y - 4);
        while (x < end) { const w = 6 + r2() * 22; for (let k = 0; k < w; k += 3) gg.lineTo(x + k, y - 4 - Math.abs(Math.sin((x + k) * 0.7)) * 6 * r2()); x += w + 5; gg.moveTo(x, y - 4); }
        gg.stroke();
      }
    }
  });
  const pm = new THREE.Mesh(pages, new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 }));
  pm.position.y = 0.007;
  journal.add(pm);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0065, 0.13, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#16161a', roughness: 0.2 }));
  pen.position.set(0.12, 0.024, 0.02);
  pen.rotation.y = -0.5;
  journal.add(pen);
  g.add(journal);

  // the marble vase with the rose (back left), the REVA mug (front right), an orchid
  const vase = new THREE.Group();
  const marble = new THREE.MeshPhysicalMaterial({ color: '#f6f4ef', map: marbleTexture(512), roughness: 0.28, clearcoat: 0.7, side: THREE.DoubleSide });
  vase.add(new THREE.Mesh(vaseGeometry(), marble));
  const flower = bloomedFlower();
  flower.userData.keep = true; // its glow animates
  vase.add(flower);
  vase.position.set(-1.15, top, -0.12);
  vase.scale.setScalar(0.85);
  vase.rotation.y = Math.PI / 2;
  g.add(vase);
  const m = mug();
  m.position.set(0.95, top, 0.12);
  m.rotation.y = -Math.PI / 2 - 0.3;
  m.scale.setScalar(1.3);
  g.add(m);
  const orc = orchid(rng, 1.1);
  orc.position.set(0.62, top, -0.3);
  g.add(orc);

  // chair: teak frame, cane back, batik cushion
  const chair = new THREE.Group();
  chair.position.set(0.0, 0, D / 2 + 0.45);
  chair.scale.setScalar(1.12);
  const fr = [];
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) fr.push(new THREE.BoxGeometry(0.035, 0.46, 0.035).translate(x, 0.23, z));
  fr.push(new THREE.BoxGeometry(0.5, 0.04, 0.46).translate(0, 0.46, 0));
  for (const x of [-0.22, 0.22]) fr.push(new THREE.BoxGeometry(0.035, 0.5, 0.035).translate(x, 0.71, 0.21));
  fr.push(new THREE.BoxGeometry(0.48, 0.05, 0.04).translate(0, 0.95, 0.21));
  chair.add(new THREE.Mesh(merge(fr), teak));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.4), cane);
  back.position.set(0, 0.72, 0.215);
  chair.add(back);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.42), new THREE.MeshStandardMaterial({ map: batik, roughness: 0.85 }));
  cushion.position.y = 0.51;
  chair.add(cushion);
  g.add(chair);

  shadowAll(g);
  return {
    group: g, bulbMat, shadeMat, flower,
    journalLocal: V(0.02, top + 0.05, 0.1),
    lampLocal: V(0.8, top + 0.42, -0.18),
    flowerLocal: V(-1.15, top + 0.38, -0.12),
    mugLocal: V(0.95, top + 0.09, 0.12),
    deskTop: V(-0.5, top, 0.32),
  };
}

/** Crystal chandelier: tiered brass rings hung with prisms and candle bulbs. */
export function chandelier(scale = 1) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: '#d1ab62', roughness: 0.25, metalness: 0.95 });
  const crystal = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.75, emissive: '#fff1d8', emissiveIntensity: 0.45, clearcoat: 1 });
  const parts = [];
  const tiers = [[0.75, 0], [0.55, 0.35], [0.33, 0.65]];
  const prisms = [];
  for (const [r, y] of tiers) {
    parts.push(new THREE.TorusGeometry(r * scale, 0.018 * scale, 6, 48).rotateX(Math.PI / 2).translate(0, y * scale, 0));
    const n = Math.round(r * 60);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      for (let k = 0; k < 4; k++) prisms.push(V(Math.cos(a) * r * scale, (y - 0.06 - k * 0.075) * scale, Math.sin(a) * r * scale));
    }
  }
  rod(V(0, -0.3 * scale, 0), V(0, 1.6 * scale, 0), 0.012 * scale, parts);
  parts.push(new THREE.SphereGeometry(0.08 * scale, 12, 10).translate(0, -0.3 * scale, 0));
  g.add(new THREE.Mesh(merge(parts), brass));
  const prism = new THREE.OctahedronGeometry(0.022 * scale, 0).scale(0.6, 1.6, 0.6);
  const im = new THREE.InstancedMesh(prism, crystal, prisms.length);
  prisms.forEach((p, i) => im.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  g.add(im);
  const bulbs = [];
  for (const [r, y] of tiers) {
    const n = Math.round(r * 12);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      bulbs.push(new THREE.SphereGeometry(0.03 * scale, 8, 6).scale(1, 1.6, 1).translate(Math.cos(a) * r * scale, (y + 0.06) * scale, Math.sin(a) * r * scale));
    }
  }
  g.add(new THREE.Mesh(merge(bulbs), new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd59a', emissiveIntensity: 2.6 })));
  return g;
}

/** Brass wall sconce with a warm frosted shade. */
export function sconce() {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  const p = [];
  p.push(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14).rotateX(Math.PI / 2));
  rod(V(0, 0, 0), V(0, 0.08, 0.16), 0.008, p);
  g.add(new THREE.Mesh(merge(p), brass));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffc77a', emissiveIntensity: 1.8, side: THREE.DoubleSide }));
  shade.position.set(0, 0.12, 0.16);
  g.add(shade);
  return g;
}

/* ---------------- the jamu gendong self-bar ---------------- */

function jamuGendong(rng, batik, bamboo) {
  const g = new THREE.Group();
  const teak = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.55 });
  // a low teak bench (bale) with turned legs
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 2.3).translate(0, 0.62, 0), teak));
  const lg = [];
  for (const [x, z] of [[-0.25, -1.05], [0.25, -1.05], [-0.25, 1.05], [0.25, 1.05]]) rod(V(x, 0, z), V(x, 0.6, z), 0.03, lg, 10);
  lg.push(new THREE.BoxGeometry(0.5, 0.03, 2.1).translate(0, 0.18, 0));
  g.add(new THREE.Mesh(merge(lg), teak));
  // the batik selendang (carrying cloth) lying on the bench and hanging over its front edge
  const cloth = new THREE.PlaneGeometry(0.75, 1.4, 6, 10);
  const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const u = cp.getX(i), v = cp.getY(i);
    const along = u + 0.375;
    if (along < 0.42) cp.setXYZ(i, -0.31 + along, 0.655 + Math.sin(v * 9) * 0.004, v);
    else cp.setXYZ(i, 0.11, 0.655 - (along - 0.42) * 1.0, v + Math.sin((along - 0.42) * 8) * 0.03);
  }
  cloth.computeVertexNormals();
  const clothMesh = new THREE.Mesh(cloth, new THREE.MeshStandardMaterial({ map: batik, roughness: 0.9, side: THREE.DoubleSide }));
  clothMesh.position.set(0.2, 0, -0.35);
  g.add(clothMesh);
  // two bakul baskets full of bottles
  const kinds = Object.keys(JAMU);
  const bottles = [];
  [[0, -0.55], [0, 0.45]].forEach(([x, z], bi) => {
    const prof = [[0, 0], [0.18, 0], [0.24, 0.05], [0.27, 0.22], [0.28, 0.24], [0.26, 0.24], [0.25, 0.22], [0.22, 0.04], [0, 0.04]];
    const basket = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24), new THREE.MeshStandardMaterial({ map: bamboo, roughness: 0.85, side: THREE.DoubleSide }));
    basket.position.set(x, 0.65, z);
    g.add(basket);
    for (let k = 0; k < 6; k++) {
      const kind = kinds[(k + bi * 2) % kinds.length];
      const a = (k / 6) * Math.PI * 2;
      const b = jamuBottle(kind, k % 2 ? 'leaf' : 'cork');
      b.position.set(x + Math.cos(a) * 0.15, 0.69, z + Math.sin(a) * 0.15);
      b.rotation.z = (rng() - 0.5) * 0.08;
      g.add(b);
      if (bi === 0 && k < 4) bottles.push({ kind, local: b.position.clone().add(V(0, 0.15, 0)) });
    }
  });
  // small glasses on a tray, a clay kendi, the self-serve sign
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.015, 24), new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.6 }));
  tray.position.set(0.05, 0.66, 0.0);
  g.add(tray);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#f4fbff', transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.07, 14, 1, true), glassMat);
    gl.position.set(0.05 + Math.cos(a) * 0.1, 0.705, Math.sin(a) * 0.1);
    gl.renderOrder = 2;
    g.add(gl);
  }
  const kendiProf = [[0, 0], [0.06, 0], [0.11, 0.06], [0.12, 0.12], [0.09, 0.19], [0.03, 0.22], [0.025, 0.3], [0.035, 0.31]];
  const kendi = new THREE.Mesh(new THREE.LatheGeometry(kendiProf.map(([r, y]) => new THREE.Vector2(r, y)), 20), new THREE.MeshStandardMaterial({ color: '#a4532e', roughness: 0.85 }));
  kendi.position.set(0.0, 0.65, 0.95);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 8), kendi.material);
  spout.position.set(0.11, 0.17, 0); spout.rotation.z = -0.9;
  kendi.add(spout);
  g.add(kendi);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), new THREE.MeshBasicMaterial({ map: signTex(['Jamu', 'silakan · help yourself']), color: '#d8d0c0' }));
  sign.position.set(0.33, 0.78, -1.0);
  sign.rotation.y = Math.PI / 2;
  g.add(sign);
  shadowAll(g, true, true);
  return { group: g, bottles };
}

/* ---------------- the orchid potting table (mirrors the jamu bar) ---------------- */

function pottingTable(rng) {
  const g = new THREE.Group();
  const teak = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.55 });
  const terra = new THREE.MeshStandardMaterial({ color: '#b5653e', roughness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 2.3).translate(0, 0.86, 0), teak));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 2.1).translate(0, 0.3, 0), teak));
  const lg = [];
  for (const [x, z] of [[-0.3, -1.08], [0.3, -1.08], [-0.3, 1.08], [0.3, 1.08]]) lg.push(new THREE.BoxGeometry(0.06, 0.86, 0.06).translate(x, 0.43, z));
  g.add(new THREE.Mesh(merge(lg), teak));
  const pots = [];
  for (let i = 0; i < 7; i++) {
    const z = -0.95 + i * 0.32;
    pots.push(new THREE.CylinderGeometry(0.075, 0.055, 0.13, 14).translate((rng() - 0.5) * 0.25, 0.955, z));
  }
  for (let i = 0; i < 5; i++) pots.push(new THREE.CylinderGeometry(0.06, 0.045, 0.1, 12).translate(0, 0.37, -0.8 + i * 0.4));
  g.add(new THREE.Mesh(merge(pots), terra));
  // a brass watering can
  const can = [];
  can.push(new THREE.CylinderGeometry(0.09, 0.1, 0.2, 18).translate(0.15, 0.99, 0.95));
  rod(V(0.08, 0.95, 0.95), V(-0.12, 1.12, 0.95), 0.012, can);
  can.push(new THREE.TorusGeometry(0.07, 0.01, 6, 12, Math.PI).rotateY(Math.PI / 2).translate(0.15, 1.1, 0.95));
  g.add(new THREE.Mesh(merge(can), brass));
  shadowAll(g);
  return g;
}

/* ---------------- floor medallion ---------------- */

function medallionTexture() {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = '#efe6d6'; g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    const ring = (r, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); };
    ring(240, '#b8924c', 8); ring(222, '#3a3a3a', 3);
    // an eight-point star of kawung petals
    for (let k = 0; k < 8; k++) {
      g.save(); g.rotate((k / 8) * Math.PI * 2);
      g.fillStyle = k % 2 ? '#c9a25a' : '#6b5a48';
      g.beginPath(); g.ellipse(0, -120, 34, 90, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.fillStyle = '#efe6d6'; g.beginPath(); g.arc(0, 0, 48, 0, Math.PI * 2); g.fill();
    ring(48, '#b8924c', 6); ring(160, 'rgba(184,146,76,0.6)', 2);
  });
}

/* ---------------- the building ---------------- */

export function createGreenhouse(itemMessages = {}) {
  const G = GREENHOUSE;
  const y0 = GREENHOUSE_FLOOR_Y;
  const group = new THREE.Group();
  group.position.set(G.x, y0, G.z);
  const rng = mulberry32(33);
  const H6 = G.half, WW = G.wing.w, WHD = G.wing.hd;
  const { wallH, tier1, summit, wingWall, wingRidge } = G;
  const D = G.dais, F = G.flight, PR = G.powder;
  const doorHalf = G.doorW / 2;
  const KNEE = 0.9, T = 0.07;
  const OPEN0 = -2.0, OPEN1 = 4.2; // openings from the hall into the wings

  const frame = [], glass = [], wains = [];
  const white = new THREE.MeshStandardMaterial({ color: '#f6f4ef', roughness: 0.72, metalness: 0.0 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 });
  const teak = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.5 });
  const cane = new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.8, side: THREE.DoubleSide });
  const batik = batikTexture();
  const screenTex = carvedTexture('screen');
  const carvedMat = new THREE.MeshStandardMaterial({ map: carvedTexture('bracket'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
  const marblePanel = new THREE.MeshPhysicalMaterial({ map: marbleTexture(512), color: '#f2ede4', roughness: 0.3, clearcoat: 0.4 });
  const columnsAt = [];
  const flowers = new FlowerBatch(7);

  /** A glazed wall run: white wainscot, glass with arched window heads, mullions. */
  function wallRun(ax, az, bx, bz, top, { columns = true } = {}) {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.05) return;
    const dx = (bx - ax) / len, dz = (bz - az) / len;
    const n = Math.max(1, Math.round(len / 0.75));
    const yaw = Math.atan2(-dz, dx);
    const transom = top - 1.6;
    const wb = new THREE.BoxGeometry(len, KNEE, 0.12); wb.rotateY(yaw); wb.translate((ax + bx) / 2, KNEE / 2, (az + bz) / 2);
    wains.push(wb);
    const cap = new THREE.BoxGeometry(len + 0.02, 0.05, 0.2); cap.rotateY(yaw); cap.translate((ax + bx) / 2, KNEE + 0.025, (az + bz) / 2);
    frame.push(cap);
    glass.push(vquad(ax, az, bx, bz, KNEE + 0.05, top));
    beam(V(ax, top, az), V(bx, top, bz), T * 1.4, frame);
    beam(V(ax, transom, az), V(bx, transom, bz), T * 0.8, frame);
    for (let i = 0; i <= n; i++) {
      const x = ax + dx * len * (i / n), z = az + dz * len * (i / n);
      const isCol = columns && (i % 3 === 0);
      beam(V(x, KNEE + 0.05, z), V(x, top, z), isCol ? 0.16 : T, frame);
      if (isCol && i > 0 && i < n) columnsAt.push({ x, z, top });
      if (i < n) {
        const span = len / n;
        const arc = new THREE.TorusGeometry(span / 2, 0.02, 4, 14, Math.PI);
        arc.rotateY(yaw);
        arc.translate(x + dx * span / 2, transom - span / 2 + 0.03, z + dz * span / 2);
        frame.push(arc);
      }
    }
  }

  /* ---------- walls ---------- */
  // central hall
  wallRun(-H6, H6, -doorHalf, H6, wallH, { columns: false });
  wallRun(doorHalf, H6, H6, H6, wallH, { columns: false });
  wallRun(H6, -H6, -H6, -H6, wallH, { columns: false });
  for (const s of [-1, 1]) {
    wallRun(s * H6, -H6, s * H6, OPEN0, wallH, { columns: false });
    wallRun(s * H6, OPEN1, s * H6, H6, wallH, { columns: false });
    // the opening into the wing: a white arch on columns, glass above
    const x = s * H6;
    beam(V(x, 0, OPEN0), V(x, 4.0, OPEN0), 0.22, frame);
    beam(V(x, 0, OPEN1), V(x, 4.0, OPEN1), 0.22, frame);
    beam(V(x, 4.0, OPEN0), V(x, 4.0, OPEN1), 0.16, frame);
    const span = OPEN1 - OPEN0;
    const arch = new THREE.TorusGeometry(span / 2, 0.08, 6, 28, Math.PI);
    arch.rotateY(Math.PI / 2);
    arch.scale(1, 0.3, 1);
    arch.translate(x, 4.0, (OPEN0 + OPEN1) / 2);
    frame.push(arch);
    glass.push(vquad(x, OPEN0, x, OPEN1, 4.0, wallH));
    // flowers climbing over the arch
    for (let k = 0; k <= 26; k++) {
      const a = (k / 26) * Math.PI;
      const zz = (OPEN0 + OPEN1) / 2 + Math.cos(a) * (span / 2);
      const yy = 1.0 + Math.sin(a) * 2.8;
      for (let j = 0; j < 3; j++) flowers.add(['rose', 'peony', 'orchid', 'ranunculus'][Math.floor(rng() * 4)], x + (rng() - 0.5) * 0.35, yy + (rng() - 0.5) * 0.25, zz + (rng() - 0.5) * 0.3, { stem: 0, scale: 1.6 });
    }
  }
  // wings
  for (const s of [-1, 1]) {
    const x0 = s * H6, x1 = s * (H6 + WW);
    wallRun(x0, WHD, x1, WHD, wingWall);
    wallRun(x1, -WHD, x0, -WHD, wingWall);
    wallRun(x1, WHD, x1, -WHD, wingWall, { columns: false });
  }
  // the grand entrance: tall doors under an arched carved transom, a portico
  const doorH = 3.3;
  beam(V(-doorHalf, 0, H6), V(-doorHalf, wallH, H6), 0.24, frame);
  beam(V(doorHalf, 0, H6), V(doorHalf, wallH, H6), 0.24, frame);
  beam(V(-doorHalf, doorH, H6), V(doorHalf, doorH, H6), 0.16, frame);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(doorHalf - 0.1, 32, 0, Math.PI), new THREE.MeshStandardMaterial({ map: screenTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  fan.position.set(0, doorH + 0.05, H6 - 0.04);
  group.add(fan);
  const fanArc = new THREE.TorusGeometry(doorHalf - 0.05, 0.06, 6, 28, Math.PI);
  fanArc.translate(0, doorH + 0.05, H6);
  frame.push(fanArc);
  glass.push(vquad(-doorHalf, H6, doorHalf, H6, doorH + doorHalf, wallH));
  const doorGlass = new THREE.MeshStandardMaterial({ color: '#d6e8ee', transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * doorHalf, 0, H6);
    hinge.rotation.y = s * -1.35;
    const leaf = new THREE.Group();
    leaf.position.set(-s * doorHalf / 2, 0, 0);
    const lf = [];
    lf.push(new THREE.BoxGeometry(doorHalf, 0.1, 0.07).translate(0, 0.05, 0));
    lf.push(new THREE.BoxGeometry(doorHalf, 0.1, 0.07).translate(0, doorH - 0.05, 0));
    lf.push(new THREE.BoxGeometry(0.09, doorH, 0.07).translate(-doorHalf / 2 + 0.045, doorH / 2, 0));
    lf.push(new THREE.BoxGeometry(0.09, doorH, 0.07).translate(doorHalf / 2 - 0.045, doorH / 2, 0));
    lf.push(new THREE.BoxGeometry(doorHalf - 0.1, 0.05, 0.05).translate(0, 1.1, 0));
    leaf.add(new THREE.Mesh(merge(lf), white));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(doorHalf - 0.16, doorH - 0.2).translate(0, doorH / 2, 0), doorGlass);
    pane.renderOrder = 2;
    leaf.add(pane);
    const h = [];
    rod(V(-s * (doorHalf / 2 - 0.16), 0.8, 0.05), V(-s * (doorHalf / 2 - 0.16), 1.6, 0.05), 0.014, h);
    leaf.add(new THREE.Mesh(merge(h), brass));
    hinge.add(leaf);
    group.add(hinge);
  }
  // portico: four white columns on paras bases, a canopy with a carved gebyok fascia and a small tiered roof
  const por = [];
  for (const x of [-2.6, -1.7, 1.7, 2.6]) {
    por.push(new THREE.BoxGeometry(0.42, 0.3, 0.42).translate(x, 0.15, H6 + 2.3));
    rod(V(x, 0.3, H6 + 2.3), V(x, 3.95, H6 + 2.3), 0.13, por, 16);
    por.push(new THREE.BoxGeometry(0.36, 0.14, 0.36).translate(x, 4.0, H6 + 2.3));
  }
  por.push(new THREE.BoxGeometry(6.2, 0.28, 3.0).translate(0, 4.2, H6 + 1.4));
  frame.push(...por);
  const fascia = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.6), new THREE.MeshStandardMaterial({ map: screenTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  fascia.position.set(0, 4.65, H6 + 2.92);
  group.add(fascia);
  const porRoof = [];
  porRoof.push(new THREE.BoxGeometry(6.2, 0.06, 3.0).translate(0, 4.36, H6 + 1.4));
  porRoof.push(new THREE.ConeGeometry(1.9, 1.1, 4).rotateY(Math.PI / 4).scale(1.6, 1, 0.8).translate(0, 4.95, H6 + 1.4));
  group.add(new THREE.Mesh(merge(porRoof), new THREE.MeshStandardMaterial({ color: '#efece5', roughness: 0.5 })));
  const steps = new THREE.MeshPhysicalMaterial({ color: '#efe8dc', roughness: 0.35, clearcoat: 0.3 });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.12, 3.4).translate(0, 0.02, H6 + 1.5), steps));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 1.0).translate(0, 0.0, H6 + 3.6), steps));

  /* ---------- roofs ---------- */
  const IN = 3.4; // inner square of the first tier
  const c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < 4; k++) {
    const [ax, az] = c4[k], [bx, bz] = c4[(k + 1) % 4];
    glass.push(quad(V(ax * H6, wallH, az * H6), V(bx * H6, wallH, bz * H6), V(bx * IN, tier1, bz * IN), V(ax * IN, tier1, az * IN)));
    beam(V(ax * H6, wallH, az * H6), V(ax * IN, tier1, az * IN), 0.14, frame); // hip
    // rafters
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const A = V(ax * H6 + (bx - ax) * H6 * t, wallH, az * H6 + (bz - az) * H6 * t);
      const B = V(ax * IN + (bx - ax) * IN * t, tier1, az * IN + (bz - az) * IN * t);
      beam(A, B, T, frame);
    }
    // clerestory band between the tiers
    glass.push(vquad(ax * IN, az * IN, bx * IN, bz * IN, tier1, tier1 + 0.7));
    beam(V(ax * IN, tier1 + 0.7, az * IN), V(bx * IN, tier1 + 0.7, bz * IN), 0.12, frame);
    beam(V(ax * IN, tier1, az * IN), V(bx * IN, tier1, bz * IN), 0.14, frame);
    beam(V(ax * IN, tier1, az * IN), V(ax * IN, tier1 + 0.7, az * IN), 0.12, frame);
    // upper pyramid
    glass.push(tri(V(ax * (IN + 0.3), tier1 + 0.7, az * (IN + 0.3)), V(bx * (IN + 0.3), tier1 + 0.7, bz * (IN + 0.3)), V(0, summit, 0)));
    beam(V(ax * (IN + 0.3), tier1 + 0.7, az * (IN + 0.3)), V(0, summit, 0), 0.12, frame);
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      beam(V(ax * (IN + 0.3) + (bx - ax) * (IN + 0.3) * t, tier1 + 0.7, az * (IN + 0.3) + (bz - az) * (IN + 0.3) * t), V(0, summit, 0), 0.05, frame);
    }
  }
  // tumpang-sari frames stepping up inside the summit
  for (let i = 0; i < 4; i++) {
    const r = IN - 0.3 - i * 0.35, y = tier1 + 0.05 + i * 0.16;
    for (let k = 0; k < 4; k++) {
      const [ax, az] = c4[k], [bx, bz] = c4[(k + 1) % 4];
      beam(V(ax * r, y, az * r), V(bx * r, y, bz * r), 0.14, frame);
    }
  }
  // brass mustaka on the summit
  const must = [];
  must.push(new THREE.CylinderGeometry(0.16, 0.24, 0.24, 8).translate(0, summit + 0.1, 0));
  must.push(new THREE.SphereGeometry(0.17, 14, 10).translate(0, summit + 0.36, 0));
  must.push(new THREE.ConeGeometry(0.06, 0.6, 8).translate(0, summit + 0.8, 0));
  group.add(new THREE.Mesh(merge(must), brass));
  // wing roofs: gables with the ridge along x
  for (const s of [-1, 1]) {
    const x0 = s * H6, x1 = s * (H6 + WW);
    for (const zs of [-1, 1]) {
      glass.push(quad(V(x0, wingWall, zs * WHD), V(x1, wingWall, zs * WHD), V(x1, wingRidge, 0), V(x0, wingRidge, 0)));
      for (let i = 0; i <= 9; i++) {
        const x = x0 + (x1 - x0) * (i / 9);
        beam(V(x, wingWall, zs * WHD), V(x, wingRidge, 0), i % 3 === 0 ? 0.12 : 0.06, frame);
      }
    }
    beam(V(x0, wingRidge, 0), V(x1, wingRidge, 0), 0.14, frame);
    glass.push(tri(V(x1, wingWall, -WHD), V(x1, wingWall, WHD), V(x1, wingRidge, 0)));
    beam(V(x1, wingWall, 0), V(x1, wingRidge, 0), 0.08, frame);
    // finial on the wing gable
    must.length = 0;
    group.add(new THREE.Mesh(merge([
      new THREE.SphereGeometry(0.09, 10, 8).translate(x1, wingRidge + 0.15, 0),
      new THREE.ConeGeometry(0.04, 0.35, 8).translate(x1, wingRidge + 0.4, 0),
    ]), brass));
  }

  // carved white brackets at the wing columns
  const brackets = [];
  for (const c of columnsAt) {
    const b = new THREE.PlaneGeometry(1.0, 0.85);
    b.translate(0.5, -0.42, 0);
    b.rotateY(Math.PI / 2);
    const inward = c.z > 0 ? 1 : -1;
    b.scale(1, 1, inward);
    b.translate(c.x, c.top, c.z - inward * 0.08);
    brackets.push(b);
  }
  if (brackets.length) group.add(new THREE.Mesh(merge(brackets), carvedMat));

  const frameMesh = new THREE.Mesh(merge(frame), white);
  frameMesh.castShadow = true;
  group.add(frameMesh);
  const wainsMesh = new THREE.Mesh(merge(wains), new THREE.MeshStandardMaterial({ color: '#f1eee7', roughness: 0.55 }));
  wainsMesh.castShadow = true;
  wainsMesh.receiveShadow = true;
  group.add(wainsMesh);
  const glassMesh = new THREE.Mesh(merge(glass), new THREE.MeshStandardMaterial({
    color: '#d3e6ec', transparent: true, opacity: 0.11, roughness: 0.04, metalness: 0.25, side: THREE.DoubleSide, depthWrite: false,
  }));
  glassMesh.renderOrder = 2;
  group.add(glassMesh);

  /* ---------- floors ---------- */
  const floorMat = () => {
    const t = marbleFloorTexture();
    return { t, m: new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.55 }) };
  };
  const hallF = floorMat(); hallF.t.repeat.set(12 / 3.2, 12 / 3.2);
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(H6 * 2, H6 * 2).rotateX(-Math.PI / 2), hallF.m);
  hall.position.y = 0.012; hall.receiveShadow = true;
  group.add(hall);
  for (const s of [-1, 1]) {
    const wf = floorMat(); wf.t.repeat.set(WW / 3.2, WHD * 2 / 3.2);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(WW, WHD * 2).rotateX(-Math.PI / 2), wf.m);
    f.position.set(s * (H6 + WW / 2), 0.012, 0); f.receiveShadow = true;
    group.add(f);
  }
  const med = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: medallionTexture(), roughness: 0.5, clearcoat: 0.3 }));
  med.position.set(0, 0.016, 2.2);
  group.add(med);

  /* ---------- the dais, the twin flights, the powder room beneath ---------- */
  const dz0 = D.z0, dz1 = D.z1, dzc = (dz0 + dz1) / 2, dzd = dz1 - dz0, DY = D.y;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(D.hw * 2, 0.3, dzd).translate(0, DY - 0.15, dzc), white);
  slab.castShadow = true;
  group.add(slab);
  const upF = floorMat(); upF.t.repeat.set(D.hw * 2 / 3.2, dzd / 3.2);
  const up = new THREE.Mesh(new THREE.PlaneGeometry(D.hw * 2, dzd).rotateX(-Math.PI / 2), upF.m);
  up.position.set(0, DY + 0.006, dzc); up.receiveShadow = true;
  group.add(up);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(D.hw * 2, 0.03, 0.02).translate(0, DY - 0.08, dz1 + 0.012), brass));
  const under = DY - 0.3;
  // front face with the arched doorway to the powder room
  const face = [];
  face.push(new THREE.BoxGeometry(D.hw - PR.doorHW, under, 0.16).translate(-(D.hw + PR.doorHW) / 2, under / 2, dz1));
  face.push(new THREE.BoxGeometry(D.hw - PR.doorHW, under, 0.16).translate((D.hw + PR.doorHW) / 2, under / 2, dz1));
  face.push(new THREE.BoxGeometry(PR.doorHW * 2, under - 1.95, 0.16).translate(0, 1.95 + (under - 1.95) / 2, dz1));
  const faceMesh = new THREE.Mesh(merge(face), marblePanel);
  faceMesh.castShadow = true;
  group.add(faceMesh);
  const dArch = [];
  dArch.push(new THREE.BoxGeometry(0.14, 1.95, 0.24).translate(-PR.doorHW - 0.07, 0.975, dz1));
  dArch.push(new THREE.BoxGeometry(0.14, 1.95, 0.24).translate(PR.doorHW + 0.07, 0.975, dz1));
  dArch.push(new THREE.BoxGeometry(PR.doorHW * 2 + 0.42, 0.12, 0.26).translate(0, 1.98, dz1));
  group.add(new THREE.Mesh(merge(dArch), teak));
  const lintel = new THREE.Mesh(new THREE.PlaneGeometry(PR.doorHW * 2 + 0.3, 0.12), new THREE.MeshStandardMaterial({ map: screenTex, alphaTest: 0.5, color: '#c9a25a', side: THREE.DoubleSide }));
  lintel.position.set(0, 2.05, dz1 + 0.14);
  group.add(lintel);

  // twin flights rising from the centre outward along the dais face
  const nSteps = 13, run = (F.x1 - F.x0) / nSteps, riseS = DY / nSteps, fz = (F.z0 + F.z1) / 2, fd = F.z1 - F.z0;
  const stairMat = new THREE.MeshPhysicalMaterial({ color: '#efe6d6', map: marbleTexture(512), roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const steps2 = [], noses = [], rails = [], caps = [];
  const balusters = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < nSteps; i++) {
      const x = s * (F.x0 + (i + 0.5) * run), h = (i + 1) * riseS;
      steps2.push(new THREE.BoxGeometry(run + 0.004, h, fd).translate(x, h / 2, fz));
      noses.push(new THREE.BoxGeometry(0.02, 0.012, fd).translate(s * (F.x0 + i * run) + s * 0.01, h + 0.003, fz));
    }
    // top landing up to the wall
    steps2.push(new THREE.BoxGeometry(D.hw - F.x1, DY, fd).translate(s * (F.x1 + D.hw) / 2, DY / 2, fz));
    // the balustrade along the open (hall) side of the flight, rising
    const zr = F.z1 - 0.04;
    beam(V(s * F.x0, 1.05, zr), V(s * F.x1, DY + 1.0, zr), 0.08, rails);
    beam(V(s * F.x1, DY + 1.0, zr), V(s * D.hw, DY + 1.0, zr), 0.08, rails);
    for (let i = 0; i < nSteps; i++) for (const f of [0.3, 0.8]) balusters.push(V(s * (F.x0 + (i + f) * run), (i + 1) * riseS + 0.5, zr));
    for (let x = F.x1 + 0.15; x < D.hw; x += 0.15) balusters.push(V(s * x, DY + 0.5, zr));
    rails.push(new THREE.BoxGeometry(0.17, 1.2, 0.17).translate(s * F.x0, 0.6, zr));
    caps.push(V(s * F.x0, 1.28, zr));
    // orchid garland along the handrail
    for (let k = 0; k < 22; k++) {
      const t = k / 21;
      const x = s * (F.x0 + t * (F.x1 - F.x0)), y = 1.1 + t * (DY - 0.05);
      flowers.add(k % 3 ? 'orchid' : 'rose', x, y + 0.02, zr + 0.06, { stem: 0, scale: 1.3 });
    }
  }
  const stairMesh = new THREE.Mesh(merge(steps2), stairMat);
  stairMesh.castShadow = true; stairMesh.receiveShadow = true;
  group.add(stairMesh);
  group.add(new THREE.Mesh(merge(noses), brass));
  // railing along the dais edge (gaps at the flight tops)
  const RAIL_X = F.x1 - 0.6;
  const railRun = (ax, bx, z, y) => {
    beam(V(ax, y + 1.0, z), V(bx, y + 1.0, z), 0.08, rails);
    beam(V(ax, y + 0.08, z), V(bx, y + 0.08, z), 0.06, rails);
    for (let x = Math.min(ax, bx) + 0.14; x < Math.max(ax, bx); x += 0.14) balusters.push(V(x, y + 0.54, z));
    for (const x of [ax, bx]) { rails.push(new THREE.BoxGeometry(0.12, 1.0, 0.12).translate(x, y + 0.5, z)); caps.push(V(x, y + 1.08, z)); }
  };
  railRun(-RAIL_X, RAIL_X, dz1 + 0.06, DY);
  // a short balustrade closing each landing's outer end, where the wing opening is
  for (const s of [-1, 1]) {
    const xe = s * (D.hw - 0.06);
    beam(V(xe, DY + 1.0, F.z0), V(xe, DY + 1.0, F.z1), 0.08, rails);
    beam(V(xe, DY + 0.08, F.z0), V(xe, DY + 0.08, F.z1), 0.06, rails);
    for (let z = F.z0 + 0.14; z < F.z1 - 0.05; z += 0.14) balusters.push(V(xe, DY + 0.54, z));
    rails.push(new THREE.BoxGeometry(0.12, 1.0, 0.12).translate(xe, DY + 0.5, F.z0));
    caps.push(V(xe, DY + 1.08, F.z0));
  }
  const balMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.03, 0.88, 8), white, balusters.length);
  balusters.forEach((p, i) => balMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  balMesh.castShadow = true;
  group.add(balMesh);
  group.add(new THREE.Mesh(merge(rails), white));
  const capMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 12, 10), brass, caps.length);
  caps.forEach((p, i) => capMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  group.add(capMesh);
  // brass stanchions + gold ropes framing the way to the powder room
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#d8b04a', roughness: 0.55, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const sx = s * 1.25, sz = F.z1 + 1.3;
    const st = [];
    st.push(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20).translate(sx, 0.02, sz));
    rod(V(sx, 0.02, sz), V(sx, 0.95, sz), 0.025, st);
    st.push(new THREE.SphereGeometry(0.05, 12, 10).translate(sx, 0.98, sz));
    group.add(new THREE.Mesh(merge(st), brass));
    const pts = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; const p = V(sx, 0.9, sz).lerp(V(s * F.x0, 1.1, F.z1 - 0.04), t); p.y -= Math.sin(Math.PI * t) * 0.16; pts.push(p); }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 6), ropeMat));
  }

  // --- the powder room: a jewel box ---
  const pwr = [];
  pwr.push(new THREE.BoxGeometry(0.12, under, dzd).translate(-PR.hw, under / 2, dzc));
  pwr.push(new THREE.BoxGeometry(0.12, under, dzd).translate(PR.hw, under / 2, dzc));
  pwr.push(new THREE.BoxGeometry(PR.hw * 2, under, 0.1).translate(0, under / 2, dz0 + 0.12));
  const pwrMesh = new THREE.Mesh(merge(pwr), marblePanel);
  pwrMesh.castShadow = true; pwrMesh.receiveShadow = true;
  group.add(pwrMesh);
  // emerald-and-gold batik wall panels in brass frames on the side walls
  const wallBatik = batikTexture('#1f4a3a', '#d8b46a');
  wallBatik.repeat.set(1.5, 1);
  for (const s of [-1, 1]) {
    const pnl = new THREE.Mesh(new THREE.PlaneGeometry(dzd - 0.5, 1.5), new THREE.MeshStandardMaterial({ map: wallBatik, roughness: 0.6 }));
    pnl.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    pnl.position.set(s * (PR.hw - 0.07), 1.2, dzc);
    group.add(pnl);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.58, dzd - 0.42).translate(s * (PR.hw - 0.075), 1.2, dzc), brass));
  }
  // vanity: floating teak with brass pulls, marble top, twin vessel basins + taps
  const van = new THREE.Group();
  van.position.set(0, 0, dz0 + 0.45);
  van.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.38, 0.52).translate(0, 0.62, 0), teak));
  van.add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.58).translate(0, 0.835, 0), marblePanel));
  const vp = [];
  for (const x of [-0.9, -0.3, 0.3, 0.9]) vp.push(new THREE.BoxGeometry(0.16, 0.018, 0.02).translate(x, 0.62, 0.27));
  for (const s of [-1, 1]) {
    rod(V(s * 0.6, 0.86, -0.2), V(s * 0.6, 1.14, -0.2), 0.014, vp);
    rod(V(s * 0.6, 1.14, -0.2), V(s * 0.6, 1.12, -0.06), 0.012, vp);
    const basin = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.11, 0], [0.18, 0.05], [0.2, 0.12], [0.19, 0.12], [0.17, 0.06], [0.1, 0.015], [0, 0.015]].map(([r, y]) => new THREE.Vector2(r, y)), 32),
      new THREE.MeshPhysicalMaterial({ color: '#fbfaf7', roughness: 0.12, clearcoat: 1, side: THREE.DoubleSide }));
    basin.position.set(s * 0.6, 0.86, 0.02);
    van.add(basin);
  }
  van.add(new THREE.Mesh(merge(vp), brass));
  // a tall arched mirror with a warm backlit edge
  const archShape = new THREE.Shape();
  archShape.moveTo(-0.55, 0); archShape.lineTo(0.55, 0); archShape.lineTo(0.55, 0.75); archShape.absarc(0, 0.75, 0.55, 0, Math.PI, false); archShape.lineTo(-0.55, 0);
  const mirror = new THREE.Mesh(new THREE.ShapeGeometry(archShape, 24), new THREE.MeshStandardMaterial({ color: '#b9c3c8', roughness: 0.04, metalness: 0.95 }));
  mirror.position.set(0, 0.95, -0.22);
  van.add(mirror);
  const glowPts = archShape.getPoints(40).map((p) => V(p.x * 1.03, p.y * 1.02 + 0.95, -0.225));
  van.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(glowPts, true), 80, 0.014, 6, true), new THREE.MeshStandardMaterial({ color: '#ffe7c0', emissive: '#ffc070', emissiveIntensity: 2.0 })));
  for (const s of [-1, 1]) { const sc = sconce(); sc.position.set(s * 1.0, 1.55, -0.22); van.add(sc); }
  // perfume tray, an orchid arrangement, rolled towels
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 24), brass);
  tray.position.set(0, 0.866, -0.05);
  van.add(tray);
  ['#e8b8c8', '#c9a25a', '#d8b0e8', '#f3e6c4'].forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.09 + i * 0.02, 12), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1 }));
    b.position.set(-0.08 + i * 0.055, 0.92 + i * 0.01, -0.05 + (i % 2) * 0.05);
    van.add(b);
  });
  const vo = orchid(rng, 1.3);
  vo.position.set(1.1, 0.86, -0.05);
  van.add(vo);
  const tw = [];
  for (let i = 0; i < 4; i++) tw.push(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 14).rotateZ(Math.PI / 2).translate(-1.05, 0.9 + (i > 2 ? 0.07 : 0), -0.12 + (i % 3) * 0.09));
  van.add(new THREE.Mesh(merge(tw), new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.95 })));
  group.add(van);
  // a small crystal chandelier, a gilt stool, a round rug, a flower pedestal
  const pc = chandelier(0.32);
  pc.position.set(0, under - 0.62, dzc + 0.2);
  group.add(pc);
  const stool = new THREE.Group();
  stool.position.set(-1.9, 0, dzc + 0.6);
  stool.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24).translate(0, 0.45, 0), new THREE.MeshStandardMaterial({ color: '#6a2a3a', roughness: 0.85 })));
  const sl = [];
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; rod(V(Math.cos(a) * 0.15, 0.4, Math.sin(a) * 0.15), V(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19), 0.014, sl, 6); }
  stool.add(new THREE.Mesh(merge(sl), brass));
  group.add(stool);
  const prug = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: batikTexture('#5a2a3a', '#e8c98a'), roughness: 0.95 }));
  prug.position.set(0, 0.018, dzc + 0.3);
  group.add(prug);
  const ped = new THREE.Group();
  ped.position.set(1.9, 0, dzc + 0.7);
  ped.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.9, 16).translate(0, 0.45, 0), marblePanel));
  group.add(ped);
  for (let k = 0; k < 24; k++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.24;
    flowers.add(['peony', 'rose', 'ranunculus', 'orchid'][k % 4], 1.9 + Math.cos(a) * r, 1.1 + rng() * 0.3, dzc + 0.7 + Math.sin(a) * r, { stem: 0.18, scale: 1.4 });
  }
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.22, 20).translate(1.9, 1.0, dzc + 0.7), new THREE.MeshPhysicalMaterial({ color: '#f5f3ee', roughness: 0.2, clearcoat: 0.8 })));
  const powderLight = new THREE.PointLight('#ffcf8a', 1.5, 5.5, 2);
  powderLight.position.set(0, under - 1.0, dzc + 0.8); // low and forward, so the ceiling doesn't burn out
  group.add(powderLight);

  /* ---------- on the dais: her desk, armchairs, side tables, palms ---------- */
  const deskZ = dz0 + 1.25;
  const d = desk(rng, cane, batik);
  d.group.position.set(0, DY, deskZ);
  group.add(d.group);
  const rugTex = batikTexture('#22305a', '#e8dcc2');
  rugTex.repeat.set(4, 2.4);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 }));
  rug.position.set(0, DY + 0.015, deskZ + 0.45);
  group.add(rug);
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 3.55, DY, deskZ + 0.6);
    arm.rotation.y = s * -0.9;
    const af = [];
    af.push(new THREE.BoxGeometry(0.8, 0.12, 0.75).translate(0, 0.38, 0));
    for (const t of [-1, 1]) af.push(new THREE.BoxGeometry(0.08, 0.3, 0.75).translate(t * 0.4, 0.55, 0));
    for (const [x, z] of [[-0.35, -0.32], [0.35, -0.32], [-0.35, 0.32], [0.35, 0.32]]) af.push(new THREE.BoxGeometry(0.04, 0.32, 0.04).translate(x, 0.16, z));
    arm.add(new THREE.Mesh(merge(af), teak));
    const cu = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: '#e9dcc4', roughness: 0.9 }));
    cu.position.y = 0.5;
    arm.add(cu);
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.6), cane);
    bk.position.set(0, 0.78, 0.36); bk.rotation.x = -0.25;
    arm.add(bk);
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), new THREE.MeshStandardMaterial({ map: batik, roughness: 0.9 }));
    pil.position.set(0.1, 0.72, 0.25); pil.rotation.x = -0.3;
    arm.add(pil);
    group.add(arm);
    const st = new THREE.Group();
    st.position.set(s * 4.7, DY, deskZ - 0.4);
    st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 24).translate(0, 0.55, 0), new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.15, clearcoat: 0.8 })));
    st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 10).translate(0, 0.275, 0), brass));
    const so = orchid(rng, 1.1, s > 0 ? '#f3c8dc' : '#efe6f6');
    so.position.y = 0.565;
    st.add(so);
    group.add(st);
    const p = palmFronds(rng, 1.05);
    p.position.set(s * (D.hw - 0.55), DY, dz0 + 0.55);
    group.add(p);
  }

  /* ---------- ground floor: the lobby centrepiece, urns, palms ---------- */
  const cp = new THREE.Group();
  cp.position.set(0, 0, 2.2);
  cp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 40).translate(0, 0.78, 0), new THREE.MeshPhysicalMaterial({ color: '#f2eee6', roughness: 0.15, clearcoat: 0.9 })));
  cp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.76, 20).translate(0, 0.38, 0), brass));
  cp.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.22, 0.12], [0.18, 0.32], [0.24, 0.48], [0.26, 0.5]].map(([r, y]) => new THREE.Vector2(r, y)), 28).translate(0, 0.8, 0),
    new THREE.MeshPhysicalMaterial({ color: '#f6f4ef', map: marbleTexture(512), roughness: 0.2, clearcoat: 0.8 })));
  group.add(cp);
  // a grand dome of blooms in the centrepiece vase
  for (let k = 0; k < 120; k++) {
    const u = rng(), v = rng();
    const th = u * Math.PI * 2, ph = Math.acos(1 - v * 0.95);
    const R = 0.75;
    const fx = Math.sin(ph) * Math.cos(th) * R, fy = Math.cos(ph) * R * 0.85, fz = Math.sin(ph) * Math.sin(th) * R;
    flowers.add(['peony', 'rose', 'orchid', 'tulip', 'ranunculus', 'rose', 'peony'][k % 7], fx, 1.35 + fy, 2.2 + fz, { stem: 0, scale: 1.9 + rng() * 0.6 });
  }
  // tall flower urns either side of the door, palms in the front corners
  for (const s of [-1, 1]) {
    const ux = s * 2.3, uz = H6 - 0.9;
    group.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.22, 0], [0.18, 0.1], [0.12, 0.45], [0.3, 0.85], [0.34, 0.9]].map(([r, y]) => new THREE.Vector2(r, y)), 24).translate(ux, 0, uz),
      new THREE.MeshPhysicalMaterial({ color: '#f5f3ee', roughness: 0.25, clearcoat: 0.7 })));
    for (let k = 0; k < 40; k++) {
      const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.38;
      flowers.add(['orchid', 'peony', 'rose', 'daisy'][k % 4], ux + Math.cos(a) * r, 1.05 + rng() * 0.55 + (0.38 - r) * 0.6, uz + Math.sin(a) * r, { stem: 0, scale: 1.6 });
    }
    const p = palmFronds(rng, 1.3);
    p.position.set(s * (H6 - 0.8), 0, H6 - 2.4);
    group.add(p);
    // orchids lining the foot of each flight
    for (let k = 0; k < 4; k++) {
      const o = orchid(rng, 1.15, ['#f8f4f6', '#f0c8dc', '#d8b0e8', '#f8f4f6'][k]);
      o.position.set(s * (2.1 + k * 0.9), 0, F.z1 + 0.35);
      group.add(o);
    }
  }

  /* ---------- the wings: maximalist flowers ---------- */
  const bedMat = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.8 });
  const soil = new THREE.MeshStandardMaterial({ color: '#3a2a1e', roughness: 1 });
  const types = ['rose', 'tulip', 'daisy', 'peony', 'ranunculus', 'primrose'];
  const tables = [];
  const orchidCols = ['#f8f4f6', '#f0c8dc', '#d8b0e8', '#e8d8f0'];
  for (const s of [-1, 1]) {
    const cx = s * (H6 + WW / 2);
    // raised beds along both long walls, packed: a tall back row, palms at the ends, orchids along the front
    for (const zs of [-1, 1]) {
      const bz = zs * (WHD - 0.65);
      group.add(new THREE.Mesh(new THREE.BoxGeometry(WW - 0.8, 0.5, 1.1).translate(cx, 0.25, bz), bedMat));
      group.add(new THREE.Mesh(new THREE.BoxGeometry(WW - 0.95, 0.02, 0.95).translate(cx, 0.5, bz), soil));
      flowers.bed(types, cx, bz - zs * 0.12, WW - 1.1, 0.6, 0.5, 340, { minH: 0.12, varH: 0.4, scale: 1.9 });
      for (let k = 0; k < 60; k++) {
        const t = ['peony', 'rose', 'tulip', 'ranunculus'][k % 4], h = 0.55 + rng() * 0.35;
        flowers.add(t, cx + (rng() - 0.5) * (WW - 1.3), 0.5 + h, bz + zs * (0.28 + rng() * 0.12), { stem: h, scale: 2.1 });
      }
      for (const ex of [-1, 1]) {
        const p = palmFronds(rng, 0.85);
        p.position.set(cx + ex * (WW / 2 - 0.8), 0.5, bz + zs * 0.12);
        group.add(p);
      }
      for (let k = 0; k < 6; k++) {
        const o = orchid(rng, 1.25, orchidCols[(k + (zs > 0 ? 1 : 0)) % 4]);
        o.position.set(cx - (WW - 1.8) / 2 + k * ((WW - 1.8) / 5), 0, bz - zs * 0.74);
        group.add(o);
      }
    }
    // an orchid living wall above the north bed
    group.add(new THREE.Mesh(new THREE.BoxGeometry(WW - 0.8, 2.2, 0.08).translate(cx, 2.1, -WHD + 0.12), new THREE.MeshStandardMaterial({ color: '#2f4a2a', roughness: 1 })));
    for (let k = 0; k < 150; k++) {
      flowers.add('orchid', cx + (rng() - 0.5) * (WW - 1.0), 1.1 + rng() * 2.0, -WHD + 0.2, { stem: 0, scale: 1.6 + rng() * 0.5, tilt: 0.6 });
    }
    // a raised octagonal planter in the middle of the wing, a tiered étagère rising out of it
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.66, 0.42, 8).rotateY(Math.PI / 8).translate(cx, 0.21, 0), bedMat));
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.02, 8).rotateY(Math.PI / 8).translate(cx, 0.425, 0), soil));
    for (let k = 0; k < 280; k++) {
      const a = rng() * Math.PI * 2, r = 0.55 + Math.sqrt(rng()) * 0.9, h = 0.12 + rng() * 0.35 + (1.45 - r) * 0.25;
      flowers.add(types[k % types.length], cx + Math.cos(a) * r, 0.42 + h, Math.sin(a) * r, { stem: h, scale: 1.9 });
    }
    const et = [];
    for (const [r, y] of [[0.62, 0.95], [0.48, 1.35], [0.32, 1.72]]) {
      et.push(new THREE.CylinderGeometry(r, r, 0.04, 32).translate(cx, y, 0));
      et.push(new THREE.TorusGeometry(r, 0.015, 6, 32).rotateX(Math.PI / 2).translate(cx, y + 0.03, 0));
      const n = Math.round(r * 26);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        flowers.add(k % 2 ? 'orchid' : types[k % types.length], cx + Math.cos(a) * (r - 0.1), y + 0.22, Math.sin(a) * (r - 0.1), { stem: 0.18, scale: 1.7 });
      }
    }
    rod(V(cx, 0.42, 0), V(cx, 2.0, 0), 0.03, et);
    et.push(new THREE.SphereGeometry(0.07, 12, 8).translate(cx, 2.05, 0));
    group.add(new THREE.Mesh(merge(et), white));
    // hanging orchid baskets from the wing roof
    for (const hk of [-2.2, 0, 2.2]) for (const zz of [-1.9, 1.9]) {
      const hx = cx + hk;
      const bk = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ map: bambooTexture(), side: THREE.DoubleSide }));
      bk.position.set(hx, 3.25, zz);
      group.add(bk);
      const ch = [];
      rod(V(hx, 3.25, zz), V(hx, 4.35, zz), 0.005, ch, 4);
      group.add(new THREE.Mesh(merge(ch), brass));
      for (let k = 0; k < 18; k++) {
        const a = rng() * Math.PI * 2, rr = 0.12 + rng() * 0.12;
        flowers.add('orchid', hx + Math.cos(a) * rr, 3.22 - rng() * 0.55, zz + Math.sin(a) * rr, { stem: 0, scale: 1.5, tilt: 0.8 });
      }
    }
    // string lights along the wing ridge
    const bl = [];
    for (let k = 0; k < 14; k++) bl.push(new THREE.SphereGeometry(0.03, 8, 6).translate(s * (H6 + 0.3 + k * 0.48), wingRidge - 0.18 - Math.abs(Math.sin(k * 0.9)) * 0.08, 0));
    group.add(new THREE.Mesh(merge(bl), new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffc070', emissiveIntensity: 2.6 })));
    // a warm glow under the ridge, so the flowers keep their colours at night
    const wl = new THREE.PointLight('#ffc98a', 7, 10, 2);
    wl.position.set(cx, 3.4, 0);
    group.add(wl);
  }
  // left wing end: the jamu gendong self-bar; right wing end: the orchid potting table
  const jamu = jamuGendong(rng, batikTexture('#6b2a1a', '#efd6a0'), bambooTexture());
  jamu.group.position.set(-(H6 + WW) + 0.55, 0, 0);
  group.add(jamu.group);
  const pot = pottingTable(rng);
  pot.position.set(H6 + WW - 0.55, 0, 0);
  pot.rotation.y = Math.PI;
  group.add(pot);
  for (let k = 0; k < 12; k++) flowers.add(k % 2 ? 'orchid' : 'primrose', H6 + WW - 0.55 + (rng() - 0.5) * 0.2, 1.12 + rng() * 0.1, -0.95 + (k % 7) * 0.32, { stem: 0.12, scale: 1.3 });

  /* ---------- light ---------- */
  const chand = chandelier(1.35);
  chand.position.set(0, tier1 - 2.2, 0.8);
  group.add(chand);
  for (const c of columnsAt) {
    const sc = sconce();
    const inward = c.z > 0 ? -1 : 1;
    sc.position.set(c.x, 2.2, c.z + inward * 0.1);
    sc.rotation.y = inward > 0 ? 0 : Math.PI;
    group.add(sc);
  }
  const light = new THREE.PointLight('#ffc27a', 20, 18, 2);
  light.position.set(0, tier1 - 2.6, 1.0);
  group.add(light);
  const lampLight = new THREE.PointLight('#ffcf8a', 0, 3.5, 2);
  lampLight.position.set(d.lampLocal.x, DY + d.lampLocal.y, deskZ + d.lampLocal.z);
  group.add(lampLight);

  group.add(flowers.build());

  group.updateMatrixWorld(true);
  const toWorld = (v) => v.clone().applyMatrix4(group.matrixWorld);
  const deskW = (v) => toWorld(V(v.x, v.y + DY, v.z + deskZ));

  /* ---------- colliders (world space, some only on one floor) ---------- */
  const W = (x, z) => [G.x + x, G.z + z];
  const seg = (a, b, r = 0.2, extra = {}) => ({ seg: [...W(a[0], a[1]), ...W(b[0], b[1])], r, ...extra });
  const LOW = { maxY: y0 + 1.2 }, HIGH = { minY: y0 + 1.2 };
  const XW = H6 + WW;
  const colliders = [
    // the hall
    seg([-H6, H6], [-doorHalf, H6]), seg([doorHalf, H6], [H6, H6]), seg([-H6, -H6], [H6, -H6]),
    seg([-H6, -H6], [-H6, OPEN0]), seg([H6, -H6], [H6, OPEN0]), seg([-H6, OPEN1], [-H6, H6]), seg([H6, OPEN1], [H6, H6]),
    // the wings
    seg([H6, WHD], [XW, WHD]), seg([H6, -WHD], [XW, -WHD]), seg([XW, -WHD], [XW, WHD]),
    seg([-H6, WHD], [-XW, WHD]), seg([-H6, -WHD], [-XW, -WHD]), seg([-XW, -WHD], [-XW, WHD]),
    // the twin flights: their open side, and the dais face below
    seg([-F.x0, F.z1], [-D.hw, F.z1], 0.12), seg([F.x0, F.z1], [D.hw, F.z1], 0.12),
    seg([-D.hw, D.z1], [-PR.doorHW, D.z1], 0.15, LOW), seg([PR.doorHW, D.z1], [D.hw, D.z1], 0.15, LOW),
    // the powder room
    seg([-PR.hw, D.z0], [-PR.hw, D.z1], 0.12, LOW), seg([PR.hw, D.z0], [PR.hw, D.z1], 0.12, LOW),
    seg([-1.3, D.z0 + 0.45], [1.3, D.z0 + 0.45], 0.32, LOW),
    { x: G.x - 1.9, z: G.z + dzc + 0.6, r: 0.24, ...LOW }, { x: G.x + 1.9, z: G.z + dzc + 0.7, r: 0.26, ...LOW },
    // up on the dais
    seg([-RAIL_X, D.z1 + 0.06], [RAIL_X, D.z1 + 0.06], 0.14, HIGH),
    seg([-(D.hw - 0.06), F.z0], [-(D.hw - 0.06), F.z1], 0.16, HIGH), seg([D.hw - 0.06, F.z0], [D.hw - 0.06, F.z1], 0.16, HIGH),
    seg([-1.2, deskZ], [1.2, deskZ], 0.5, HIGH),
    { x: G.x - 3.55, z: G.z + deskZ + 0.6, r: 0.5, ...HIGH }, { x: G.x + 3.55, z: G.z + deskZ + 0.6, r: 0.5, ...HIGH },
    { x: G.x - 4.7, z: G.z + deskZ - 0.4, r: 0.28, ...HIGH }, { x: G.x + 4.7, z: G.z + deskZ - 0.4, r: 0.28, ...HIGH },
    // ground floor
    { x: G.x, z: G.z + 2.2, r: 0.95, ...LOW },
    { x: G.x - 2.3, z: G.z + H6 - 0.9, r: 0.4, ...LOW }, { x: G.x + 2.3, z: G.z + H6 - 0.9, r: 0.4, ...LOW },
    { x: G.x - (H6 - 0.8), z: G.z + H6 - 2.4, r: 0.45, ...LOW }, { x: G.x + (H6 - 0.8), z: G.z + H6 - 2.4, r: 0.45, ...LOW },
    { x: G.x - 1.25, z: G.z + F.z1 + 1.3, r: 0.18 }, { x: G.x + 1.25, z: G.z + F.z1 + 1.3, r: 0.18 },
    ...[-1, 1].flatMap((s) => [
      seg([s * (H6 + 0.4), WHD - 0.65], [s * (XW - 0.4), WHD - 0.65], 0.72, LOW),
      seg([s * (H6 + 0.4), -WHD + 0.65], [s * (XW - 0.4), -WHD + 0.65], 0.72, LOW),
      { x: G.x + s * (H6 + WW / 2), z: G.z, r: 1.72, ...LOW },
      seg([s * (XW - 0.55), -1.15], [s * (XW - 0.55), 1.15], 0.38, LOW),
    ]),
  ];

  // jamu bottles: positions in the world
  jamu.group.updateMatrixWorld(true);
  const jamuI = jamu.bottles.map((b) => ({ center: jamu.group.localToWorld(b.local.clone()), radius: 0.12, label: `jamu · ${b.kind}`, food: 'jamu', flavor: b.kind }));
  tables.push(jamu.group.localToWorld(V(0, 0.66, 0.0)));
  tables.push(pot.localToWorld(V(0, 0.9, 0.4)));

  let lampOn = 0.3, lampTarget = 0.3;
  const flowerMats = [];
  d.flower.traverse((o) => { if (o.isMesh && o.material.emissive) flowerMats.push({ m: o.material, base: o.material.emissiveIntensity }); });

  return {
    group, light, colliders, lampLight,
    tables: [...tables, deskW(d.deskTop)],
    deskTop: deskW(d.deskTop),
    journal: { center: deskW(d.journalLocal), radius: 0.32 },
    interacts: [
      { center: deskW(d.flowerLocal), radius: 0.26, label: 'click to look closer', message: itemMessages.flower },
      { center: deskW(d.mugLocal), radius: 0.18, label: 'click to look closer', message: itemMessages.mug },
    ],
    jamu: jamuI,
    setLamp(on) { lampTarget = on ? 1 : 0.3; },
    update(t, dt) {
      lampOn += (lampTarget - lampOn) * Math.min(1, dt * 0.8);
      d.bulbMat.emissiveIntensity = lampOn * 1.6;
      d.shadeMat.emissiveIntensity = lampOn * 0.25;
      lampLight.intensity = lampOn * 2.6;
      for (const f of flowerMats) f.m.emissiveIntensity = f.base * (1 + lampOn * 1.6 + Math.sin(t * 1.5) * 0.15 * lampOn);
    },
  };
}
