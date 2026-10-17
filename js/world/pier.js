/* The pier, planned on one axis: a teak boardwalk follows the south shore
   (benches facing the water, frangipani planters, lamps); a candi-bentar split
   gate of cream paras stone marks the arrival on the pier's axis; a central
   spine runs straight out over the water to the pendopo, which stands on a
   wraparound viewing deck; two symmetrical pods branch off the spine for
   Reva Maia's Nhà Việt (west) and the jamu bar (east) — stalls in stalls.js.
   Teak decks edged in paras stone on ironwood piles, teak rails with bronze
   kawung panels, bronze lanterns with warm pools, festoon lights. A varnished
   teak rowboat is tied up by the ladder. */

import * as THREE from 'three';
import { mulberry32, glowTexture } from './util.js';
import { PIER, LAKE, CART_BAYS, boardwalkAt } from './layout.js';
import { merge, paint } from './props.js';
import { V, beam, rod, canvasTex, kawungPanelTexture, sirapTexture, shadowAll } from './build.js';

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
  const { spine, podW, podE, pendopo, boardwalk: BW, gate, promenade: PRM } = PIER;
  const PZ = pendopo.z, PH = pendopo.half, PR = pendopo.roof;
  const colliders = [];

  const tones = ['#7a4a28', '#875632', '#6e4224', '#82512e', '#8f5c36'];
  const planks = [], stone = [], piles = [];
  const plankBox = (len, w, cx, cz, yaw) => {
    const g = new THREE.BoxGeometry(len - 0.01, 0.06, w);
    g.rotateY(yaw);
    g.translate(cx, Y - 0.03, cz);
    const c = new THREE.Color(tones[Math.floor(rng() * tones.length)]).multiplyScalar(0.9 + rng() * 0.2);
    paint(g, '#' + c.getHexString());
    planks.push(g);
  };
  /** Rectangular deck of planks running along x, rows along z. */
  const deckRect = (x0, x1, z0, z1, zFrom = z0 + 0.09) => {
    for (let z = zFrom; z < z1; z += 0.18) {
      let x = x0;
      while (x < x1 - 0.05) { const len = Math.min(x1 - x, 2 + rng() * 1.6); plankBox(len, 0.16, x + len / 2, z, 0); x += len; }
    }
  };
  const slab = (x0, x1, z0, z1, t = 0.08) => stone.push(new THREE.BoxGeometry(x1 - x0, t, z1 - z0).translate((x0 + x1) / 2, Y - t / 2 + 0.006, (z0 + z1) / 2));
  const fascia = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const g = new THREE.BoxGeometry(len, 0.32, 0.08);
    g.rotateY(Math.atan2(-(bz - az), bx - ax));
    g.translate((ax + bx) / 2, Y - 0.2, (az + bz) / 2);
    stone.push(g);
  };
  const pile = (x, z) => {
    const bottom = Math.min(hf.sample(x, z), 0) - 0.4;
    if (bottom > Y - 0.3) return;
    rod(V(x, bottom, z), V(x, Y - 0.08, z), 0.11, piles, 10);
  };

  /* ---------- the boardwalk along the shore ---------- */
  const R = LAKE.rz * BW.ld; // rough local radius, for spacing
  const nB = Math.ceil(((BW.th1 - BW.th0) * LAKE.rx * BW.ld) / 0.18);
  const bwInner = [], bwOuter = [];
  for (let i = 0; i <= nB; i++) {
    const th = BW.th0 + (BW.th1 - BW.th0) * (i / nB);
    const c = boardwalkAt(th);
    const o = boardwalkAt(th, BW.ld + BW.hw / LAKE.rz), n = boardwalkAt(th, BW.ld - BW.hw / LAKE.rz);
    bwInner.push(n); bwOuter.push(o);
    if (i < nB) {
      const yaw = Math.atan2(-(o.z - n.z), o.x - n.x);
      plankBox(Math.hypot(o.x - n.x, o.z - n.z), 0.16, c.x, c.z, yaw);
    }
  }
  const stride = (arr, step) => arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
  const edgeIn = stride(bwInner, 6), edgeOut = stride(bwOuter, 6);
  for (let i = 1; i < edgeIn.length; i++) {
    // stone kerb on both edges
    for (const [A, Bp] of [[edgeIn[i - 1], edgeIn[i]], [edgeOut[i - 1], edgeOut[i]]]) {
      const len = Math.hypot(Bp.x - A.x, Bp.z - A.z);
      const g = new THREE.BoxGeometry(len + 0.05, 0.12, 0.4);
      g.rotateY(Math.atan2(-(Bp.z - A.z), Bp.x - A.x));
      g.translate((A.x + Bp.x) / 2, Y + 0.0, (A.z + Bp.z) / 2);
      stone.push(g);
      fascia(A.x, A.z, Bp.x, Bp.z);
    }
    if (i % 2 === 0) pile(edgeIn[i].x, edgeIn[i].z);
  }

  /* ---------- the spine, the two pods, the pendopo deck ---------- */
  const B = 0.45; // stone border
  deckRect(X - spine.hw, X + spine.hw, spine.z0, spine.z1);
  // the promenade widens the spine on both sides; rows stay in step with the spine's
  const rowFrom = spine.z0 + 0.09 + Math.ceil((PRM.z0 - spine.z0) / 0.18) * 0.18;
  deckRect(X - PRM.hw, X - spine.hw, PRM.z0, PRM.z1, rowFrom);
  deckRect(X + spine.hw, X + PRM.hw, PRM.z0, PRM.z1, rowFrom);
  for (const s of [-1, 1]) {
    fascia(X + s * PRM.hw, PRM.z0, X + s * PRM.hw, PRM.z1);
    fascia(X + s * spine.hw, PRM.z0, X + s * PRM.hw, PRM.z0);
    for (let z = PRM.z0 + 0.4; z < PRM.z1; z += 2.4) pile(X + s * (PRM.hw - 0.15), z);
  }
  // inlaid paras-stone frames marking each cart bay
  for (const b of CART_BAYS) {
    const x0 = b.x - 0.95, x1 = b.x + 0.95, z0 = b.z - 2.15, z1 = b.z + 2.15, t = 0.12;
    for (const [a0, a1, c0, c1] of [[x0, x1, z0, z0 + t], [x0, x1, z1 - t, z1], [x0, x0 + t, z0, z1], [x1 - t, x1, z0, z1]]) slab(a0, a1, c0, c1, 0.02);
  }
  for (const pod of [podW, podE]) {
    // the side facing the walkway runs flush into it, so there's no border (or gap) there
    deckRect(pod === podW ? pod.x0 + B : pod.x0, pod === podW ? pod.x1 : pod.x1 - B, pod.z0 + B, pod.z1 - B);
    slab(pod.x0, pod.x1, pod.z0, pod.z0 + B); slab(pod.x0, pod.x1, pod.z1 - B, pod.z1);
    const outerX = pod === podW ? pod.x0 : pod.x1;
    slab(Math.min(outerX, outerX + (pod === podW ? B : -B)), Math.max(outerX, outerX + (pod === podW ? B : -B)), pod.z0 + B, pod.z1 - B);
    fascia(pod.x0, pod.z0, pod.x1, pod.z0); fascia(pod.x0, pod.z1, pod.x1, pod.z1); fascia(outerX, pod.z0, outerX, pod.z1);
    for (let x = pod.x0 + 0.4; x <= pod.x1 - 0.3; x += 2.6) for (let z = pod.z0 + 0.4; z <= pod.z1 - 0.3; z += 2.6) pile(x, z);
  }
  deckRect(X - PH + B, X + PH - B, PZ - PH + B, PZ + PH - B);
  slab(X - PH, X + PH, PZ - PH, PZ - PH + B); slab(X - PH, X - spine.hw, PZ + PH - B, PZ + PH); slab(X + spine.hw, X + PH, PZ + PH - B, PZ + PH);
  slab(X - PH, X - PH + B, PZ - PH + B, PZ + PH - B); slab(X + PH - B, X + PH, PZ - PH + B, PZ + PH - B);
  fascia(X - PH, PZ - PH, X + PH, PZ - PH); fascia(X - PH, PZ - PH, X - PH, PZ + PH); fascia(X + PH, PZ - PH, X + PH, PZ + PH);
  fascia(X - PH, PZ + PH, X - spine.hw, PZ + PH); fascia(X + spine.hw, PZ + PH, X + PH, PZ + PH);
  for (const s of [-1, 1]) {
    fascia(X + s * spine.hw, spine.z0, X + s * spine.hw, podW.z0);
    fascia(X + s * spine.hw, podW.z1, X + s * spine.hw, PRM.z0);
  }
  for (let z = spine.z0 + 0.4; z < spine.z1; z += 2.4) { pile(X - spine.hw + 0.15, z); pile(X + spine.hw - 0.15, z); }
  for (const dx of [-PH + 0.3, -1.8, 1.8, PH - 0.3]) for (const dz of [-PH + 0.3, 0, PH - 0.3]) pile(X + dx, PZ + dz);

  const deck = new THREE.Mesh(merge(planks), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }));
  deck.receiveShadow = true;
  group.add(deck);
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.8 });
  const stoneMesh = new THREE.Mesh(merge(stone), stoneMat);
  stoneMesh.receiveShadow = true; stoneMesh.castShadow = true;
  group.add(stoneMesh);
  const pileMesh = new THREE.Mesh(merge(piles), new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.8 }));
  group.add(pileMesh);

  /* ---------- railings: teak rails with bronze kawung panels ---------- */
  const teakMat = new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: 0.45 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.35, metalness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  const panelMat = new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
  const rails = [], posts = [], panels = [], caps = [];
  const railRun = (ax, az, bx, bz, collide = true) => {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.2) return;
    const yaw = Math.atan2(-(bz - az), bx - ax);
    const hr = new THREE.BoxGeometry(len, 0.06, 0.12); hr.rotateY(yaw); hr.translate((ax + bx) / 2, Y + 1.0, (az + bz) / 2);
    rails.push(hr);
    const n = Math.max(1, Math.round(len / 1.8));
    for (let i = 0; i <= n; i++) {
      const x = ax + (bx - ax) * (i / n), z = az + (bz - az) * (i / n);
      posts.push(new THREE.BoxGeometry(0.1, 0.98, 0.1).translate(x, Y + 0.49, z));
      caps.push(new THREE.BoxGeometry(0.13, 0.025, 0.13).translate(x, Y + 1.04, z));
      if (i < n) {
        const x2 = ax + (bx - ax) * ((i + 1) / n), z2 = az + (bz - az) * ((i + 1) / n);
        const p = new THREE.PlaneGeometry(Math.hypot(x2 - x, z2 - z) - 0.12, 0.78);
        p.rotateY(yaw); p.translate((x + x2) / 2, Y + 0.54, (z + z2) / 2);
        panels.push(p);
      }
    }
    beam(V(ax, Y + 0.12, az), V(bx, Y + 0.12, bz), 0.05, rails);
    if (collide) colliders.push({ seg: [ax, az, bx, bz], r: 0.14 });
  };
  const e = 0.08;
  // boardwalk: rails on the water side, open where the spine leaves
  const gateTh = Math.atan2((gate.z - LAKE.cz) / LAKE.rz, (X - LAKE.cx) / LAKE.rx);
  const gap = (PRM.hw + 0.1) / (LAKE.rx * BW.ld);
  const railEdge = stride(bwInner, 8);
  for (let i = 1; i < railEdge.length; i++) {
    const A = railEdge[i - 1], Bp = railEdge[i];
    const thA = Math.atan2((A.z - LAKE.cz) / LAKE.rz, (A.x - LAKE.cx) / LAKE.rx), thB = Math.atan2((Bp.z - LAKE.cz) / LAKE.rz, (Bp.x - LAKE.cx) / LAKE.rx);
    if (Math.min(thA, thB) < gateTh + gap && Math.max(thA, thB) > gateTh - gap) continue;
    railRun(A.x, A.z, Bp.x, Bp.z);
  }
  // spine rails between the pods and the shore, and between the pods and the pendopo
  const ladderZ = -10.2, gapH = 0.6;
  for (const s of [-1, 1]) {
    const x = X + s * (spine.hw - e);
    railRun(x, podW.z1, x, PRM.z0);
    // the promenade: rails along its sides and across its lake end
    railRun(X + s * (PRM.hw - e), PRM.z0 + e, X + s * (PRM.hw - e), PRM.z1 - 0.6);
    railRun(X + s * spine.hw, PRM.z0 + e, X + s * (PRM.hw - e), PRM.z0 + e);
    if (s > 0) { railRun(x, spine.z0, x, ladderZ - gapH); railRun(x, ladderZ + gapH, x, podW.z0); }
    else railRun(x, spine.z0, x, podW.z0);
  }
  // pods: rails on their three water sides
  for (const pod of [podW, podE]) {
    const out = pod === podW ? pod.x0 + e : pod.x1 - e, inn = pod === podW ? pod.x1 : pod.x0;
    railRun(inn, pod.z0 + e, out, pod.z0 + e); railRun(out, pod.z0 + e, out, pod.z1 - e); railRun(out, pod.z1 - e, inn, pod.z1 - e);
  }
  // pendopo deck edge
  railRun(X - PH + e, PZ - PH + e, X + PH - e, PZ - PH + e);
  railRun(X - PH + e, PZ - PH + e, X - PH + e, PZ + PH - e); railRun(X + PH - e, PZ - PH + e, X + PH - e, PZ + PH - e);
  railRun(X - PH + e, PZ + PH - e, X - spine.hw, PZ + PH - e); railRun(X + spine.hw, PZ + PH - e, X + PH - e, PZ + PH - e);
  group.add(new THREE.Mesh(merge(rails), teakMat));
  group.add(new THREE.Mesh(merge(posts), teakMat));
  group.add(new THREE.Mesh(merge(caps), brass));
  group.add(new THREE.Mesh(merge(panels), panelMat));

  /* ---------- the arrival gate: a candi-bentar split gate in paras stone ---------- */
  // two mirror-image towers, their inner faces cut sheer (the "split"), the outer faces stepping
  // back tier by tier, antefixes at the corners, carved relief panels, on an andesite plinth
  const relief = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#ddd2bf'; g.fillRect(0, 0, W, H);
    g.lineCap = 'round';
    const scroll = (col, w, off) => {
      g.strokeStyle = col; g.lineWidth = w;
      g.beginPath();
      for (let t = 0; t <= 1.0001; t += 0.02) { const x = 24 + t * (W - 48), y = H / 2 + Math.sin(t * Math.PI * 3) * 46 + off; if (t === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.5) / 6, x = 24 + t * (W - 48), y = H / 2 + Math.sin(t * Math.PI * 3) * 46 + off;
        const up = Math.cos(t * Math.PI * 3) > 0 ? -1 : 1;
        g.beginPath(); g.arc(x + 14, y + up * 26, 18, 0, Math.PI * 1.6); g.stroke();
        g.beginPath(); g.ellipse(x - 12, y - up * 22, 16, 6, up * 0.7, 0, Math.PI * 2); g.stroke();
      }
    };
    scroll('#9a8e7a', 9, 2); scroll('#f1e8d8', 3, -2);
    g.strokeStyle = '#9a8e7a'; g.lineWidth = 8; g.strokeRect(8, 8, W - 16, H - 16);
    g.strokeStyle = '#f1e8d8'; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28);
  });
  const reliefMat = new THREE.MeshStandardMaterial({ map: relief, roughness: 0.85 });
  const gateParts = [], gateDark = [], gateBase = [], reliefs = [];
  const tiers = [[2.3, 1.3, 0.5], [1.95, 0.95, 1.8], [1.62, 0.8, 2.75], [1.3, 0.7, 3.55], [0.98, 0.6, 4.25], [0.66, 0.5, 4.85]];
  for (const s of [-1, 1]) {
    const gx = X + s * (spine.hw + 1.15), gz = gate.z + 0.6;
    const at = (w) => gx - s * (2.3 - w) / 2; // tier centre: inner face stays flush
    gateBase.push(new THREE.BoxGeometry(2.6, 0.5, 1.9).translate(gx + s * 0.15, Y + 0.25, gz));
    gateBase.push(new THREE.BoxGeometry(2.7, 0.08, 2.0).translate(gx + s * 0.15, Y + 0.52, gz));
    tiers.forEach(([w, h, y], i) => {
      const d = 1.5 - i * 0.16;
      gateParts.push(new THREE.BoxGeometry(w, h, d).translate(at(w), Y + y + h / 2, gz));
      gateDark.push(new THREE.BoxGeometry(w + 0.08, 0.09, d + 0.08).translate(at(w), Y + y + h, gz));
      gateDark.push(new THREE.BoxGeometry(w + 0.04, 0.05, d + 0.04).translate(at(w), Y + y + 0.03, gz));
      // antefixes on the outer corners of each tier
      for (const sz of [-1, 1]) gateParts.push(new THREE.ConeGeometry(0.11, 0.34, 4).rotateY(Math.PI / 4).translate(at(w) + s * (w / 2 - 0.08), Y + y + h + 0.2, gz + sz * (d / 2 - 0.08)));
      // carved panels on the front, back and outer faces of the lower tiers
      if (i < 3) {
        for (const sz of [-1, 1]) {
          const p = new THREE.PlaneGeometry(w - 0.36, h - 0.3);
          if (sz < 0) p.rotateY(Math.PI);
          reliefs.push(p.translate(at(w), Y + y + h / 2, gz + sz * (d / 2 + 0.006)));
        }
        reliefs.push(new THREE.PlaneGeometry(d - 0.36, h - 0.3).rotateY(s * Math.PI / 2).translate(at(w) + s * (w / 2 + 0.006), Y + y + h / 2, gz));
      }
    });
    // the crowning stone finial with a brass tip
    gateParts.push(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 8).translate(at(0.66), Y + 5.5, gz));
    gateParts.push(new THREE.SphereGeometry(0.17, 12, 8).translate(at(0.66), Y + 5.75, gz));
    colliders.push({ seg: [gx - 0.45, gz, gx + 0.45, gz], r: 0.78 });
    colliders.push({ x: gx + s * 0.9, z: gz, r: 0.6 });
    // a brass lantern set into each tower's inner face
    const lan = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.32), new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffb45c', emissiveIntensity: 2.4 }));
    lan.position.set(gx - s * 1.17, Y + 1.75, gz);
    group.add(lan);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 8).translate(at(0.66), Y + 6.05, gz), brass);
    group.add(tip);
  }
  const gateMesh = new THREE.Mesh(merge(gateParts), new THREE.MeshStandardMaterial({ color: '#ddd2bf', roughness: 0.85 }));
  gateMesh.castShadow = true;
  group.add(gateMesh);
  group.add(new THREE.Mesh(merge(gateDark), new THREE.MeshStandardMaterial({ color: '#8a7a64', roughness: 0.8 })));
  group.add(new THREE.Mesh(merge(gateBase), new THREE.MeshStandardMaterial({ color: '#5a5650', roughness: 0.9 })));
  group.add(new THREE.Mesh(merge(reliefs), reliefMat));

  /* ---------- boardwalk furniture: benches facing the water, frangipani planters ---------- */
  const benches = [], planters = [], leaves = [], blooms = [], trunks = [];
  for (let k = 0; k < 10; k++) {
    const th = BW.th0 + 0.08 + (k / 9) * (BW.th1 - BW.th0 - 0.16);
    if (Math.abs(th - gateTh) < 0.14) continue;
    const c = boardwalkAt(th, BW.ld + (BW.hw - 0.6) / LAKE.rz);
    const n = boardwalkAt(th, BW.ld - 1 / LAKE.rz);
    const yaw = Math.atan2(-(n.z - c.z), n.x - c.x) + Math.PI / 2;
    if (k % 2 === 0) {
      // a teak bench facing the lake
      const g = [];
      g.push(new THREE.BoxGeometry(1.8, 0.06, 0.5).translate(0, 0.46, 0));
      g.push(new THREE.BoxGeometry(1.8, 0.5, 0.06).translate(0, 0.74, 0.24).rotateX(-0.1));
      for (const x of [-0.8, 0.8]) g.push(new THREE.BoxGeometry(0.08, 0.46, 0.5).translate(x, 0.23, 0));
      for (const p of g) { p.rotateY(yaw); p.translate(c.x, Y, c.z); benches.push(p); }
      colliders.push({ x: c.x, z: c.z, r: 0.6 });
    } else {
      planters.push(new THREE.CylinderGeometry(0.45, 0.38, 0.6, 20).translate(c.x, Y + 0.3, c.z));
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + rng(); rod(V(c.x, Y + 0.55, c.z), V(c.x + Math.cos(a) * 0.25, Y + 1.0 + rng() * 0.2, c.z + Math.sin(a) * 0.25), 0.035, trunks, 6); }
      for (let i = 0; i < 12; i++) {
        const a = rng() * 6.28;
        leaves.push(new THREE.SphereGeometry(0.2, 8, 6).scale(1.5, 0.25, 0.6).rotateY(a).translate(c.x + Math.cos(a) * 0.25, Y + 0.85 + rng() * 0.4, c.z + Math.sin(a) * 0.25));
      }
      for (let i = 0; i < 14; i++) blooms.push(new THREE.SphereGeometry(0.05, 8, 6).scale(1, 0.4, 1).translate(c.x + (rng() - 0.5) * 0.6, Y + 1.05 + rng() * 0.3, c.z + (rng() - 0.5) * 0.6));
      colliders.push({ x: c.x, z: c.z, r: 0.5 });
    }
  }
  // teak benches on the pods' terraces, looking out over the lake
  const benchAt = (x, z, yaw) => {
    const g = [];
    g.push(new THREE.BoxGeometry(1.8, 0.06, 0.5).translate(0, 0.46, 0));
    g.push(new THREE.BoxGeometry(1.8, 0.5, 0.06).translate(0, 0.74, 0.24).rotateX(-0.1));
    for (const bx of [-0.8, 0.8]) g.push(new THREE.BoxGeometry(0.08, 0.46, 0.5).translate(bx, 0.23, 0));
    for (const p of g) { p.rotateY(yaw); p.translate(x, Y, z); benches.push(p); }
    colliders.push({ x, z, r: 0.62 });
  };
  for (const pod of [podW, podE]) {
    const cxp = (pod.x0 + pod.x1) / 2, czp = (pod.z0 + pod.z1) / 2, west = pod === podW;
    for (const dz of [-3, 3]) benchAt(west ? pod.x0 + 0.85 : pod.x1 - 0.85, czp + dz, west ? Math.PI / 2 : -Math.PI / 2);
    for (const dx of [-3, 3]) benchAt(cxp + dx, pod.z0 + 0.8, 0);
  }
  group.add(new THREE.Mesh(merge(benches), teakMat));
  group.add(new THREE.Mesh(merge(planters), stoneMat));
  group.add(new THREE.Mesh(merge(trunks), new THREE.MeshStandardMaterial({ color: '#8a7a68', roughness: 0.8 })));
  group.add(new THREE.Mesh(merge(leaves), new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.6 })));
  group.add(new THREE.Mesh(merge(blooms), new THREE.MeshStandardMaterial({ color: '#fbf1dc', emissive: '#f6d8a0', emissiveIntensity: 0.25 })));

  /* ---------- bronze lantern posts + warm pools ---------- */
  const glassMat = new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 2.2 });
  const poolMat = new THREE.MeshBasicMaterial({
    map: glowTexture(128, 1.6), color: new THREE.Color(0.55, 0.34, 0.15), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4,
  });
  const lampSpots = [];
  // promenade lamps stand between the cart bays; the spine has two pairs out past the pods
  for (const z of [16.625, 11.875, PRM.z0 + 0.35]) for (const s of [-1, 1]) lampSpots.push([X + s * (PRM.hw - 0.25), z]);
  for (const z of [podW.z0 - 1.2, spine.z0 + 0.6]) for (const s of [-1, 1]) lampSpots.push([X + s * (spine.hw - 0.25), z]);
  const BW0 = lampSpots.length;
  for (let k = 0; k < 7; k++) {
    const th = BW.th0 + 0.04 + (k / 6) * (BW.th1 - BW.th0 - 0.08);
    if (Math.abs(th - gateTh) < 0.1) continue;
    const c = boardwalkAt(th, BW.ld - (BW.hw - 0.3) / LAKE.rz);
    lampSpots.push([c.x, c.z]);
  }
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
  group.add(new THREE.Mesh(merge(lampParts), bronze));
  group.add(new THREE.Mesh(merge(glows), glassMat));

  /* ---------- festoon lights over the spine and the pods ---------- */
  const bulbs = [], wires = [];
  const festoon = (A, Bp, sag = 0.6) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; const p = A.clone().lerp(Bp, t); p.y -= Math.sin(Math.PI * t) * sag; pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts);
    wires.push(new THREE.TubeGeometry(curve, 40, 0.006, 3));
    const n = Math.floor(A.distanceTo(Bp) / 0.6);
    for (let i = 1; i < n; i++) bulbs.push(curve.getPoint(i / n).add(V(0, -0.05, 0)));
  };
  // zigzag along the spine
  // a canopy of lights over the cart promenade: across each pair, and crossing between pairs
  for (const i of [0, 2, 4]) festoon(lampTops[i], lampTops[i + 1], 0.9);
  for (const i of [0, 2]) { festoon(lampTops[i], lampTops[i + 3], 0.7); festoon(lampTops[i + 1], lampTops[i + 2], 0.7); }
  festoon(lampTops[6], lampTops[7], 0.3);
  festoon(lampTops[8], lampTops[9], 0.3);
  // along the boardwalk, lamp to lamp on the water side
  for (let i = BW0 + 1; i < lampTops.length; i++) festoon(lampTops[i - 1], lampTops[i], 0.55);
  group.add(new THREE.Mesh(merge(wires), new THREE.MeshStandardMaterial({ color: '#2a2420' })));
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffc070', emissiveIntensity: 3 }), bulbs.length);
  bulbs.forEach((p, i) => bulbMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  group.add(bulbMesh);

  /* ---------- ladder, bollards, the rowboat ---------- */
  const W1 = X + spine.hw - e;
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
  const boat = rowboat();
  boat.userData.keep = true;
  const boatHome = V(X + spine.hw + 1.05, 0.0, ladderZ + 0.2);
  boat.position.copy(boatHome);
  group.add(boat);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(W1 - 0.18, Y + 0.25, ladderZ + gapH + 0.2), V(W1 + 0.4, 0.35, ladderZ + 0.9), V(boatHome.x - 0.05, 0.5, boatHome.z - 1.4)]), 16, 0.012, 4), ropeMat));

  /* ---------- the pendopo on its viewing deck ---------- */
  const pen = new THREE.Group();
  group.add(pen);
  const umpakMat = new THREE.MeshStandardMaterial({ color: '#d9cfbd', roughness: 0.8 });
  const umpak = [], cols = [], beams = [];
  const colH = 2.7, innerH = 4.3;
  const o = PR - 0.4;
  const outer = [];
  for (const t of [-1, -1 / 3, 1 / 3, 1]) outer.push([X + t * o, PZ - o], [X + t * o, PZ + o]);
  for (const t of [-1 / 3, 1 / 3]) outer.push([X - o, PZ + t * o], [X + o, PZ + t * o]);
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
  const ring = (r, y, t) => {
    beam(V(X - r, y, PZ - r), V(X + r, y, PZ - r), t, beams); beam(V(X - r, y, PZ + r), V(X + r, y, PZ + r), t, beams);
    beam(V(X - r, y, PZ - r), V(X - r, y, PZ + r), t, beams); beam(V(X + r, y, PZ - r), V(X + r, y, PZ + r), t, beams);
  };
  ring(o, Y + colH, 0.18);
  ring(1.6, Y + innerH, 0.22);
  for (const [x, z] of inner) beam(V(x, Y + colH, z), V(x + Math.sign(x - X) * (o - 1.6), Y + colH, z + Math.sign(z - PZ) * (o - 1.6)), 0.12, beams);
  for (let k = 0; k < 4; k++) ring(1.6 - 0.18 * (k + 1), Y + innerH + 0.12 + k * 0.14, 0.14);
  pen.add(new THREE.Mesh(merge(umpak), umpakMat));
  pen.add(new THREE.Mesh(merge(cols), teakMat));
  pen.add(new THREE.Mesh(merge(beams), teakMat));
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
      const L = rOut * 2, Dd = Math.hypot(rOut - rIn, yOut - yIn);
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L * 0.5 + rIn, Dd, 0, 0, L * 0.5 + rIn, Dd, L * 0.5 - rIn, Dd].map((v) => v / 2), 2));
      geo.computeVertexNormals();
      g.push(geo);
    }
    return g;
  };
  const roof = new THREE.Mesh(merge([...hipped(PR + 0.6, Y + colH - 0.05, 1.85, Y + innerH - 0.05), ...hipped(2.0, Y + innerH + 0.45, 0.05, Y + innerH + 2.3)]), roofMat);
  roof.castShadow = true;
  pen.add(roof);
  const ridges = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    beam(V(X + sx * (PR + 0.6), Y + colH - 0.02, PZ + sz * (PR + 0.6)), V(X + sx * 1.85, Y + innerH, PZ + sz * 1.85), 0.08, ridges);
    beam(V(X + sx * 2.0, Y + innerH + 0.48, PZ + sz * 2.0), V(X, Y + innerH + 2.3, PZ), 0.07, ridges);
  }
  pen.add(new THREE.Mesh(merge(ridges), new THREE.MeshStandardMaterial({ color: '#1f1a16', roughness: 0.7 })));
  const must = [];
  must.push(new THREE.CylinderGeometry(0.12, 0.18, 0.18, 8).translate(X, Y + innerH + 2.36, PZ));
  must.push(new THREE.SphereGeometry(0.12, 12, 8).translate(X, Y + innerH + 2.55, PZ));
  must.push(new THREE.ConeGeometry(0.05, 0.4, 8).translate(X, Y + innerH + 2.85, PZ));
  pen.add(new THREE.Mesh(merge(must), brass));
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
  // planters at the corners of the viewing deck
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = X + sx * (PH - 0.7), pz = PZ + sz * (PH - 0.7);
    if (sz > 0 && Math.abs(px - X) < spine.hw + 0.8) continue;
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.33, 0.6, 20).translate(px, Y + 0.3, pz), stoneMat));
    const lv = [], bl = [];
    for (let i = 0; i < 12; i++) { const a = rng() * 6.28; lv.push(new THREE.SphereGeometry(0.18, 8, 6).scale(1.5, 0.25, 0.6).rotateY(a).translate(px + Math.cos(a) * 0.22, Y + 0.85 + rng() * 0.35, pz + Math.sin(a) * 0.22)); }
    for (let i = 0; i < 12; i++) bl.push(new THREE.SphereGeometry(0.045, 8, 6).scale(1, 0.4, 1).translate(px + (rng() - 0.5) * 0.5, Y + 1.05 + rng() * 0.25, pz + (rng() - 0.5) * 0.5));
    group.add(new THREE.Mesh(merge(lv), new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.6 })));
    group.add(new THREE.Mesh(merge(bl), new THREE.MeshStandardMaterial({ color: '#fbf1dc', emissive: '#f6d8a0', emissiveIntensity: 0.25 })));
    colliders.push({ x: px, z: pz, r: 0.45 });
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
