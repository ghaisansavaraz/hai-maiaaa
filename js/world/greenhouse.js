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
  const H = 0.76, W = 1.7, D = 0.8;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D).translate(0, H - 0.03, 0), teak));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.1, D - 0.1).translate(0, H - 0.11, 0), teakDark));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.008, 0.01).translate(0, H - 0.1, D / 2 - 0.045), brass));
  const legs = [];
  for (const [x, z] of [[-W / 2 + 0.07, -D / 2 + 0.07], [W / 2 - 0.07, -D / 2 + 0.07], [-W / 2 + 0.07, D / 2 - 0.07], [W / 2 - 0.07, D / 2 - 0.07]]) {
    legs.push(new THREE.BoxGeometry(0.035, H - 0.06, 0.035).translate(x, (H - 0.06) / 2, z));
  }
  legs.push(new THREE.BoxGeometry(W - 0.14, 0.02, 0.02).translate(0, 0.12, -D / 2 + 0.07));
  legs.push(new THREE.BoxGeometry(W - 0.14, 0.02, 0.02).translate(0, 0.12, D / 2 - 0.07));
  g.add(new THREE.Mesh(merge(legs), brass));
  const top = H + 0.001;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.004, 0.5).translate(0, top + 0.002, 0.08), leather));

  // brass task lamp with a dome shade (back right)
  const lamp = new THREE.Group();
  lamp.position.set(0.6, top, -0.22);
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
  let bx = -0.38;
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
    b.position.set(-0.6, sy + h / 2, 0.16);
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
  vase.position.set(-0.66, top, -0.24);
  vase.scale.setScalar(0.85);
  vase.rotation.y = Math.PI / 2;
  g.add(vase);
  const m = mug();
  m.position.set(0.5, top, 0.22);
  m.rotation.y = -Math.PI / 2 - 0.3;
  m.scale.setScalar(1.3);
  g.add(m);
  const orc = orchid(rng, 1.1);
  orc.position.set(0.32, top, -0.26);
  g.add(orc);

  // chair: teak frame, cane back, batik cushion
  const chair = new THREE.Group();
  chair.position.set(0.0, 0, D / 2 + 0.4);
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
    lampLocal: V(0.4, top + 0.42, -0.15),
    flowerLocal: V(-0.66, top + 0.38, -0.24),
    mugLocal: V(0.5, top + 0.09, 0.22),
    deskTop: V(-0.3, top, 0.28),
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

/* ---------------- the building ---------------- */

export function createGreenhouse(itemMessages = {}) {
  const G = GREENHOUSE;
  const y0 = GREENHOUSE_FLOOR_Y;
  const group = new THREE.Group();
  group.position.set(G.x, y0, G.z);
  const rng = mulberry32(33);
  const { hw, hd, wallH, roofH, mezzY, mezzZ, stairHW, stairZ } = G;
  const doorHalf = G.doorW / 2;
  const KNEE = 0.9, T = 0.07, TRANSOM = 3.3;
  const rise = roofH - wallH;

  const frame = [], glass = [], wains = [];
  const white = new THREE.MeshStandardMaterial({ color: '#f6f4ef', roughness: 0.45, metalness: 0.05 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 });
  const cane = new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.8, side: THREE.DoubleSide });
  const batik = batikTexture();
  const screenTex = carvedTexture('screen');
  const carvedMat = new THREE.MeshStandardMaterial({ map: carvedTexture('bracket'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
  const columnsAt = [];

  /** A glazed wall run: white wainscot, glass with arched window heads, mullions. */
  function wallRun(ax, az, bx, bz, { columns = true } = {}) {
    const len = Math.hypot(bx - ax, bz - az);
    const dx = (bx - ax) / len, dz = (bz - az) / len;
    const n = Math.max(1, Math.round(len / 0.75));
    const yaw = Math.atan2(-dz, dx);
    const wb = new THREE.BoxGeometry(len, KNEE, 0.12); wb.rotateY(yaw); wb.translate((ax + bx) / 2, KNEE / 2, (az + bz) / 2);
    wains.push(wb);
    const cap = new THREE.BoxGeometry(len + 0.02, 0.05, 0.2); cap.rotateY(yaw); cap.translate((ax + bx) / 2, KNEE + 0.025, (az + bz) / 2);
    frame.push(cap);
    glass.push(vquad(ax, az, bx, bz, KNEE + 0.05, wallH));
    beam(V(ax, wallH, az), V(bx, wallH, bz), T * 1.4, frame);
    beam(V(ax, TRANSOM, az), V(bx, TRANSOM, bz), T * 0.8, frame);
    for (let i = 0; i <= n; i++) {
      const x = ax + dx * len * (i / n), z = az + dz * len * (i / n);
      const isCol = columns && (i % 3 === 0);
      beam(V(x, KNEE + 0.05, z), V(x, wallH, z), isCol ? 0.16 : T, frame);
      if (isCol && i > 0 && i < n) columnsAt.push({ x, z });
      if (i < n) {
        const span = len / n;
        const arc = new THREE.TorusGeometry(span / 2, 0.02, 4, 14, Math.PI);
        arc.rotateY(yaw);
        arc.translate(x + dx * span / 2, TRANSOM - span / 2 + 0.03, z + dz * span / 2);
        frame.push(arc);
        const arc2 = new THREE.TorusGeometry(span / 2, 0.012, 4, 14, Math.PI);
        arc2.rotateY(yaw);
        arc2.translate(x + dx * span / 2, wallH - span / 2 - 0.05, z + dz * span / 2);
        frame.push(arc2);
      }
    }
  }

  // --- walls: long east + west, north end, south end with the door ---
  wallRun(hw, hd, hw, -hd);
  wallRun(-hw, -hd, -hw, hd);
  wallRun(-hw, -hd, hw, -hd, { columns: false });
  wallRun(hw, hd, doorHalf, hd, { columns: false });
  wallRun(-doorHalf, hd, -hw, hd, { columns: false });
  // the doorway: tall glass double doors (open) under a carved white transom panel
  const doorH = 2.8;
  beam(V(-doorHalf, 0, hd), V(-doorHalf, wallH, hd), 0.18, frame);
  beam(V(doorHalf, 0, hd), V(doorHalf, wallH, hd), 0.18, frame);
  beam(V(-doorHalf, doorH, hd), V(doorHalf, doorH, hd), 0.14, frame);
  glass.push(vquad(-doorHalf, hd, doorHalf, hd, doorH + 0.07, wallH));
  const transomPanel = new THREE.Mesh(new THREE.PlaneGeometry(G.doorW - 0.2, wallH - doorH - 0.2), new THREE.MeshStandardMaterial({ map: screenTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  transomPanel.position.set(0, (doorH + wallH) / 2, hd - 0.05);
  group.add(transomPanel);
  const doorGlass = new THREE.MeshStandardMaterial({ color: '#d6e8ee', transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * doorHalf, 0, hd);
    hinge.rotation.y = s * -1.35;
    const leaf = new THREE.Group();
    leaf.position.set(-s * doorHalf / 2, 0, 0);
    const lf = [];
    lf.push(new THREE.BoxGeometry(doorHalf, 0.08, 0.06).translate(0, 0.04, 0));
    lf.push(new THREE.BoxGeometry(doorHalf, 0.08, 0.06).translate(0, doorH - 0.04, 0));
    lf.push(new THREE.BoxGeometry(0.07, doorH, 0.06).translate(-doorHalf / 2 + 0.035, doorH / 2, 0));
    lf.push(new THREE.BoxGeometry(0.07, doorH, 0.06).translate(doorHalf / 2 - 0.035, doorH / 2, 0));
    leaf.add(new THREE.Mesh(merge(lf), white));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(doorHalf - 0.12, doorH - 0.14).translate(0, doorH / 2, 0), doorGlass);
    pane.renderOrder = 2;
    leaf.add(pane);
    const handle = [];
    rod(V(-s * (doorHalf / 2 - 0.14), 0.75, 0.05), V(-s * (doorHalf / 2 - 0.14), 1.35, 0.05), 0.012, handle);
    leaf.add(new THREE.Mesh(merge(handle), brass));
    hinge.add(leaf);
    group.add(hinge);
  }
  // entrance canopy outside: a slim white flat roof with a brass edge, and marble steps
  group.add(new THREE.Mesh(new THREE.BoxGeometry(G.doorW + 1.6, 0.12, 1.6).translate(0, doorH + 0.5, hd + 0.8), white));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(G.doorW + 1.62, 0.03, 1.62).translate(0, doorH + 0.44, hd + 0.8), brass));
  for (const s of [-1, 1]) rod(V(s * (doorHalf + 0.6), doorH + 0.45, hd + 1.5), V(s * (doorHalf + 0.6), 0, hd + 1.5), 0.05, frame, 10);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(G.doorW + 1.2, 0.1, 1.8).translate(0, 0.0, hd + 0.9), new THREE.MeshPhysicalMaterial({ color: '#efe8dc', roughness: 0.3, clearcoat: 0.4 })));

  // --- roof: gable glass slopes, white rafters, a white coffered band along the ridge ---
  const nR = Math.round((hd * 2) / 0.75);
  const bandY = roofH - 0.55;
  for (const s of [-1, 1]) {
    glass.push(quad(V(s * hw, wallH, hd), V(s * hw, wallH, -hd), V(s * 1.7, bandY, -hd), V(s * 1.7, bandY, hd)));
    for (let i = 0; i <= nR; i++) {
      const z = -hd + (i / nR) * hd * 2;
      beam(V(s * hw, wallH, z), V(s * 1.7, bandY, z), i % 3 === 0 ? T * 1.6 : T * 0.8, frame);
    }
    beam(V(s * hw * 0.62, wallH + (bandY - wallH) * 0.45, -hd), V(s * hw * 0.62, wallH + (bandY - wallH) * 0.45, hd), T * 0.8, frame);
    beam(V(s * (hw + 0.1), wallH + 0.02, -hd), V(s * (hw + 0.1), wallH + 0.02, hd), 0.14, frame);
    frame.push(new THREE.BoxGeometry(0.12, 0.5, hd * 2).translate(s * 1.8, roofH - 0.3, 0));
  }
  frame.push(new THREE.BoxGeometry(3.6, 0.12, hd * 2).translate(0, roofH - 0.5, 0));
  for (let z = -hd + 0.75; z < hd; z += 1.5) frame.push(new THREE.BoxGeometry(3.4, 0.08, 0.08).translate(0, roofH - 0.6, z));
  for (const x of [-1.1, 0, 1.1]) frame.push(new THREE.BoxGeometry(0.08, 0.08, hd * 2).translate(x, roofH - 0.6, 0));
  frame.push(new THREE.BoxGeometry(3.9, 0.1, hd * 2 + 0.2).translate(0, roofH, 0));
  for (const z of [-hd, hd]) {
    glass.push(quad(V(-hw, wallH, z), V(hw, wallH, z), V(1.7, bandY, z), V(-1.7, bandY, z)));
    for (const x of [-hw * 0.55, hw * 0.55]) beam(V(x, wallH, z), V(x, wallH + (bandY - wallH) * (hw - Math.abs(x)) / (hw - 1.7), z), T, frame);
    frame.push(new THREE.BoxGeometry(3.6, 0.6, 0.12).translate(0, roofH - 0.25, z));
  }

  // carved white brackets where the columns meet the roof
  const brackets = [];
  for (const c of columnsAt) {
    const b = new THREE.PlaneGeometry(1.2, 1.0);
    b.translate(0.6, -0.5, 0);
    const inward = c.x > 0 ? -1 : 1;
    b.scale(inward, 1, 1);
    b.translate(c.x + inward * 0.08, wallH, c.z);
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

  // --- floor: polished cream marble ---
  const floorTex = marbleFloorTexture();
  floorTex.repeat.set(hw * 2 / 3.2, hd * 2 / 3.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: floorTex, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.55 }));
  floor.position.y = 0.012;
  floor.receiveShadow = true;
  group.add(floor);

  /* ---------- the elevated floor (mezzanine) ---------- */
  const mz0 = -hd, mz1 = mezzZ, mzc = (mz0 + mz1) / 2, mzd = mz1 - mz0;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.3, mzd).translate(0, mezzY - 0.15, mzc), white);
  slab.castShadow = true;
  group.add(slab);
  const upTex = marbleFloorTexture();
  upTex.repeat.set(hw * 2 / 3.2, mzd / 3.2);
  const upFloor = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, mzd).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: upTex, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.55 }));
  upFloor.position.set(0, mezzY + 0.006, mzc);
  upFloor.receiveShadow = true;
  group.add(upFloor);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.03, 0.02).translate(0, mezzY - 0.08, mz1 + 0.012), brass));

  // the front face under it: carved white screen (west), marble + the powder-room door (east)
  const P = G.powder;
  const under = mezzY - 0.3;
  const marblePanel = new THREE.MeshPhysicalMaterial({ map: marbleTexture(512), color: '#f2ede4', roughness: 0.25, clearcoat: 0.5 });
  const face = [];
  face.push(new THREE.BoxGeometry(hw - stairHW - 0.1, under, 0.14).translate(-(hw + stairHW + 0.1) / 2, under / 2, mz1));
  face.push(new THREE.BoxGeometry(P.door0 - stairHW - 0.1, under, 0.14).translate((P.door0 + stairHW + 0.1) / 2, under / 2, mz1));
  face.push(new THREE.BoxGeometry(hw - P.door1, under, 0.14).translate((hw + P.door1) / 2, under / 2, mz1));
  face.push(new THREE.BoxGeometry(P.door1 - P.door0, under - 2.1, 0.14).translate((P.door0 + P.door1) / 2, 2.1 + (under - 2.1) / 2, mz1));
  const faceMesh = new THREE.Mesh(merge(face), marblePanel);
  faceMesh.castShadow = true;
  group.add(faceMesh);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(hw - stairHW - 0.6, under - 0.5), new THREE.MeshStandardMaterial({ map: screenTex, alphaTest: 0.5, side: THREE.DoubleSide }));
  screen.position.set(-(hw + stairHW + 0.1) / 2, under / 2, mz1 + 0.09);
  group.add(screen);
  // carved teak doorway into the powder room
  const teak = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.5 });
  const dframe = [];
  dframe.push(new THREE.BoxGeometry(0.12, 2.15, 0.22).translate(P.door0 - 0.06, 1.075, mz1));
  dframe.push(new THREE.BoxGeometry(0.12, 2.15, 0.22).translate(P.door1 + 0.06, 1.075, mz1));
  dframe.push(new THREE.BoxGeometry(P.door1 - P.door0 + 0.36, 0.1, 0.24).translate((P.door0 + P.door1) / 2, 2.15, mz1));
  group.add(new THREE.Mesh(merge(dframe), teak));
  const doorLeaf = new THREE.Group();
  doorLeaf.position.set(P.door1, 0, mz1);
  doorLeaf.rotation.y = 1.25; // swung open into the room
  doorLeaf.add(new THREE.Mesh(new THREE.BoxGeometry(P.door1 - P.door0 - 0.04, 2.08, 0.05).translate(-(P.door1 - P.door0) / 2, 1.04, -0.03), teak));
  for (const y of [0.55, 1.5]) {
    doorLeaf.add(new THREE.Mesh(new THREE.BoxGeometry(P.door1 - P.door0 - 0.24, 0.7, 0.012).translate(-(P.door1 - P.door0) / 2, y, -0.003), new THREE.MeshStandardMaterial({ color: '#5a361e', roughness: 0.5 })));
  }
  group.add(doorLeaf);

  // railing along the mezzanine edge (white balusters, brass caps)
  const balusters = [], rails = [], caps = [];
  const railRun = (ax, az, bx, bz, y) => {
    const len = Math.hypot(bx - ax, bz - az);
    beam(V(ax, y + 1.0, az), V(bx, y + 1.0, bz), 0.08, rails);
    beam(V(ax, y + 0.08, az), V(bx, y + 0.08, bz), 0.06, rails);
    const n = Math.round(len / 0.14);
    for (let i = 1; i < n; i++) { const t = i / n; balusters.push(V(ax + (bx - ax) * t, y + 0.54, az + (bz - az) * t)); }
    const np = Math.max(1, Math.round(len / 1.5));
    for (let i = 0; i <= np; i++) {
      const t = i / np, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      rails.push(new THREE.BoxGeometry(0.11, 1.0, 0.11).translate(x, y + 0.5, z));
      caps.push(V(x, y + 1.08, z));
    }
  };
  railRun(-hw + 0.08, mz1 + 0.06, -stairHW - 0.08, mz1 + 0.06, mezzY);
  railRun(stairHW + 0.08, mz1 + 0.06, hw - 0.08, mz1 + 0.06, mezzY);

  /* ---------- the marble staircase ---------- */
  const nSteps = 14;
  const riseS = mezzY / nSteps, tread = (stairZ - mezzZ) / nSteps;
  const stairs = [], noses = [];
  for (let i = 0; i < nSteps; i++) {
    const zc = stairZ - (i + 0.5) * tread;
    const h = (i + 1) * riseS;
    stairs.push(new THREE.BoxGeometry(stairHW * 2, h, tread + 0.004).translate(0, h / 2, zc));
    noses.push(new THREE.BoxGeometry(stairHW * 2, 0.012, 0.02).translate(0, h + 0.003, zc + tread / 2 - 0.012));
  }
  const stairMesh = new THREE.Mesh(merge(stairs), new THREE.MeshPhysicalMaterial({ color: '#efe6d6', map: marbleTexture(512), roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
  stairMesh.castShadow = true;
  stairMesh.receiveShadow = true;
  group.add(stairMesh);
  group.add(new THREE.Mesh(merge(noses), brass));
  for (const s of [-1, 1]) {
    const x = s * (stairHW + 0.07);
    const sw = [];
    for (let i = 0; i < nSteps; i++) {
      const zc = stairZ - (i + 0.5) * tread, h = (i + 1) * riseS;
      sw.push(new THREE.BoxGeometry(0.14, h + 0.12, tread + 0.004).translate(x, (h + 0.12) / 2, zc));
    }
    group.add(new THREE.Mesh(merge(sw), white));
    beam(V(x, 1.12, stairZ - 0.1), V(x, mezzY + 1.0, mezzZ + 0.05), 0.08, rails);
    for (let i = 0; i < nSteps; i++) {
      for (const f of [0.25, 0.75]) balusters.push(V(x, (i + 1) * riseS + 0.56, stairZ - (i + f) * tread));
    }
    rails.push(new THREE.BoxGeometry(0.16, 1.15, 0.16).translate(x, 0.575, stairZ - 0.05));
    caps.push(V(x, 1.22, stairZ - 0.05));
  }
  const balMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.03, 0.88, 8), white, balusters.length);
  balusters.forEach((p, i) => balMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  balMesh.castShadow = true;
  group.add(balMesh);
  group.add(new THREE.Mesh(merge(rails), white));
  const capMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 12, 10), brass, caps.length);
  caps.forEach((p, i) => capMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  group.add(capMesh);
  // brass stanchions with a golden rope at the foot of the stairs
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#d8b04a', roughness: 0.55, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const sx = s * (stairHW + 0.75), sz = stairZ + 0.35;
    const st = [];
    st.push(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20).translate(sx, 0.02, sz));
    rod(V(sx, 0.02, sz), V(sx, 0.95, sz), 0.025, st);
    st.push(new THREE.SphereGeometry(0.05, 12, 10).translate(sx, 0.98, sz));
    group.add(new THREE.Mesh(merge(st), brass));
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const p = V(sx, 0.9, sz).lerp(V(s * (stairHW + 0.07), 0.95, stairZ - 0.05), t);
      p.y -= Math.sin(Math.PI * t) * 0.18;
      pts.push(p);
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 6), ropeMat));
  }

  /* ---------- the powder room under the elevated floor ---------- */
  const pw = [];
  pw.push(new THREE.BoxGeometry(0.12, under, mzd).translate(P.x0, under / 2, mzc));
  pw.push(new THREE.BoxGeometry(hw - P.x0, under, 0.1).translate((P.x0 + hw) / 2, under / 2, mz0 + 0.12));
  pw.push(new THREE.BoxGeometry(0.1, under, mzd).translate(hw - 0.12, under / 2, mzc));
  const pwMesh = new THREE.Mesh(merge(pw), marblePanel);
  pwMesh.castShadow = true;
  pwMesh.receiveShadow = true;
  group.add(pwMesh);
  const pcx = (P.x0 + hw) / 2;
  const vanity = new THREE.Group();
  vanity.position.set(pcx, 0, mz0 + 0.42);
  vanity.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.36, 0.5).translate(0, 0.62, 0), teak));
  vanity.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.56).translate(0, 0.825, 0), marblePanel));
  const basin = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.12, 0], [0.19, 0.05], [0.21, 0.13], [0.2, 0.13], [0.18, 0.06], [0.11, 0.015], [0, 0.015]].map(([r, y]) => new THREE.Vector2(r, y)), 32),
    new THREE.MeshPhysicalMaterial({ color: '#fbfaf7', roughness: 0.12, clearcoat: 1, side: THREE.DoubleSide }));
  basin.position.set(0, 0.85, 0.02);
  vanity.add(basin);
  const tap = [];
  rod(V(0, 0.85, -0.2), V(0, 1.12, -0.2), 0.014, tap);
  rod(V(0, 1.12, -0.2), V(0, 1.1, -0.06), 0.012, tap);
  vanity.add(new THREE.Mesh(merge(tap), brass));
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.36, 40), new THREE.MeshStandardMaterial({ color: '#b9c3c8', roughness: 0.04, metalness: 0.95 }));
  mirror.position.set(0, 1.55, -0.2);
  vanity.add(mirror);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.018, 8, 48), new THREE.MeshStandardMaterial({ color: '#ffe7c0', emissive: '#ffc070', emissiveIntensity: 2.2 }));
  halo.position.set(0, 1.55, -0.205);
  vanity.add(halo);
  for (const s of [-1, 1]) {
    const sc = sconce();
    sc.position.set(s * 0.62, 1.5, -0.22);
    vanity.add(sc);
  }
  const towels = [];
  for (let i = 0; i < 3; i++) towels.push(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 14).rotateZ(Math.PI / 2).translate(0.55, 0.9 + (i === 2 ? 0.07 : 0), i === 2 ? -0.05 : -0.09 + i * 0.09));
  vanity.add(new THREE.Mesh(merge(towels), new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.95 })));
  vanity.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.22).translate(0.55, 0.86, -0.05), cane));
  const po = orchid(rng, 1.0);
  po.position.set(-0.6, 0.85, -0.08);
  vanity.add(po);
  group.add(vanity);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.65), new THREE.MeshStandardMaterial({ map: batikTexture('#5a2a1a', '#e7c78a'), roughness: 0.9 }));
  art.position.set(hw - 0.18, 1.5, mzc + 0.6);
  art.rotation.y = -Math.PI / 2;
  group.add(art);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.73, 0.98).translate(hw - 0.16, 1.5, mzc + 0.6), brass));
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24).translate(pcx, under - 0.02, mzc), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffc87a', emissiveIntensity: 0.55 })));
  const powderLight = new THREE.PointLight('#ffcf8a', 2.6, 5.5, 2);
  powderLight.position.set(pcx, under - 0.25, mzc);
  group.add(powderLight);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 20), new THREE.MeshStandardMaterial({ map: batik, roughness: 0.85 }));
  stool.position.set(P.x0 + 0.5, 0.21, mz1 - 0.7);
  group.add(stool);

  /* ---------- upstairs: her desk, a reading corner, a credenza ---------- */
  const deskZ = mz0 + 1.6;
  const d = desk(rng, cane, batik);
  d.group.position.set(0, mezzY, deskZ);
  group.add(d.group);
  const rugTex = batikTexture('#22305a', '#e8dcc2');
  rugTex.repeat.set(3, 2.2);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 }));
  rug.position.set(0, mezzY + 0.015, deskZ + 0.4);
  group.add(rug);
  const lounge = new THREE.Group();
  lounge.position.set(3.9, mezzY, mz0 + 2.2);
  lounge.rotation.y = -0.6;
  const lf = [];
  lf.push(new THREE.BoxGeometry(0.8, 0.12, 0.75).translate(0, 0.38, 0));
  for (const s of [-1, 1]) lf.push(new THREE.BoxGeometry(0.08, 0.3, 0.75).translate(s * 0.4, 0.55, 0));
  for (const [x, z] of [[-0.35, -0.32], [0.35, -0.32], [-0.35, 0.32], [0.35, 0.32]]) lf.push(new THREE.BoxGeometry(0.04, 0.32, 0.04).translate(x, 0.16, z));
  lounge.add(new THREE.Mesh(merge(lf), teak));
  const lc = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: '#e9dcc4', roughness: 0.9 }));
  lc.position.y = 0.5;
  lounge.add(lc);
  const lback = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.6), cane);
  lback.position.set(0, 0.78, 0.36); lback.rotation.x = -0.25;
  lounge.add(lback);
  const lpil = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), new THREE.MeshStandardMaterial({ map: batik, roughness: 0.9 }));
  lpil.position.set(0.1, 0.72, 0.25); lpil.rotation.x = -0.3;
  lounge.add(lpil);
  group.add(lounge);
  const sideT = new THREE.Group();
  sideT.position.set(4.9, mezzY, mz0 + 1.3);
  sideT.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 24).translate(0, 0.55, 0), new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.15, clearcoat: 0.8 })));
  sideT.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 10).translate(0, 0.275, 0), brass));
  const so = orchid(rng, 1.0, '#f3c8dc');
  so.position.y = 0.565;
  sideT.add(so);
  group.add(sideT);
  const fl = [];
  rod(V(0, 0, 0), V(0, 1.6, 0), 0.015, fl);
  rod(V(0, 1.6, 0), V(-0.35, 1.75, 0.1), 0.012, fl);
  fl.push(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 20).translate(0, 0.015, 0));
  const floorLamp = new THREE.Group();
  floorLamp.add(new THREE.Mesh(merge(fl), brass));
  const fls = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c9a25a', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: 0.25 }));
  fls.position.set(-0.36, 1.72, 0.1);
  floorLamp.add(fls);
  floorLamp.position.set(4.6, mezzY, mz0 + 2.9);
  group.add(floorLamp);
  const cred = new THREE.Group();
  cred.position.set(-4.9, mezzY, mz0 + 1.8);
  cred.rotation.y = Math.PI / 2;
  cred.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.45).translate(0, 0.45, 0), teak));
  for (const x of [-0.6, 0, 0.6]) {
    cred.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.01).translate(x, 0.45, 0.23), new THREE.MeshStandardMaterial({ color: '#5a361e', roughness: 0.5 })));
    cred.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.012).translate(x, 0.6, 0.24), brass));
  }
  for (const [x, h, c] of [[-0.6, 0.32, '#f2efe8'], [-0.35, 0.22, '#2b4a7a'], [0.5, 0.26, '#f2efe8']]) {
    const v = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.09, h * 0.4], [0.07, h * 0.85], [0.04, h], [0.045, h]].map(([r, y]) => new THREE.Vector2(r, y)), 20), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 0.8 }));
    v.position.set(x, 0.8, 0);
    cred.add(v);
  }
  group.add(cred);
  for (const s of [-1, 1]) {
    const p = palmFronds(rng, 1.0);
    p.position.set(s * (hw - 0.7), mezzY, mz0 + 0.7);
    group.add(p);
  }

  /* ---------- ground floor: café tables, plants, the jamu self-bar ---------- */
  const tables = [];
  const cafeSpots = [[3.6, 2.2], [3.7, 6.0], [-3.6, 1.9]];
  for (const [x, z] of cafeSpots) {
    const t = cafeSet(rng, cane, 3);
    t.position.set(x, 0, z);
    group.add(t);
    const o = orchid(rng, 0.9);
    o.position.set(x + 0.1, 0.77, z - 0.05);
    group.add(o);
    tables.push(V(x - 0.18, 0.77, z + 0.15));
  }
  for (const [x, z, sc] of [[-hw + 0.5, hd - 0.6, 1.1], [hw - 0.5, hd - 0.6, 1.0], [-doorHalf - 0.6, hd - 0.5, 0.9], [doorHalf + 0.6, hd - 0.5, 0.95],
    [hw - 0.45, 0.2, 0.9], [-hw + 0.45, -0.9, 1.0], [hw - 0.45, -2.6, 0.85], [-stairHW - 0.65, stairZ + 1.0, 0.8], [stairHW + 0.65, stairZ + 1.0, 0.8]]) {
    const pl = sansevieria(rng, sc);
    pl.position.set(x, 0, z);
    group.add(pl);
  }
  for (const [x, z] of [[-hw + 0.9, hd - 1.6], [hw - 0.9, 4.2]]) {
    const p = palmFronds(rng, 1.25);
    p.position.set(x, 0, z);
    group.add(p);
  }
  const jamu = jamuGendong(rng, batikTexture('#6b2a1a', '#efd6a0'), bambooTexture());
  jamu.group.position.set(-hw + 0.55, 0, 6.0);
  group.add(jamu.group);

  /* ---------- light ---------- */
  const chand1 = chandelier(1.0);
  chand1.position.set(0, roofH - 2.15, 4.2);
  group.add(chand1);
  const chand2 = chandelier(0.8);
  chand2.position.set(0, roofH - 1.95, mzc + 0.6);
  group.add(chand2);
  for (const c of columnsAt) {
    const sc = sconce();
    const inward = c.x > 0 ? -1 : 1;
    sc.position.set(c.x + inward * 0.1, 2.3, c.z);
    sc.rotation.y = inward > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(sc);
  }
  const light = new THREE.PointLight('#ffc27a', 19, 17, 2);
  light.position.set(0, roofH - 2.6, 3.0);
  group.add(light);
  const lampLight = new THREE.PointLight('#ffcf8a', 0, 3.5, 2);
  lampLight.position.set(d.lampLocal.x, mezzY + d.lampLocal.y, deskZ + d.lampLocal.z);
  group.add(lampLight);

  group.updateMatrixWorld(true);
  const toWorld = (v) => v.clone().applyMatrix4(group.matrixWorld);
  const deskW = (v) => toWorld(V(v.x, v.y + mezzY, v.z + deskZ));
  const jamuW = (v) => toWorld(V(v.x - hw + 0.55, v.y, v.z + 6.0));

  /* ---------- colliders (world space, some only on one floor) ---------- */
  const W = (x, z) => [G.x + x, G.z + z];
  const seg = (a, b, r = 0.2, extra = {}) => ({ seg: [...W(a[0], a[1]), ...W(b[0], b[1])], r, ...extra });
  const LOW = { maxY: y0 + 1.2 }, HIGH = { minY: y0 + 1.2 };
  const colliders = [
    seg([hw, -hd], [hw, hd]), seg([-hw, -hd], [-hw, hd]), seg([-hw, -hd], [hw, -hd]),
    seg([hw, hd], [doorHalf, hd]), seg([-doorHalf, hd], [-hw, hd]),
    seg([-stairHW - 0.07, stairZ], [-stairHW - 0.07, mezzZ], 0.12), seg([stairHW + 0.07, stairZ], [stairHW + 0.07, mezzZ], 0.12),
    seg([-hw, mezzZ], [-stairHW, mezzZ], 0.16, LOW), seg([stairHW, mezzZ], [P.door0, mezzZ], 0.16, LOW), seg([P.door1, mezzZ], [hw, mezzZ], 0.16, LOW),
    seg([P.x0, -hd], [P.x0, mezzZ], 0.15, LOW),
    seg([pcx - 0.8, -hd + 0.42], [pcx + 0.8, -hd + 0.42], 0.3, LOW),
    seg([-hw, mezzZ + 0.06], [-stairHW - 0.05, mezzZ + 0.06], 0.14, HIGH), seg([stairHW + 0.05, mezzZ + 0.06], [hw, mezzZ + 0.06], 0.14, HIGH),
    seg([-0.75, deskZ], [0.75, deskZ], 0.42, HIGH),
    { x: G.x + 3.9, z: G.z + mz0 + 2.2, r: 0.5, ...HIGH }, { x: G.x + 4.9, z: G.z + mz0 + 1.3, r: 0.28, ...HIGH },
    seg([-4.9, mz0 + 0.9], [-4.9, mz0 + 2.7], 0.3, HIGH),
    { x: G.x - hw + 0.7, z: G.z + mz0 + 0.7, r: 0.4, ...HIGH }, { x: G.x + hw - 0.7, z: G.z + mz0 + 0.7, r: 0.4, ...HIGH },
    ...cafeSpots.map(([x, z]) => ({ x: G.x + x, z: G.z + z, r: 0.85, ...LOW })),
    seg([-hw + 0.55, 4.9], [-hw + 0.55, 7.1], 0.38, LOW),
    { x: G.x - hw + 0.9, z: G.z + hd - 1.6, r: 0.45, ...LOW }, { x: G.x + hw - 0.9, z: G.z + 4.2, r: 0.45, ...LOW },
    { x: G.x - stairHW - 0.75, z: G.z + stairZ + 0.35, r: 0.18 }, { x: G.x + stairHW + 0.75, z: G.z + stairZ + 0.35, r: 0.18 },
  ];

  let lampOn = 0.3, lampTarget = 0.3;
  const flowerMats = [];
  d.flower.traverse((o) => { if (o.isMesh && o.material.emissive) flowerMats.push({ m: o.material, base: o.material.emissiveIntensity }); });

  return {
    group, light, colliders,
    lampLight,
    tables: [...tables.map(toWorld), deskW(d.deskTop)],
    deskTop: deskW(d.deskTop),
    journal: { center: deskW(d.journalLocal), radius: 0.32 },
    interacts: [
      { center: deskW(d.flowerLocal), radius: 0.26, label: 'click to look closer', message: itemMessages.flower },
      { center: deskW(d.mugLocal), radius: 0.18, label: 'click to look closer', message: itemMessages.mug },
    ],
    jamu: jamu.bottles.map((b) => ({ center: jamuW(b.local), radius: 0.12, label: `jamu · ${b.kind}`, food: 'jamu', flavor: b.kind })),
    /** chapter 3 done: the desk lamp warms up and the rose glows */
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
