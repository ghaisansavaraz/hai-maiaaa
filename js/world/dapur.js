/* Sajian Dapur Gesan: a little private restaurant on the lakeside lawn, east of
   the pier. Joglo-modern: an andesite plinth, cream lime-plaster walls between
   teak posts, a sirap joglo roof, a teak-and-glass front and a lake window
   behind louvred teak shutters, a carved name board over the double door.
   Inside, an open chef's kitchen (stove, wok, copper hood, spice shelf, pans
   on a rail), a chef's counter, and one candle-lit table for two by the lake
   window. It only opens on the days Gesan cooks (config: WORLD_DAPUR_EVENTS /
   WORLD_DAPUR_OPEN): closed, the shutters and doors are shut, the rooms dark
   and a small brass plate says "tutup"; open, everything folds back and the
   warm light comes on. */

import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { DAPUR, DAPUR_FLOOR_Y } from './layout.js';
import { merge } from './props.js';
import { V, beam, rod, canvasTex, signTexture, teakTexture, sirapTexture, shadowAll } from './build.js';
import { frustum, hips } from './stalls.js';
import { orchid, palmFronds, batikTexture } from './greenhouse.js';
import { FlowerBatch } from './flowers3d.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });

/** A louvred teak shutter leaf, hinge at local x = 0, leaf along +x (or −x). */
function shutterLeaf(w, h, dir, teak) {
  const g = new THREE.Group();
  const parts = [];
  const cx = dir * w / 2;
  for (const y of [0.04, h - 0.04]) parts.push(new THREE.BoxGeometry(w, 0.08, 0.05).translate(cx, y, 0));
  for (const x of [0.04, w - 0.04]) parts.push(new THREE.BoxGeometry(0.08, h, 0.05).translate(dir * x, h / 2, 0));
  parts.push(new THREE.BoxGeometry(w - 0.1, 0.06, 0.04).translate(cx, h * 0.5, 0));
  for (let y = 0.12; y < h - 0.1; y += 0.09) parts.push(new THREE.BoxGeometry(w - 0.12, 0.06, 0.012).rotateX(0.6).translate(cx, y, 0));
  g.add(new THREE.Mesh(merge(parts), teak));
  return g;
}

export function createDapur({ open = false, name = 'Sajian Dapur Gesan', menu = [], showText = false } = {}) {
  const rng = mulberry32(83);
  const group = new THREE.Group();
  group.position.set(DAPUR.x, DAPUR_FLOOR_Y, DAPUR.z);
  const colliders = [];
  const W = (x, z) => [DAPUR.x + x, DAPUR.z + z];
  const seg = (ax, az, bx, bz, r = 0.14) => { const c = { seg: [...W(ax, az), ...W(bx, bz)], r }; colliders.push(c); return c; };
  const col = (x, z, r) => { const c = { x: DAPUR.x + x, z: DAPUR.z + z, r }; colliders.push(c); return c; };

  const teak = new THREE.MeshStandardMaterial({ map: teakTexture('#6a3e20'), roughness: 0.45 });
  const darkTeak = new THREE.MeshStandardMaterial({ map: teakTexture('#3e2414'), roughness: 0.4 });
  const plaster = std('#efe6d4', { roughness: 0.9 });
  const andesite = std('#5a5650', { roughness: 0.9 });
  const paras = std('#ddd2bf', { roughness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  const copper = new THREE.MeshStandardMaterial({ color: '#b8683a', roughness: 0.3, metalness: 0.95 });
  const steel = new THREE.MeshStandardMaterial({ color: '#d8dadc', roughness: 0.25, metalness: 0.85 });
  const iron = new THREE.MeshStandardMaterial({ color: '#2a2826', roughness: 0.45, metalness: 0.7 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dfe9ee', transparent: true, opacity: 0.18, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const white = new THREE.MeshPhysicalMaterial({ color: '#f7f5f0', roughness: 0.2, clearcoat: 0.8 });
  // lit materials that the open/closed state drives
  const warm = new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 0 });
  const flame = new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffb050', emissiveIntensity: 0 });
  const gas = new THREE.MeshStandardMaterial({ color: '#4a8cff', emissive: '#3a6cff', emissiveIntensity: 0 });
  const lantern = new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffb45c', emissiveIntensity: 0.8 });

  const HW = DAPUR.hw, HD = DAPUR.hd, P = DAPUR.plinth;
  const WX = HW - 0.3, WZ = HD - 0.3, WH = 2.8; // walls
  /* ---------- plinth, steps, terrace kerb ---------- */
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2 * HW, P + 0.8, 2 * HD).translate(0, -(P + 0.8) / 2, 0), andesite));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2 * HW + 0.06, 0.06, 2 * HD + 0.06).translate(0, -0.03, 0), paras));
  const steps = [];
  for (let k = 0; k < 3; k++) steps.push(new THREE.BoxGeometry(2.6, P * (k + 1) / 3, 0.34).translate(0, -P + P * (k + 1) / 6, HD + 0.85 - k * 0.34));
  group.add(new THREE.Mesh(merge(steps), paras));
  /* ---------- floor ---------- */
  const parquet = new THREE.MeshStandardMaterial({ map: teakTexture('#7a4a28'), roughness: 0.5 });
  parquet.map.repeat.set(4, 3);
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, 2 * WZ).rotateX(-Math.PI / 2).translate(0, 0.004, 0), parquet));

  /* ---------- walls: teak posts, plaster panels, glazing on the front and the lake side ---------- */
  const posts = [], walls = [], glassG = [], trim = [];
  const postAt = (x, z) => { posts.push(new THREE.BoxGeometry(0.2, WH, 0.2).translate(x, WH / 2, z)); col(x, z, 0.16); };
  for (const x of [-WX, -2.15, -0.7, 0.7, 2.15, WX]) postAt(x, WZ);
  for (const x of [-WX, 0, WX]) postAt(x, -WZ);
  for (const z of [-0.8, 0.8]) { postAt(-WX, z); postAt(WX, z); }
  // the north wall and the kitchen (east) wall are solid plaster
  walls.push(new THREE.BoxGeometry(2 * WX, WH, 0.14).translate(0, WH / 2, -WZ));
  walls.push(new THREE.BoxGeometry(0.14, WH, 2 * WZ).translate(WX, WH / 2, 0));
  seg(-WX, -WZ, WX, -WZ); seg(WX, -WZ, WX, WZ);
  // front: low teak sill + glass in four bays either side of the door, transom over the door
  const frontBays = [[-WX, -2.15], [-2.15, -0.7], [0.7, 2.15], [2.15, WX]];
  for (const [a, b] of frontBays) {
    walls.push(new THREE.BoxGeometry(b - a, 0.5, 0.14).translate((a + b) / 2, 0.25, WZ));
    glassG.push(new THREE.PlaneGeometry(b - a - 0.2, WH - 0.7).translate((a + b) / 2, 0.5 + (WH - 0.7) / 2, WZ));
    trim.push(new THREE.BoxGeometry(b - a, 0.06, 0.16).translate((a + b) / 2, 0.52, WZ));
  }
  seg(-WX, WZ, -0.75, WZ); seg(0.75, WZ, WX, WZ);
  walls.push(new THREE.BoxGeometry(1.4, WH - 2.35, 0.14).translate(0, 2.35 + (WH - 2.35) / 2, WZ));
  // lake side: three tall windows over a sill
  const lakeBays = [[-WZ, -0.8], [-0.8, 0.8], [0.8, WZ]];
  for (const [a, b] of lakeBays) {
    walls.push(new THREE.BoxGeometry(0.14, 0.6, b - a).translate(-WX, 0.3, (a + b) / 2));
    glassG.push(new THREE.PlaneGeometry(b - a - 0.2, WH - 0.8).rotateY(Math.PI / 2).translate(-WX, 0.6 + (WH - 0.8) / 2, (a + b) / 2));
  }
  seg(-WX, -WZ, -WX, WZ);
  // ring beam
  for (const [ax, az, bx, bz] of [[-WX, -WZ, WX, -WZ], [-WX, WZ, WX, WZ], [-WX, -WZ, -WX, WZ], [WX, -WZ, WX, WZ]]) beam(V(ax, WH, az), V(bx, WH, bz), 0.22, posts);
  group.add(new THREE.Mesh(merge(posts), darkTeak));
  group.add(new THREE.Mesh(merge(walls), plaster));
  group.add(new THREE.Mesh(merge(trim), teak));
  const glassMesh = new THREE.Mesh(merge(glassG), glass);
  glassMesh.renderOrder = 2;
  group.add(glassMesh);

  /* ---------- joglo roof in sirap, brass finials ---------- */
  const sirap = new THREE.MeshStandardMaterial({ map: sirapTexture(), roughness: 0.85, side: THREE.DoubleSide });
  const roofY = WH + 0.05;
  const roof = new THREE.Mesh(merge([...frustum(HW + 0.55, HD + 0.55, roofY, 2.2, 1.3, roofY + 1.0, 0.18), ...frustum(2.45, 1.55, roofY + 0.92, 1.0, 0, roofY + 2.6, 0.18)]), sirap);
  roof.castShadow = true;
  group.add(roof);
  const rd = [];
  hips(HW + 0.55, HD + 0.55, roofY, 2.2, 1.3, roofY + 1.0, 0.09, rd);
  hips(2.45, 1.55, roofY + 0.92, 1.0, 0, roofY + 2.6, 0.08, rd);
  beam(V(-1.05, roofY + 2.64, 0), V(1.05, roofY + 2.64, 0), 0.14, rd);
  group.add(new THREE.Mesh(merge(rd), std('#1f1a16', { roughness: 0.7 })));
  const fin = [];
  for (const s of [-1, 1]) { fin.push(new THREE.SphereGeometry(0.07, 12, 8).translate(s * 1.05, roofY + 2.76, 0)); fin.push(new THREE.ConeGeometry(0.035, 0.3, 8).translate(s * 1.05, roofY + 2.96, 0)); }
  group.add(new THREE.Mesh(merge(fin), brass));
  // ceiling: a teak-boarded tumpang sari under the roof
  const ceil = [];
  for (let k = 0; k < 4; k++) {
    const ax = WX - 0.25 - k * 0.35, az = WZ - 0.25 - k * 0.35, y = WH + 0.12 + k * 0.14;
    beam(V(-ax, y, -az), V(ax, y, -az), 0.12, ceil); beam(V(-ax, y, az), V(ax, y, az), 0.12, ceil);
    beam(V(-ax, y, -az), V(-ax, y, az), 0.12, ceil); beam(V(ax, y, -az), V(ax, y, az), 0.12, ceil);
  }
  group.add(new THREE.Mesh(merge(ceil), darkTeak));
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(2 * (WX - 1.4), 2 * (WZ - 1.4)).rotateX(Math.PI / 2).translate(0, WH + 0.62, 0), new THREE.MeshStandardMaterial({ map: batikTexture('#3a2414', '#c9a25a'), roughness: 0.6 })));

  /* ---------- the name board over the door, door lanterns, the tutup plate ---------- */
  const nameMat = new THREE.MeshBasicMaterial({ map: signTexture([name], { w: 900, h: 170, bg: '#1f3d2e', fg: '#efe2c4', border: '#c9a25a', title: 0.44 }), color: '#d8cfbd' });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), nameMat);
  board.position.set(0, WH - 0.05, WZ + 0.13);
  group.add(board);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.62, 0.06).translate(0, WH - 0.05, WZ + 0.09), darkTeak));
  for (const s of [-1, 1]) {
    const lg = [];
    lg.push(new THREE.BoxGeometry(0.06, 0.06, 0.22).translate(s * 1.05, 2.05, WZ + 0.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lg.push(new THREE.BoxGeometry(0.015, 0.3, 0.015).translate(s * 1.05 + sx * 0.08, 1.8, WZ + 0.3 + sz * 0.08));
    lg.push(new THREE.ConeGeometry(0.14, 0.1, 4).rotateY(Math.PI / 4).translate(s * 1.05, 2.0, WZ + 0.3));
    group.add(new THREE.Mesh(merge(lg), brass));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13).translate(s * 1.05, 1.8, WZ + 0.3), lantern));
  }
  const plateTex = (t) => signTexture([t], { w: 256, h: 96, bg: '#c9a25a', fg: '#2a1a10', border: '#8a6a2c', title: 0.6 });
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex(open ? 'buka' : 'tutup'), color: '#d8cfbd' });

  /* ---------- front doors (swing in) and louvred shutters (swing out) ---------- */
  const anim = []; // { g, axis: 'y', closed, opened }
  const doors = new THREE.Group();
  doors.userData.keep = true;
  group.add(doors);
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * 0.7, 0, WZ);
    const leaf = new THREE.Group();
    const lp = [];
    const cx = -s * 0.35;
    lp.push(new THREE.BoxGeometry(0.7, 2.3, 0.06).translate(cx, 1.15, 0));
    leaf.add(new THREE.Mesh(merge(lp), darkTeak));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.2).translate(cx, 1.45, 0.035), glass);
    pane.renderOrder = 2;
    leaf.add(pane);
    leaf.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.04).translate(-s * 0.62, 1.05, 0.06), brass));
    if (s < 0) {
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.13), plateMat);
      plate.position.set(cx, 1.62, 0.07);
      leaf.add(plate);
    }
    hinge.add(leaf);
    doors.add(hinge);
    // both leaves swing inward (−z)
    anim.push({ g: hinge, closed: 0, opened: -s * 1.45 });
  }
  const shutters = new THREE.Group();
  shutters.userData.keep = true;
  group.add(shutters);
  const addPair = (frame, a, b, h, y0) => {
    const w = (b - a) / 2;
    for (const [hx, dir, sign] of [[a, 1, -1], [b, -1, 1]]) {
      const hinge = new THREE.Group();
      hinge.position.set(hx, y0, 0);
      hinge.add(shutterLeaf(w, h, dir, teak));
      frame.add(hinge);
      anim.push({ g: hinge, closed: 0, opened: sign * 1.7 });
    }
  };
  const front = new THREE.Group();
  front.position.set(0, 0, WZ + 0.12);
  for (const [a, b] of frontBays) addPair(front, a, b, WH - 0.92, 0.52);
  shutters.add(front);
  const lake = new THREE.Group();
  lake.position.set(-WX - 0.12, 0, 0);
  lake.rotation.y = -Math.PI / 2;
  for (const [a, b] of lakeBays) addPair(lake, -b, -a, WH - 0.72, 0.62);
  shutters.add(lake);
  const doorCollider = seg(-0.75, WZ, 0.75, WZ, 0.12);

  /* ---------- the kitchen along the east wall ---------- */
  const KX = WX - 0.42;
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 4.2).translate(KX, 0.45, -0.3), darkTeak));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 4.24).translate(KX, 0.925, -0.3), std('#2a2826', { roughness: 0.3 })));
  seg(KX, -2.4, KX, 1.8, 0.34);
  const KT = 0.95;
  // two burners: a wok and a clay pot
  for (const z of [-1.4, -0.6]) {
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.05, 18).translate(KX, KT + 0.025, z), iron));
    group.add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 22).rotateX(Math.PI / 2).translate(KX, KT + 0.055, z), gas));
  }
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(KX, KT + 0.27, -1.4), iron));
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8).rotateZ(Math.PI / 2).translate(KX - 0.32, KT + 0.26, -1.4), darkTeak));
  group.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.12, 0], [0.16, 0.1], [0.14, 0.18], [0.13, 0.19]].map(([r, y]) => new THREE.Vector2(r, y)), 20).translate(KX, KT + 0.06, -0.6), std('#8a4a2a', { roughness: 0.7 })));
  // copper hood over the burners
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.55, 0.5, 4, 1, true).rotateY(Math.PI / 4).scale(0.9, 1, 1.6).translate(KX + 0.05, 2.15, -1.0), new THREE.MeshStandardMaterial({ color: '#b8683a', roughness: 0.3, metalness: 0.95, side: THREE.DoubleSide })));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25).translate(KX + 0.05, 2.6, -1.0), copper));
  // chopping board: chilli, shallots, garlic, lemongrass, a knife; a stone cobek
  const cb = [];
  cb.push(new THREE.BoxGeometry(0.4, 0.03, 0.55).translate(KX, KT + 0.015, 0.45));
  group.add(new THREE.Mesh(merge(cb), teak));
  const veg = { red: [], sh: [], gar: [], lem: [] };
  for (let i = 0; i < 7; i++) veg.red.push(new THREE.CapsuleGeometry(0.008, 0.05, 4, 6).rotateZ(Math.PI / 2).rotateY(rng() * 3).translate(KX - 0.1 + rng() * 0.12, KT + 0.04, 0.3 + rng() * 0.15));
  for (let i = 0; i < 6; i++) veg.sh.push(new THREE.SphereGeometry(0.018, 8, 6).scale(1, 1.2, 1).translate(KX + 0.05 + rng() * 0.1, KT + 0.05, 0.55 + rng() * 0.12));
  for (let i = 0; i < 4; i++) veg.gar.push(new THREE.SphereGeometry(0.02, 8, 6).translate(KX + 0.1, KT + 0.05, 0.38 + i * 0.04));
  for (let i = 0; i < 3; i++) veg.lem.push(new THREE.CylinderGeometry(0.007, 0.008, 0.3, 6).rotateX(Math.PI / 2).translate(KX - 0.12 + i * 0.02, KT + 0.04, 0.5));
  group.add(new THREE.Mesh(merge(veg.red), std('#c41e1a')));
  group.add(new THREE.Mesh(merge(veg.sh), std('#a8506a')));
  group.add(new THREE.Mesh(merge(veg.gar), std('#efe8dc')));
  group.add(new THREE.Mesh(merge(veg.lem), std('#c8d890')));
  group.add(new THREE.Mesh(merge([new THREE.BoxGeometry(0.2, 0.003, 0.05).translate(KX - 0.05, KT + 0.033, 0.68), new THREE.BoxGeometry(0.1, 0.02, 0.025).translate(KX + 0.1, KT + 0.04, 0.68)]), steel));
  group.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0.02], [0.13, 0], [0.16, 0.06], [0.14, 0.07], [0, 0.04]].map(([r, y]) => new THREE.Vector2(r, y)), 20).translate(KX, KT, 1.2), std('#4a4642', { roughness: 0.95 })));
  // spice shelf + jars, and a rail of pans and ladles
  group.add(new THREE.Mesh(merge([1.45, 1.85].map((y) => new THREE.BoxGeometry(0.26, 0.04, 2.2).translate(WX - 0.2, y, 0.55))), teak));
  const jarCols = ['#e88a1a', '#c41e1a', '#7a3e1c', '#d8b07a', '#4f8f3a', '#f2d040', '#5a2a14', '#efe8dc'];
  for (let i = 0; i < 16; i++) {
    const y = i % 2 ? 1.47 : 1.87, z = -0.45 + Math.floor(i / 2) * 0.27;
    const j = new THREE.Group();
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 14, 1, true).translate(0, 0.07, 0), glass);
    gl.renderOrder = 2; j.add(gl);
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.1, 12).translate(0, 0.05, 0), std(jarCols[i % jarCols.length], { roughness: 0.8 })));
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 14).translate(0, 0.145, 0), brass));
    j.position.set(WX - 0.2, y, z);
    group.add(j);
  }
  const rail = [];
  rod(V(WX - 0.12, 2.25, -2.3), V(WX - 0.12, 2.25, -0.1), 0.012, rail, 6);
  for (let i = 0; i < 6; i++) {
    const z = -2.15 + i * 0.38;
    rod(V(WX - 0.12, 2.25, z), V(WX - 0.12, 2.0, z), 0.004, rail, 4);
    if (i % 2) rail.push(new THREE.CylinderGeometry(0.11, 0.1, 0.02, 18).rotateZ(Math.PI / 2).translate(WX - 0.14, 1.85, z));
    else rail.push(new THREE.SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(Math.PI / 2).translate(WX - 0.14, 1.95, z));
  }
  group.add(new THREE.Mesh(merge(rail), copper));

  /* ---------- the chef's counter, facing the table ---------- */
  const CX = 1.9;
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 2.6).translate(CX, 0.5, -0.4), teak));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 2.7).translate(CX, 1.025, -0.4), std('#e8e0d0', { roughness: 0.25 })));
  seg(CX, -1.7, CX, 0.9, 0.32);
  const bell = new THREE.Group();
  bell.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass));
  bell.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.008, 16), iron));
  bell.position.set(CX - 0.1, 1.05, 0.6);
  group.add(bell);
  const fb = new THREE.Group();
  fb.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.08, 0], [0.16, 0.07], [0.155, 0.07], [0, 0.01]].map(([r, y]) => new THREE.Vector2(r, y)), 20), white));
  const fr = [];
  for (let i = 0; i < 6; i++) fr.push(new THREE.SphereGeometry(0.035, 10, 8).translate((rng() - 0.5) * 0.15, 0.06, (rng() - 0.5) * 0.15));
  fb.add(new THREE.Mesh(merge(fr), std('#e8a02a')));
  fb.position.set(CX - 0.05, 1.05, -1.2);
  group.add(fb);
  const co = orchid(rng, 1.1, '#f8f4f6');
  co.position.set(CX, 1.05, -0.3);
  group.add(co);

  /* ---------- the table for two by the lake window ---------- */
  const TX = -2.45, TZ = -0.1;
  const table = new THREE.Group();
  table.position.set(TX, 0, TZ);
  table.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 36).translate(0, 0.76, 0), teak));
  table.add(new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.2, 36, 1, true).translate(0, 0.68, 0), std('#f6f2ea', { roughness: 0.9, side: THREE.DoubleSide })));
  table.add(new THREE.Mesh(new THREE.CylinderGeometry(0.525, 0.525, 0.012, 36).translate(0, 0.785, 0), std('#f6f2ea', { roughness: 0.9 })));
  table.add(new THREE.Mesh(merge([new THREE.CylinderGeometry(0.05, 0.07, 0.72, 12).translate(0, 0.36, 0), new THREE.CylinderGeometry(0.3, 0.32, 0.03, 20).translate(0, 0.015, 0)]), darkTeak));
  const setting = [], cutlery = [], glasses = [];
  for (const s of [-1, 1]) {
    setting.push(new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.13, 0.012], [0.125, 0.014], [0, 0.006]].map(([r, y]) => new THREE.Vector2(r, y)), 24).translate(0, 0.792, s * 0.3));
    setting.push(new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.085, 0.01], [0.08, 0.012], [0, 0.005]].map(([r, y]) => new THREE.Vector2(r, y)), 20).translate(0, 0.805, s * 0.3));
    for (const dx of [-0.16, -0.18, 0.16, 0.18]) cutlery.push(new THREE.BoxGeometry(0.008, 0.004, 0.17).translate(dx, 0.795, s * 0.3));
    glasses.push(new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.004, 0.01], [0.004, 0.09], [0.035, 0.12], [0.038, 0.19], [0.036, 0.19], [0.033, 0.12], [0, 0.1]].map(([r, y]) => new THREE.Vector2(r, y)), 16).translate(0.2, 0.792, s * 0.15));
  }
  table.add(new THREE.Mesh(merge(setting), white));
  table.add(new THREE.Mesh(merge(cutlery), steel));
  const gm = new THREE.Mesh(merge(glasses), glass); gm.renderOrder = 2; table.add(gm);
  // napkins folded on the plates
  for (const s of [-1, 1]) table.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.06).rotateY(0.5).translate(0, 0.82, s * 0.3), std('#1f3d2e', { roughness: 0.95 })));
  // two candles and a little vase of roses
  const candles = new THREE.Group();
  candles.userData.keep = true;
  for (const dz of [-0.06, 0.06]) {
    candles.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.03, 12).translate(-0.18, 0.805, dz), brass));
    candles.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 10).translate(-0.18, 0.92, dz), std('#f6eedc')));
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 2, 1).translate(-0.18, 1.04, dz), flame);
    candles.add(f);
  }
  table.add(candles);
  table.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.04, 0.05], [0.02, 0.1], [0.024, 0.12]].map(([r, y]) => new THREE.Vector2(r, y)), 16).translate(-0.05, 0.792, 0), white));
  const flowers = new FlowerBatch(5);
  for (let k = 0; k < 7; k++) flowers.add(['rose', 'peony', 'ranunculus'][k % 3], TX - 0.05 + (rng() - 0.5) * 0.08, 0.95 + rng() * 0.06, TZ + (rng() - 0.5) * 0.08, { stem: 0.1, scale: 1.2 });
  // upholstered chairs facing each other
  const chair = (z, ry) => {
    const c = new THREE.Group();
    c.position.set(0, 0, z); c.rotation.y = ry;
    c.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.48).translate(0, 0.47, 0), std('#1f3d2e', { roughness: 0.95 })));
    c.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.08).translate(0, 0.8, 0.22), std('#1f3d2e', { roughness: 0.95 })));
    const l = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) l.push(new THREE.BoxGeometry(0.04, 0.42, 0.04).translate(sx * 0.21, 0.21, sz * 0.2));
    l.push(new THREE.BoxGeometry(0.54, 0.04, 0.1).translate(0, 1.08, 0.22));
    c.add(new THREE.Mesh(merge(l), darkTeak));
    table.add(c);
  };
  chair(0.78, 0); chair(-0.78, Math.PI);
  group.add(table);
  col(TX, TZ, 0.62); col(TX, TZ + 0.78, 0.3); col(TX, TZ - 0.78, 0.3);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: batikTexture('#5a1612', '#d8b060'), roughness: 0.95 }));
  rug.position.set(TX, 0.012, TZ);
  group.add(rug);

  /* ---------- pendants, the menu board, plants ---------- */
  const pend = new THREE.Group();
  pend.add(new THREE.Mesh(new THREE.LatheGeometry([[0.02, 0.3], [0.12, 0.26], [0.22, 0.12], [0.24, 0.0], [0.22, -0.01]].map(([r, y]) => new THREE.Vector2(r, y)), 20), new THREE.MeshStandardMaterial({ color: '#d8b880', roughness: 0.8, side: THREE.DoubleSide })));
  pend.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8).translate(0, 0.06, 0), warm));
  pend.position.set(TX, 1.85, TZ);
  group.add(pend);
  const cords = [];
  rod(V(TX, 2.15, TZ), V(TX, WH + 0.6, TZ), 0.004, cords, 4);
  for (const z of [-1.3, 0.3]) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c9a25a', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })));
    p.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8).translate(0, 0.02, 0), warm));
    p.position.set(CX, 2.05, z);
    group.add(p);
    rod(V(CX, 2.2, z), V(CX, WH + 0.6, z), 0.004, cords, 4);
  }
  group.add(new THREE.Mesh(merge(cords), std('#2a1f1a')));
  const lines = showText ? [name, ...menu] : [name];
  const menuBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), new THREE.MeshBasicMaterial({ map: signTexture(lines, { w: 380, h: 500, bg: '#1f3d2e', fg: '#efe2c4', border: '#c9a25a', title: lines.length > 1 ? 0.12 : 0.13 }), color: '#cfc6b4' }));
  menuBoard.position.set(-1.0, 1.65, -WZ + 0.09);
  group.add(menuBoard);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.15, 0.04).translate(-1.0, 1.65, -WZ + 0.07), brass));
  const palm = palmFronds(rng, 0.9);
  palm.position.set(-WX + 0.45, 0, -WZ + 0.45);
  group.add(palm);
  col(-WX + 0.45, -WZ + 0.45, 0.35);
  // frangipani planters either side of the steps
  for (const s of [-1, 1]) {
    const pl = new THREE.Group();
    pl.position.set(s * 1.75, 0, HD - 0.2);
    pl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.5, 18).translate(0, 0.25, 0), paras));
    const lv = [], bl = [];
    for (let i = 0; i < 14; i++) { const a = rng() * 6.28; lv.push(new THREE.SphereGeometry(0.16, 8, 6).scale(1.5, 0.25, 0.6).rotateY(a).translate(Math.cos(a) * 0.2, 0.75 + rng() * 0.3, Math.sin(a) * 0.2)); }
    for (let i = 0; i < 14; i++) bl.push(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 0.45, 1).translate((rng() - 0.5) * 0.5, 0.95 + rng() * 0.2, (rng() - 0.5) * 0.5));
    pl.add(new THREE.Mesh(merge(lv), std('#3f6b35', { roughness: 0.6 })));
    pl.add(new THREE.Mesh(merge(bl), new THREE.MeshStandardMaterial({ color: '#fbf1dc', emissive: '#f6d8a0', emissiveIntensity: 0.25 })));
    group.add(pl);
    col(s * 1.75, HD - 0.2, 0.34);
  }
  group.add(flowers.build());
  shadowAll(group, true, true);
  glassMesh.castShadow = false;

  /* ---------- light ---------- */
  const light = new THREE.PointLight('#ffc27a', 0, 9, 2);
  light.position.set(-0.4, 2.2, 0.2);
  group.add(light);

  // open/closed, eased
  let k = open ? 1 : 0, target = k;
  const apply = () => {
    for (const a of anim) a.g.rotation.y = a.closed + (a.opened - a.closed) * k;
  };
  apply();
  const setOpen = (v) => {
    target = v ? 1 : 0;
    plateMat.map = plateTex(v ? 'buka' : 'tutup'); plateMat.needsUpdate = true;
    // the doorway is only passable while it's open
    if (v) doorCollider.minY = 1e9; else delete doorCollider.minY;
  };
  setOpen(open);
  return {
    group, colliders,
    get isOpen() { return target === 1; },
    setOpen,
    update(t, dt) {
      if (k !== target) { k += Math.sign(target - k) * Math.min(Math.abs(target - k), dt * 0.35); apply(); }
      const flick = 0.92 + Math.sin(t * 9.3) * 0.05 + Math.sin(t * 15.1) * 0.03;
      flame.emissiveIntensity = 2.6 * k * flick;
      warm.emissiveIntensity = 2.0 * k;
      gas.emissiveIntensity = 1.5 * k;
      lantern.emissiveIntensity = 0.7 + 1.6 * k;
      light.intensity = 9 * k * (0.97 + Math.sin(t * 7.1) * 0.02);
    },
  };
}
