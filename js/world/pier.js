/* The pier, five-star Javanese-modern: an oiled teak deck edged in cream paras
   stone, on dark ironwood (ulin) piles; slim teak rails with bronze kawung
   lattice panels; bronze lantern posts casting warm pools; festoon lights
   strung across the promenade; and at the end of the walk a modern pendopo
   (teak columns on stone umpak bases, layered sirap roof, a tumpang-sari
   ceiling) where the bench and the letter wait. A varnished teak rowboat is
   tied up by the ladder. The food stalls live in stalls.js. */

import * as THREE from 'three';
import { mulberry32, glowTexture } from './util.js';
import { PIER } from './layout.js';
import { merge, paint } from './props.js';
import { V, beam, rod, kawungPanelTexture, sirapTexture, shadowAll } from './build.js';

/* ---------------- the rowboat ---------------- */

function rowboat() {
  const g = new THREE.Group();
  const L = 3.3, NU = 26, NV = 14;
  const pos = [], col = [], idx = [];
  const teak = new THREE.Color('#8a5530'), cream = new THREE.Color('#efe6d2'), wood = new THREE.Color('#6e4224');
  const w = (u) => {
    const k = (u + 1) / 2;
    return 0.6 * Math.pow(Math.sin(Math.PI * Math.min(k * 0.92 + 0.12, 1)), 0.75) * (u > 0 ? 1 - Math.pow(u, 3) * 0.55 : 1);
  };
  const sheer = (u) => 0.38 + u * u * 0.12 + (u > 0 ? u * 0.06 : 0);
  const depth = (u) => 0.36 * (1 - Math.pow(Math.abs(u), 3) * 0.6);
  for (let i = 0; i <= NU; i++) {
    const u = -1 + (i / NU) * 2;
    for (let j = 0; j <= NV; j++) {
      const v = -1 + (j / NV) * 2;
      pos.push(w(u) * Math.sin((v * Math.PI) / 2), sheer(u) - depth(u) * Math.pow(Math.cos((v * Math.PI) / 2), 0.7), -u * L / 2);
      const c = Math.abs(v) > 0.8 && Math.abs(v) < 0.88 ? cream : teak;
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hull.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  hull.setIndex(idx);
  hull.computeVertexNormals();
  g.add(new THREE.Mesh(hull, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.7, side: THREE.DoubleSide })));
  const woodMat = new THREE.MeshStandardMaterial({ color: wood, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= NU; i++) { const u = -1 + (i / NU) * 2; pts.push(V(s * w(u), sheer(u) + 0.01, -u * L / 2)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 5), woodMat));
  }
  const parts = [];
  parts.push(new THREE.BoxGeometry(w(-0.98) * 2, 0.3, 0.04).translate(0, sheer(-1) - 0.17, L / 2 - 0.02));
  for (const u of [-0.55, 0.05, 0.55]) parts.push(new THREE.BoxGeometry(w(u) * 1.9, 0.04, 0.22).translate(0, sheer(u) - 0.12, -u * L / 2));
  parts.push(new THREE.BoxGeometry(0.5, 0.02, L * 0.7).translate(0, 0.06, 0.1));
  g.add(new THREE.Mesh(merge(parts), woodMat));
  // a batik cushion on the rowing seat
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: '#2a3d6a', roughness: 0.9 }));
  cushion.position.set(0, sheer(0.05) - 0.07, -0.05 * L / 2);
  g.add(cushion);
  const oars = new THREE.Group();
  for (const s of [-1, 1]) {
    const oar = new THREE.Group();
    oar.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8).rotateX(Math.PI / 2), woodMat));
    oar.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.015, 0.45).translate(0, 0, -1.2), woodMat));
    oar.position.set(s * 0.28, sheer(0.05) + 0.02, 0.15);
    oar.rotation.y = s * 0.08;
    oars.add(oar);
  }
  g.add(oars);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.oars = oars;
  return g;
}

/* ---------------- the pier ---------------- */

export function createPier(hf) {
  const rng = mulberry32(61);
  const group = new THREE.Group();
  const Y = PIER.deckY;
  const X = PIER.x;
  const { prom, walk, pendopo } = PIER;
  const PZ = pendopo.z, PH = pendopo.half;
  const colliders = [];

  /* ---------- teak deck (vertex-tinted planks) ---------- */
  const planks = [];
  const tones = ['#7a4a28', '#875632', '#6e4224', '#82512e', '#8f5c36'];
  const plank = (x0, x1, z, w = 0.16) => {
    let x = x0;
    while (x < x1 - 0.05) {
      const len = Math.min(x1 - x, 2.0 + rng() * 1.6);
      const g = new THREE.BoxGeometry(len - 0.01, 0.06, w);
      g.translate(x + len / 2, Y - 0.03, z);
      const c = new THREE.Color(tones[Math.floor(rng() * tones.length)]).multiplyScalar(0.9 + rng() * 0.2);
      paint(g, '#' + c.getHexString());
      planks.push(g);
      x += len;
    }
  };
  const B = 0.55; // stone border width on the promenade
  for (let z = prom.z0 + B + 0.09; z < prom.z1 - B; z += 0.18) plank(prom.x0 + B, prom.x1 - B, z);
  for (let z = walk.z0 + 0.09; z < prom.z0; z += 0.18) plank(X - walk.hw, X + walk.hw, z);
  for (let z = PZ - PH + 0.45; z < PZ + PH - 0.35; z += 0.18) plank(X - PH + 0.35, X + PH - 0.35, z);
  const deck = new THREE.Mesh(merge(planks), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }));
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  /* ---------- cream paras stone: promenade border, pendopo plinth, fascias ---------- */
  const stone = [];
  const slab = (x0, x1, z0, z1, y = Y, t = 0.08) => stone.push(new THREE.BoxGeometry(x1 - x0, t, z1 - z0).translate((x0 + x1) / 2, y - t / 2 + 0.006, (z0 + z1) / 2));
  slab(prom.x0, prom.x1, prom.z0, prom.z0 + B); slab(prom.x0, prom.x1, prom.z1 - B, prom.z1);
  slab(prom.x0, prom.x0 + B, prom.z0 + B, prom.z1 - B); slab(prom.x1 - B, prom.x1, prom.z0 + B, prom.z1 - B);
  slab(X - PH, X + PH, PZ - PH, PZ - PH + 0.35); slab(X - PH, X + PH, PZ + PH - 0.35, PZ + PH);
  slab(X - PH, X - PH + 0.35, PZ - PH + 0.35, PZ + PH - 0.35); slab(X + PH - 0.35, X + PH, PZ - PH + 0.35, PZ + PH - 0.35);
  const fascia = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const g = new THREE.BoxGeometry(len, 0.32, 0.08);
    g.rotateY(Math.atan2(-(bz - az), bx - ax));
    g.translate((ax + bx) / 2, Y - 0.2, (az + bz) / 2);
    stone.push(g);
  };
  fascia(prom.x0, prom.z0, prom.x0, prom.z1); fascia(prom.x1, prom.z0, prom.x1, prom.z1); fascia(prom.x0, prom.z1, prom.x1, prom.z1);
  fascia(prom.x0, prom.z0, X - walk.hw, prom.z0); fascia(X + walk.hw, prom.z0, prom.x1, prom.z0);
  fascia(X - walk.hw, walk.z0, X - walk.hw, prom.z0); fascia(X + walk.hw, walk.z0, X + walk.hw, prom.z0);
  fascia(X - PH, PZ - PH, X + PH, PZ - PH); fascia(X - PH, PZ - PH, X - PH, PZ + PH); fascia(X + PH, PZ - PH, X + PH, PZ + PH);
  fascia(X - PH, PZ + PH, X - walk.hw, PZ + PH); fascia(X + walk.hw, PZ + PH, X + PH, PZ + PH);
  const stoneMesh = new THREE.Mesh(merge(stone), new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.8 }));
  stoneMesh.receiveShadow = true;
  stoneMesh.castShadow = true;
  group.add(stoneMesh);

  /* ---------- ironwood piles ---------- */
  const piles = [];
  const pile = (x, z) => {
    const bottom = Math.min(hf.sample(x, z), 0) - 0.4;
    rod(V(x, bottom, z), V(x, Y - 0.08, z), 0.11, piles, 10);
  };
  for (let x = prom.x0 + 0.35; x <= prom.x1 - 0.2; x += 2.6) for (let z = prom.z0 + 0.35; z <= prom.z1 - 0.2; z += 2.6) pile(x, z);
  for (let z = walk.z0 + 0.4; z < prom.z0; z += 2.4) { pile(X - walk.hw + 0.12, z); pile(X + walk.hw - 0.12, z); }
  for (const dx of [-PH + 0.3, 0, PH - 0.3]) for (const dz of [-PH + 0.3, 0, PH - 0.3]) pile(X + dx, PZ + dz);
  const pileMesh = new THREE.Mesh(merge(piles), new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.8 }));
  pileMesh.castShadow = true;
  group.add(pileMesh);

  /* ---------- railings: teak rails, bronze kawung panels ---------- */
  const teakMat = new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: 0.45 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.35, metalness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  const panelMat = new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
  const rails = [], posts = [], panels = [], caps = [];
  const railRun = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(-(bz - az), bx - ax);
    const hr = new THREE.BoxGeometry(len, 0.06, 0.12); hr.rotateY(yaw); hr.translate((ax + bx) / 2, Y + 1.0, (az + bz) / 2);
    rails.push(hr);
    const n = Math.max(1, Math.round(len / 1.8));
    for (let i = 0; i <= n; i++) {
      const x = ax + (bx - ax) * (i / n), z = az + (bz - az) * (i / n);
      posts.push(new THREE.BoxGeometry(0.1, 0.98, 0.1).translate(x, Y + 0.49, z));
      caps.push(new THREE.BoxGeometry(0.13, 0.025, 0.13).translate(x, Y + 1.04, z));
      colliders.push({ x, z, r: 0.12 });
      if (i < n) {
        const x2 = ax + (bx - ax) * ((i + 1) / n), z2 = az + (bz - az) * ((i + 1) / n);
        const seg = Math.hypot(x2 - x, z2 - z) - 0.12;
        const p = new THREE.PlaneGeometry(seg, 0.78);
        p.rotateY(yaw);
        p.translate((x + x2) / 2, Y + 0.54, (z + z2) / 2);
        panels.push(p);
      }
    }
    beam(V(ax, Y + 0.12, az), V(bx, Y + 0.12, bz), 0.05, rails);
    colliders.push({ seg: [ax, az, bx, bz], r: 0.14 });
  };
  const e = 0.08;
  const W0 = X - walk.hw + e, W1 = X + walk.hw - e;
  railRun(prom.x0 + e, prom.z1 - 0.3, prom.x0 + e, prom.z0 + e);
  railRun(prom.x1 - e, prom.z0 + e, prom.x1 - e, prom.z1 - 0.3);
  railRun(prom.x0 + e, prom.z0 + e, W0, prom.z0 + e);
  railRun(W1, prom.z0 + e, prom.x1 - e, prom.z0 + e);
  const ladderZ = 4.0, gapH = 0.6;
  railRun(W0, prom.z0, W0, walk.z0 + 0.05);
  railRun(W1, prom.z0, W1, ladderZ + gapH);
  railRun(W1, ladderZ - gapH, W1, walk.z0 + 0.05);
  group.add(new THREE.Mesh(merge(rails), teakMat));
  group.add(new THREE.Mesh(merge(posts), teakMat));
  group.add(new THREE.Mesh(merge(caps), brass));
  group.add(new THREE.Mesh(merge(panels), panelMat));

  /* ---------- bronze lantern posts + warm pools ---------- */
  const glassMat = new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 2.2 });
  const poolMat = new THREE.MeshBasicMaterial({
    map: glowTexture(128, 1.6), color: new THREE.Color(0.55, 0.34, 0.15), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4,
  });
  const lampSpots = [
    [prom.x0 + 0.3, prom.z1 - 0.35], [prom.x1 - 0.3, prom.z1 - 0.35], [prom.x0 + 0.3, prom.z0 + 0.3], [prom.x1 - 0.3, prom.z0 + 0.3],
    [prom.x0 + 0.3, (prom.z0 + prom.z1) / 2], [prom.x1 - 0.3, (prom.z0 + prom.z1) / 2],
    [W0 + 0.1, 7.0], [W1 - 0.1, 8.6], [W0 + 0.1, 1.2], [W0 + 0.1, walk.z0 + 0.35], [W1 - 0.1, walk.z0 + 0.35],
  ];
  const lampParts = [], glows = [], lampTops = [];
  for (const [x, z] of lampSpots) {
    lampParts.push(new THREE.BoxGeometry(0.26, 0.12, 0.26).translate(x, Y + 0.06, z));
    lampParts.push(new THREE.BoxGeometry(0.09, 2.5, 0.09).translate(x, Y + 1.3, z));
    lampParts.push(new THREE.BoxGeometry(0.34, 0.04, 0.34).translate(x, Y + 2.56, z));
    lampParts.push(new THREE.BoxGeometry(0.4, 0.05, 0.4).translate(x, Y + 3.0, z));
    lampParts.push(new THREE.ConeGeometry(0.3, 0.2, 4).rotateY(Math.PI / 4).translate(x, Y + 3.12, z));
    for (const [dx, dz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) lampParts.push(new THREE.BoxGeometry(0.025, 0.42, 0.025).translate(x + dx, Y + 2.78, z + dz));
    glows.push(new THREE.BoxGeometry(0.24, 0.36, 0.24).translate(x, Y + 2.78, z));
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4).rotateX(-Math.PI / 2), poolMat);
    pool.position.set(x, Y + 0.008, z);
    pool.renderOrder = 1;
    group.add(pool);
    colliders.push({ x, z, r: 0.2 });
    lampTops.push(V(x, Y + 2.95, z));
  }
  const lampMesh = new THREE.Mesh(merge(lampParts), bronze);
  lampMesh.castShadow = true;
  group.add(lampMesh);
  group.add(new THREE.Mesh(merge(glows), glassMat));

  /* ---------- festoon lights across the promenade ---------- */
  const bulbs = [], wires = [];
  const festoon = (A, B) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const p = A.clone().lerp(B, t);
      p.y -= Math.sin(Math.PI * t) * 0.7;
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    wires.push(new THREE.TubeGeometry(curve, 48, 0.006, 3));
    const n = Math.floor(A.distanceTo(B) / 0.6);
    for (let i = 1; i < n; i++) bulbs.push(curve.getPoint(i / n).add(V(0, -0.05, 0)));
  };
  festoon(lampTops[0], lampTops[3]); festoon(lampTops[1], lampTops[2]);
  festoon(lampTops[0], lampTops[1]); festoon(lampTops[4], lampTops[5]); festoon(lampTops[2], lampTops[3]);
  group.add(new THREE.Mesh(merge(wires), new THREE.MeshStandardMaterial({ color: '#2a2420' })));
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffc070', emissiveIntensity: 3 }), bulbs.length);
  bulbs.forEach((p, i) => bulbMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  group.add(bulbMesh);

  /* ---------- ladder, bollards ---------- */
  const ladder = [];
  for (const dz of [-0.25, 0.25]) {
    rod(V(W1 + 0.14, Y + 0.95, ladderZ + dz), V(W1 + 0.14, Y - 0.05, ladderZ + dz), 0.022, ladder, 6);
    rod(V(W1 + 0.14, Y - 0.05, ladderZ + dz), V(W1 + 0.22, -1.2, ladderZ + dz), 0.022, ladder, 6);
  }
  for (let y = Y - 0.25; y > -1.0; y -= 0.3) rod(V(W1 + 0.18, y, ladderZ - 0.25), V(W1 + 0.18, y, ladderZ + 0.25), 0.016, ladder, 5);
  group.add(new THREE.Mesh(merge(ladder), brass));
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#cdb991', roughness: 0.9 });
  for (const dz of [-gapH - 0.2, gapH + 0.2]) {
    const bp = [];
    bp.push(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 12).translate(W1 - 0.18, Y + 0.21, ladderZ + dz));
    bp.push(new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(W1 - 0.18, Y + 0.42, ladderZ + dz));
    group.add(new THREE.Mesh(merge(bp), bronze));
    const wraps = [];
    for (let k = 0; k < 5; k++) wraps.push(new THREE.TorusGeometry(0.105, 0.018, 5, 14).rotateX(Math.PI / 2).translate(W1 - 0.18, Y + 0.16 + k * 0.035, ladderZ + dz));
    group.add(new THREE.Mesh(merge(wraps), ropeMat));
  }

  /* ---------- the rowboat ---------- */
  const boat = rowboat();
  boat.userData.keep = true;
  const boatHome = V(X + walk.hw + 1.05, 0.0, ladderZ + 0.2);
  boat.position.copy(boatHome);
  group.add(boat);
  const tie = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(W1 - 0.18, Y + 0.25, ladderZ + gapH + 0.2), V(W1 + 0.4, 0.35, ladderZ + 0.9), V(boatHome.x - 0.05, 0.5, boatHome.z - 1.4)]), 16, 0.012, 4), ropeMat);
  group.add(tie);

  /* ---------- the pendopo ---------- */
  const pen = new THREE.Group();
  group.add(pen);
  const umpakMat = new THREE.MeshStandardMaterial({ color: '#d9cfbd', roughness: 0.8 });
  const umpak = [], cols = [], beams = [];
  const colH = 2.7, innerH = 4.3;
  const outer = [];
  const o = PH - 0.4;
  for (const t of [-1, -1 / 3, 1 / 3, 1]) { outer.push([X + t * o, PZ - o], [X + t * o, PZ + o]); }
  for (const t of [-1 / 3, 1 / 3]) { outer.push([X - o, PZ + t * o], [X + o, PZ + t * o]); }
  for (const [x, z] of outer) {
    umpak.push(new THREE.CylinderGeometry(0.16, 0.24, 0.22, 4).rotateY(Math.PI / 4).translate(x, Y + 0.11, z));
    cols.push(new THREE.BoxGeometry(0.17, colH - 0.22, 0.17).translate(x, Y + 0.22 + (colH - 0.22) / 2, z));
    colliders.push({ x, z, r: 0.17 });
  }
  const inner = [[X - 1.6, PZ - 1.6], [X + 1.6, PZ - 1.6], [X - 1.6, PZ + 1.6], [X + 1.6, PZ + 1.6]];
  for (const [x, z] of inner) {
    umpak.push(new THREE.CylinderGeometry(0.2, 0.3, 0.26, 4).rotateY(Math.PI / 4).translate(x, Y + 0.13, z));
    cols.push(new THREE.BoxGeometry(0.24, innerH - 0.26, 0.24).translate(x, Y + 0.26 + (innerH - 0.26) / 2, z));
    colliders.push({ x, z, r: 0.2 });
  }
  // ring beams
  const ring = (r, y, t) => {
    beam(V(X - r, y, PZ - r), V(X + r, y, PZ - r), t, beams); beam(V(X - r, y, PZ + r), V(X + r, y, PZ + r), t, beams);
    beam(V(X - r, y, PZ - r), V(X - r, y, PZ + r), t, beams); beam(V(X + r, y, PZ - r), V(X + r, y, PZ + r), t, beams);
  };
  ring(o, Y + colH, 0.18);
  ring(1.6, Y + innerH, 0.22);
  for (const [x, z] of inner) beam(V(x, Y + colH, z), V(x + Math.sign(x - X) * (o - 1.6), Y + colH, z + Math.sign(z - PZ) * (o - 1.6)), 0.12, beams);
  // tumpang sari: stepped square frames rising inside the soko guru
  for (let k = 0; k < 4; k++) ring(1.6 - 0.18 * (k + 1), Y + innerH + 0.12 + k * 0.14, 0.14);
  pen.add(new THREE.Mesh(merge(umpak), umpakMat));
  const colMesh = new THREE.Mesh(merge(cols), teakMat);
  colMesh.castShadow = true;
  pen.add(colMesh);
  pen.add(new THREE.Mesh(merge(beams), teakMat));
  // low balustrade between the outer columns (open on the walk side)
  const bal = [];
  const balRun = (ax, az, bx, bz) => {
    beam(V(ax, Y + 0.62, az), V(bx, Y + 0.62, bz), 0.09, bal);
    beam(V(ax, Y + 0.1, az), V(bx, Y + 0.1, bz), 0.06, bal);
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.2);
    for (let i = 1; i < n; i++) { const t = i / n; bal.push(new THREE.BoxGeometry(0.04, 0.52, 0.04).translate(ax + (bx - ax) * t, Y + 0.36, az + (bz - az) * t)); }
    colliders.push({ seg: [ax, az, bx, bz], r: 0.12 });
  };
  balRun(X - o, PZ - o, X + o, PZ - o);
  balRun(X - o, PZ - o, X - o, PZ + o);
  balRun(X + o, PZ - o, X + o, PZ + o);
  balRun(X - o, PZ + o, X - walk.hw, PZ + o);
  balRun(X + walk.hw, PZ + o, X + o, PZ + o);
  pen.add(new THREE.Mesh(merge(bal), teakMat));
  // roofs: a broad hipped lower roof, a short open band, then a steep upper pyramid
  const sirap = sirapTexture();
  const roofMat = new THREE.MeshStandardMaterial({ map: sirap, roughness: 0.85, side: THREE.DoubleSide });
  const hipped = (rOut, yOut, rIn, yIn) => {
    const g = [];
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) {
      const [ax, az] = c[k], [bx, bz] = c[(k + 1) % 4];
      const pts = [V(X + ax * rOut, yOut, PZ + az * rOut), V(X + bx * rOut, yOut, PZ + bz * rOut), V(X + bx * rIn, yIn, PZ + bz * rIn), V(X + ax * rIn, yIn, PZ + az * rIn)];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([...pts[0].toArray(), ...pts[1].toArray(), ...pts[2].toArray(), ...pts[0].toArray(), ...pts[2].toArray(), ...pts[3].toArray()], 3));
      const L = rOut * 2, D = Math.hypot(rOut - rIn, yOut - yIn);
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L * 0.5 + rIn, D, 0, 0, L * 0.5 + rIn, D, L * 0.5 - rIn, D].map((v) => v / 2), 2));
      geo.computeVertexNormals();
      g.push(geo);
    }
    return g;
  };
  const roofParts = [...hipped(PH + 0.6, Y + colH - 0.05, 1.85, Y + innerH - 0.05), ...hipped(2.0, Y + innerH + 0.45, 0.05, Y + innerH + 2.3)];
  const roof = new THREE.Mesh(merge(roofParts), roofMat);
  roof.castShadow = true;
  pen.add(roof);
  // the short vertical band between the roofs, and hip ridges
  const ridges = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    beam(V(X + sx * (PH + 0.6), Y + colH - 0.02, PZ + sz * (PH + 0.6)), V(X + sx * 1.85, Y + innerH, PZ + sz * 1.85), 0.08, ridges);
    beam(V(X + sx * 2.0, Y + innerH + 0.48, PZ + sz * 2.0), V(X, Y + innerH + 2.3, PZ), 0.07, ridges);
  }
  ring(1.85, Y + innerH + 0.2, 0.1);
  pen.add(new THREE.Mesh(merge(ridges), new THREE.MeshStandardMaterial({ color: '#1f1a16', roughness: 0.7 })));
  // mustaka (crown ornament) at the top
  const must = [];
  must.push(new THREE.CylinderGeometry(0.12, 0.18, 0.18, 8).translate(X, Y + innerH + 2.36, PZ));
  must.push(new THREE.SphereGeometry(0.12, 12, 8).translate(X, Y + innerH + 2.55, PZ));
  must.push(new THREE.ConeGeometry(0.05, 0.4, 8).translate(X, Y + innerH + 2.85, PZ));
  pen.add(new THREE.Mesh(merge(must), brass));
  // brass lantern hanging from the centre
  const hang = new THREE.Group();
  hang.userData.keep = true;
  hang.position.set(X, Y + 2.8, PZ);
  hang.add(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.7, 4).translate(0, 1.0, 0), brass));
  const hl = [];
  hl.push(new THREE.ConeGeometry(0.2, 0.16, 8).translate(0, 0.12, 0));
  hl.push(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 8).translate(0, -0.3, 0));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; hl.push(new THREE.BoxGeometry(0.012, 0.38, 0.012).translate(Math.cos(a) * 0.14, -0.1, Math.sin(a) * 0.14)); }
  hang.add(new THREE.Mesh(merge(hl), brass));
  hang.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.34, 8).translate(0, -0.1, 0), glassMat));
  pen.add(hang);
  const pPool = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), poolMat);
  pPool.position.set(X, Y + 0.008, PZ);
  pPool.renderOrder = 1;
  pen.add(pPool);
  // two big planters at the entrance with frangipani-like blooms
  for (const s of [-1, 1]) {
    const pl = new THREE.Group();
    pl.position.set(X + s * (walk.hw + 0.55), Y, PZ + PH - 0.3);
    pl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.6, 20).translate(0, 0.3, 0), new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.7 })));
    const leaves = [];
    for (let i = 0; i < 14; i++) {
      const a = rng() * 6.28;
      const lf = new THREE.SphereGeometry(0.16, 8, 6).scale(1.6, 0.25, 0.6).rotateY(a).translate(Math.cos(a) * 0.2, 0.75 + rng() * 0.35, Math.sin(a) * 0.2);
      leaves.push(lf);
    }
    pl.add(new THREE.Mesh(merge(leaves), new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.6 })));
    const fl = [];
    for (let i = 0; i < 12; i++) fl.push(new THREE.SphereGeometry(0.045, 8, 6).scale(1, 0.4, 1).translate((rng() - 0.5) * 0.5, 0.95 + rng() * 0.25, (rng() - 0.5) * 0.5));
    pl.add(new THREE.Mesh(merge(fl), new THREE.MeshStandardMaterial({ color: '#fbf1dc', emissive: '#f6d8a0', emissiveIntensity: 0.2 })));
    group.add(pl);
    colliders.push({ x: pl.position.x, z: pl.position.z, r: 0.35 });
  }
  shadowAll(pen, true, true);

  return {
    group, colliders,
    boat, boatHome, ladder: V(W1 - 0.3, Y, ladderZ),
    update(t) {
      if (!boat.userData.riding) {
        boat.position.y = boatHome.y + Math.sin(t * 1.1) * 0.025;
        boat.rotation.z = Math.sin(t * 0.9) * 0.025;
        boat.rotation.x = Math.sin(t * 0.7 + 1) * 0.015;
      }
      hang.rotation.y = Math.sin(t * 0.4) * 0.05;
    },
  };
}
