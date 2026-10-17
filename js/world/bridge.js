/* The stone bridge over the river: dark volcanic andesite like the old candi
   temples, but with clean modern lines. An arched span with spandrel walls,
   carved kawung panels, low parapets with coping stones, tiered posts with
   warm brass lanterns, and paving slabs underfoot. */

import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { BRIDGE, bridgeDeckY } from './layout.js';
import { merge } from './props.js';

function ashlarTexture() {
  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#3c3b38'; g.fillRect(0, 0, W, H);
  const rng = mulberry32(12);
  const rowH = 32;
  for (let y = 0, r = 0; y < H; y += rowH, r++) {
    let x = r % 2 ? -30 : 0;
    while (x < W) {
      const w = 60 + rng() * 60;
      const v = 78 + Math.floor(rng() * 26);
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.fillRect(x + 2, y + 2, w - 4, rowH - 4);
      // pitted volcanic surface
      for (let k = 0; k < 40; k++) {
        g.fillStyle = `rgba(0,0,0,${0.12 + rng() * 0.18})`;
        g.fillRect(x + rng() * w, y + rng() * rowH, 1 + rng() * 2, 1 + rng() * 2);
      }
      x += w;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function kawungTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#4a4844'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#5d5a55';
  const n = 4, cell = S / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
      // four petal-ovals around a centre: the kawung (palm fruit) motif
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        g.beginPath();
        g.ellipse(cx + Math.cos(a) * cell * 0.24, cy + Math.sin(a) * cell * 0.24, cell * 0.2, cell * 0.11, a, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#3a3835';
      g.beginPath(); g.arc(cx, cy, cell * 0.05, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5d5a55';
    }
  }
  g.strokeStyle = '#2f2d2a'; g.lineWidth = 6; g.strokeRect(3, 3, S - 6, S - 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A vertical strip at lateral offset l between yTop(s) and yBot(s), in the bridge's local frame. */
function strip(s0, s1, n, l, yTop, yBot, faceOut) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + (s1 - s0) * (i / n);
    const t = yTop(s), b = yBot(s);
    pos.push(s, t, l, s, b, l);
    uv.push(s / 2, t / 1, s / 2, b / 1);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    if (faceOut) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A horizontal-ish surface across the width (l0..l1) following y(s). */
function sheet(s0, s1, n, l0, l1, y, up) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + (s1 - s0) * (i / n);
    pos.push(s, y(s), l0, s, y(s), l1);
    uv.push(s / 1.5, l0 / 1.5, s / 1.5, l1 / 1.5);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    if (up) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createBridge() {
  const B = BRIDGE;
  const group = new THREE.Group();
  group.position.set(B.x, 0, B.z);
  group.rotation.y = Math.atan2(-B.uz, B.ux); // local +x runs along the span, +z across
  const L = B.len / 2, hw = B.hw;
  const N = 40;
  const deck = (s) => bridgeDeckY(s);
  const span = 6.4;               // half width of the arch opening at the springline
  const apex = deck(0) - 0.75;
  const arch = (s) => (Math.abs(s) < span ? -0.9 + (apex + 0.9) * Math.sqrt(1 - (s / span) ** 2) : -0.9);
  const under = (s) => Math.min(arch(s), deck(s) - 0.55);

  const stone = new THREE.MeshStandardMaterial({ map: ashlarTexture(), roughness: 0.95, color: '#c9c4bb' });
  const paving = new THREE.MeshStandardMaterial({ map: ashlarTexture(), roughness: 0.9, color: '#b3aea6' });
  paving.map.repeat.set(1, 1);
  const carved = new THREE.MeshStandardMaterial({ map: kawungTexture(), roughness: 0.9 });

  const body = [];
  const W = hw + 0.18; // outer face, under the parapets
  for (const side of [-1, 1]) body.push(strip(-L, L, N, side * W, (s) => deck(s) - 0.02, under, side > 0));
  body.push(sheet(-L, L, N, -W, W, under, false)); // the soffit under the arch
  const bodyMesh = new THREE.Mesh(merge(body), stone);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);
  const top = new THREE.Mesh(sheet(-L - 0.6, L + 0.6, N, -hw, hw, (s) => (Math.abs(s) <= L ? deck(s) : deck(Math.sign(s) * L) - (Math.abs(s) - L) * 0.4) + 0.005, true), paving);
  top.receiveShadow = true;
  group.add(top);

  // parapets: inner + outer faces, top coping
  const par = [], cope = [];
  for (const side of [-1, 1]) {
    const li = side * hw, lo = side * (hw + 0.3);
    const pt = (s) => deck(s) + 0.55;
    par.push(strip(-L, L, N, li, pt, (s) => deck(s), side < 0));
    par.push(strip(-L, L, N, lo, pt, (s) => deck(s) - 0.02, side > 0));
    cope.push(sheet(-L, L, N, li - side * 0.04, lo + side * 0.04, (s) => pt(s) + 0.06, true));
    cope.push(strip(-L, L, N, li - side * 0.04, (s) => pt(s) + 0.06, pt, side < 0));
    cope.push(strip(-L, L, N, lo + side * 0.04, (s) => pt(s) + 0.06, pt, side > 0));
  }
  const parMesh = new THREE.Mesh(merge(par), stone);
  parMesh.castShadow = true;
  group.add(parMesh);
  group.add(new THREE.Mesh(merge(cope), new THREE.MeshStandardMaterial({ color: '#77736c', roughness: 0.85 })));

  // carved kawung panels on the spandrel walls, either side of the arch crown
  for (const side of [-1, 1]) {
    for (const s of [-3.4, 3.4]) {
      const y = (deck(s) + arch(s)) / 2 + 0.05;
      const h = Math.max(0.35, (deck(s) - arch(s)) * 0.55);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, h), carved);
      panel.position.set(s, y, side * (W + 0.012));
      panel.rotation.y = side > 0 ? 0 : Math.PI;
      group.add(panel);
    }
    // keystone
    const ks = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.06), new THREE.MeshStandardMaterial({ color: '#6c6862', roughness: 0.85 }));
    ks.position.set(0, apex + 0.12, side * (W + 0.03));
    group.add(ks);
  }

  // tiered posts with brass lanterns at the four corners, plain ones mid-span
  const postParts = [];
  const lampParts = [];
  const brass = new THREE.MeshStandardMaterial({ color: '#c49a4c', roughness: 0.35, metalness: 0.85 });
  const glow = new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffb45c', emissiveIntensity: 2.4 });
  const post = (s, side, lamp) => {
    const l = side * (hw + 0.15);
    const y = deck(s) - 0.05;
    postParts.push(new THREE.BoxGeometry(0.58, 1.05, 0.58).translate(s, y + 0.52, l));
    postParts.push(new THREE.BoxGeometry(0.7, 0.1, 0.7).translate(s, y + 1.08, l));
    postParts.push(new THREE.BoxGeometry(0.5, 0.12, 0.5).translate(s, y + 1.19, l));
    postParts.push(new THREE.BoxGeometry(0.36, 0.1, 0.36).translate(s, y + 1.3, l));
    if (lamp) {
      lampParts.push(new THREE.BoxGeometry(0.3, 0.04, 0.3).translate(s, y + 1.37, l));
      lampParts.push(new THREE.BoxGeometry(0.3, 0.04, 0.3).translate(s, y + 1.75, l));
      lampParts.push(new THREE.ConeGeometry(0.24, 0.16, 4).rotateY(Math.PI / 4).translate(s, y + 1.85, l));
      for (const [dx, dz] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) {
        lampParts.push(new THREE.BoxGeometry(0.03, 0.38, 0.03).translate(s + dx, y + 1.56, l + dz));
      }
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), glow);
      g.position.set(s, y + 1.56, l);
      group.add(g);
    } else {
      postParts.push(new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(s, y + 1.35, l));
    }
  };
  for (const side of [-1, 1]) {
    post(-L, side, true); post(L, side, true); post(0, side, false);
  }
  const posts = new THREE.Mesh(merge(postParts), stone);
  posts.castShadow = true;
  group.add(posts);
  group.add(new THREE.Mesh(merge(lampParts), brass));

  // stone steps easing onto the path at both ends
  const stepMat = new THREE.MeshStandardMaterial({ map: ashlarTexture(), color: '#a8a39b', roughness: 0.9 });
  for (const e of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const s = e * (L + 0.35 + k * 0.55);
      const y = deck(e * L) - 0.1 - k * 0.12;
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, hw * 2 + 0.4 - k * 0.2), stepMat);
      st.position.set(s, y, 0);
      st.receiveShadow = true;
      group.add(st);
    }
  }

  // colliders along the parapets (world space)
  group.updateMatrixWorld(true);
  const W2 = (s, l) => new THREE.Vector3(s, 0, l).applyMatrix4(group.matrixWorld);
  const colliders = [];
  for (const side of [-1, 1]) {
    const a = W2(-L - 0.2, side * (hw + 0.15)), b = W2(L + 0.2, side * (hw + 0.15));
    colliders.push({ seg: [a.x, a.z, b.x, b.z], r: 0.2 });
  }
  return { group, colliders };
}
