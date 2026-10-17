/* The food and drink on the pier's promenade, five-star style:
   - Gelato: a cream-lacquered cart with brass and gold pinstripes, eight
     pozzetto tubs under steel lids that lift when she picks a flavour, a
     striped canopy lit warm, and a hanging brass bell she can ring.
   - Reva Maia's Nhà Việt: a dark-lacquered Vietnamese pavilion with a tiled
     roof, lattice screens, silk lanterns and rattan pendants, a marble
     counter laden with phở, gỏi cuốn, bánh mì, bún chả, chè and a phin coffee
     station, shelves of blue-and-white ceramics, and teak dining.
   - The jamu bar: marble and teak, apothecary jars of rhizomes, a stone
     lumpang, brass pots, glass dispensers of four jamu, and bar stools. */

import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { PIER } from './layout.js';
import { merge } from './props.js';
import { V, beam, rod, canvasTex, signTexture, kawungPanelTexture, teakTexture, shadowAll } from './build.js';
import { FLAVORS, JAMU, jamuBottle, phoBowl, springRollPlate } from './food.js';
import { caneTexture, batikTexture, orchid, chandelier } from './greenhouse.js';

const Y = PIER.deckY;

/* ---------------- shared materials ---------------- */
const mats = () => ({
  brass: new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.35, metalness: 0.85 }),
  steel: new THREE.MeshStandardMaterial({ color: '#dfe2e4', roughness: 0.22, metalness: 0.85 }),
  teak: new THREE.MeshStandardMaterial({ map: teakTexture(), roughness: 0.45 }),
  lacquer: new THREE.MeshPhysicalMaterial({ color: '#2a140d', roughness: 0.3, clearcoat: 0.8 }),
  marble: new THREE.MeshPhysicalMaterial({ color: '#f3efe8', roughness: 0.15, clearcoat: 0.9 }),
  cream: new THREE.MeshPhysicalMaterial({ color: '#f1e8d6', roughness: 0.3, clearcoat: 0.6, emissive: '#ffcf9a', emissiveIntensity: 0.1 }),
  warm: new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 2.4 }),
  cane: new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.8, side: THREE.DoubleSide }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#f4fbff', transparent: true, opacity: 0.22, roughness: 0.04, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
});

function tileTexture() {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#3a2620'; g.fillRect(0, 0, W, H);
    for (let y = 0, r = 0; y < H; y += 16, r++) {
      for (let x = (r % 2) * 10; x < W + 20; x += 20) {
        const v = 70 + ((x * 7 + y * 13) % 30);
        g.fillStyle = `rgb(${v + 30},${v},${v - 14})`;
        g.beginPath(); g.ellipse(x + 10, y + 12, 9, 9, 0, Math.PI, 0); g.fill();
        g.fillRect(x + 1, y + 2, 18, 10);
      }
    }
  }, { repeat: [4, 4] });
}

function latticeTexture() {
  // a Vietnamese geometric lattice (cut out, use with alphaTest)
  return canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const c = 32;
    for (let y = 0; y < H; y += c) {
      for (let x = 0; x < W; x += c) {
        g.fillRect(x + 4, y + 4, c / 2 - 6, c / 2 - 6);
        g.fillRect(x + c / 2 + 2, y + c / 2 + 2, c / 2 - 6, c / 2 - 6);
        g.beginPath(); g.arc(x + c * 0.75, y + c * 0.25, 5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(x + c * 0.25, y + c * 0.75, 5, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
  });
}

function blueWhiteTexture() {
  return canvasTex(128, 64, (g, W, H) => {
    g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2a4a8a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 10); g.lineTo(W, 10); g.stroke();
    g.beginPath(); g.moveTo(0, H - 8); g.lineTo(W, H - 8); g.stroke();
    g.lineWidth = 2;
    for (let x = 6; x < W; x += 22) { g.beginPath(); g.arc(x + 6, H / 2, 7, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x + 13, H / 2); g.quadraticCurveTo(x + 18, H / 2 - 8, x + 22, H / 2); g.stroke(); }
  }, { repeat: [3, 1] });
}

/* ---------------- the silk lantern + rattan pendant ---------------- */

function silkLantern(color) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.03 + Math.sin(Math.PI * t) * 0.17, t * 0.42)); }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.7, side: THREE.DoubleSide })));
  const gold = new THREE.MeshStandardMaterial({ color: '#d9a640', roughness: 0.35, metalness: 0.8 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.04, 12).translate(0, 0.43, 0), gold));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.035, 12).translate(0, -0.012, 0), gold));
  const ribs = [];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    ribs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.filter((_, i) => i % 2 === 0).map((p) => V(Math.cos(a) * (p.x + 0.004), p.y, Math.sin(a) * (p.x + 0.004)))), 10, 0.003, 3));
  }
  g.add(new THREE.Mesh(merge(ribs), gold));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 8).translate(0, -0.15, 0), new THREE.MeshStandardMaterial({ color: '#b81e1e', roughness: 0.8 })));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 4).translate(0, 0.58, 0), new THREE.MeshStandardMaterial({ color: '#2a1f1a' })));
  return g;
}

function rattanPendant(cane, warm) {
  const g = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), cane);
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), warm);
  bulb.position.y = 0.02;
  g.add(bulb);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4).translate(0, 0.65, 0), new THREE.MeshStandardMaterial({ color: '#2a1f1a' })));
  return g;
}

/* ---------------- small dishes for the Nhà Việt counter ---------------- */

function banhMiBoard(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.24), m.teak));
  for (let i = 0; i < 2; i++) {
    const loaf = new THREE.Group();
    const crust = new THREE.MeshStandardMaterial({ color: '#d4914a', roughness: 0.55 });
    const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 6, 12).rotateZ(Math.PI / 2), crust);
    top.scale.set(1, 0.7, 1);
    top.position.y = 0.06;
    loaf.add(top);
    const fill = [['#e8a0a0', 0.033], ['#4f8f3a', 0.04], ['#f0a24a', 0.036], ['#c9583a', 0.03]];
    fill.forEach(([c, h], k) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.05), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
      f.position.y = h - 0.004 + k * 0.002;
      loaf.add(f);
    });
    const bottom = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 6, 12).rotateZ(Math.PI / 2), crust);
    bottom.scale.set(1, 0.5, 1);
    bottom.position.y = 0.025;
    loaf.add(bottom);
    loaf.position.set(0, 0.0, -0.06 + i * 0.12);
    loaf.rotation.y = (i - 0.5) * 0.2;
    g.add(loaf);
  }
  return g;
}

function bunCha() {
  const g = new THREE.Group();
  const bowl = (r, h, col) => new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [r * 0.5, 0], [r, h], [r * 0.95, h], [r * 0.45, 0.01], [0, 0.01]].map(([a, b]) => new THREE.Vector2(a, b)), 24), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.2, clearcoat: 0.7, side: THREE.DoubleSide }));
  const b1 = bowl(0.09, 0.06, '#f4f2ec'); b1.position.set(-0.08, 0, 0); g.add(b1);
  const broth = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#a8692a', roughness: 0.1, clearcoat: 1 }));
  broth.position.set(-0.08, 0.05, 0); g.add(broth);
  const pat = [];
  for (let i = 0; i < 4; i++) pat.push(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 0.6, 1).translate(-0.08 + (i % 2 - 0.5) * 0.06, 0.055, (Math.floor(i / 2) - 0.5) * 0.05));
  g.add(new THREE.Mesh(merge(pat), new THREE.MeshStandardMaterial({ color: '#6a3a22', roughness: 0.6 })));
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.015, 24), new THREE.MeshPhysicalMaterial({ color: '#f4f2ec', roughness: 0.2, clearcoat: 0.7 }));
  plate.position.set(0.1, 0.008, 0); g.add(plate);
  const nood = [];
  for (let i = 0; i < 18; i++) nood.push(new THREE.TorusGeometry(0.02 + (i % 3) * 0.008, 0.003, 4, 10).rotateX(Math.PI / 2).translate(0.1 + Math.cos(i) * 0.03, 0.02 + i * 0.001, Math.sin(i) * 0.03));
  g.add(new THREE.Mesh(merge(nood), new THREE.MeshStandardMaterial({ color: '#f1ebdc', roughness: 0.5 })));
  return g;
}

function cheGlasses(m) {
  const g = new THREE.Group();
  const layers = [['#7bb85a', '#f2d04a', '#f6f1e2', '#8a2a2a'], ['#f2b0c0', '#f6f1e2', '#6a3a2a', '#e8c24a'], ['#4a8a3a', '#f6f1e2', '#f2d04a', '#2a1a1a']];
  layers.forEach((cols, i) => {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.14, 16, 1, true), m.glass);
    glass.position.set(i * 0.09, 0.07, 0);
    glass.renderOrder = 2;
    g.add(glass);
    cols.forEach((c, k) => {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.03, 0.03, 14), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: 0.1 }));
      l.position.set(i * 0.09, 0.018 + k * 0.03, 0);
      g.add(l);
    });
    const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.2, 4), m.steel);
    spoon.position.set(i * 0.09 + 0.01, 0.15, 0); spoon.rotation.z = 0.2;
    g.add(spoon);
  });
  return g;
}

function phinStation(m) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.1, 16, 1, true), m.glass);
    glass.position.set(i * 0.1, 0.05, 0);
    glass.renderOrder = 2;
    g.add(glass);
    const milk = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.025, 14), new THREE.MeshStandardMaterial({ color: '#efe2c4', roughness: 0.3 }));
    milk.position.set(i * 0.1, 0.014, 0); g.add(milk);
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.032, 0.04, 14), new THREE.MeshStandardMaterial({ color: '#3a2216', roughness: 0.2 }));
    coffee.position.set(i * 0.1, 0.046, 0); g.add(coffee);
    // the aluminium phin filter sitting on top
    const phin = [];
    phin.push(new THREE.CylinderGeometry(0.045, 0.045, 0.004, 18).translate(i * 0.1, 0.103, 0));
    phin.push(new THREE.CylinderGeometry(0.036, 0.03, 0.06, 18, 1, true).translate(i * 0.1, 0.135, 0));
    phin.push(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 18).translate(i * 0.1, 0.172, 0));
    phin.push(new THREE.SphereGeometry(0.008, 8, 6).translate(i * 0.1, 0.182, 0));
    g.add(new THREE.Mesh(merge(phin), m.steel));
  }
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16), new THREE.MeshStandardMaterial({ color: '#e6d6a8', roughness: 0.4, metalness: 0.4 }));
  tin.position.set(0.32, 0.04, 0.02); g.add(tin);
  return g;
}

/* ---------------- the church bell ---------------- */

function bell(m) {
  const g = new THREE.Group();
  // classic bell profile: lip, sound bow, waist, shoulder, crown
  const prof = [[0, 0.46], [0.07, 0.46], [0.12, 0.44], [0.135, 0.38], [0.15, 0.25], [0.2, 0.1], [0.255, 0.02], [0.262, 0.0], [0.24, 0.0], [0.19, 0.08], [0.135, 0.24], [0.12, 0.38], [0.07, 0.43], [0, 0.44]];
  const bronzeBell = new THREE.MeshPhysicalMaterial({ color: '#b58a3c', roughness: 0.28, metalness: 0.95, clearcoat: 0.3, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40), bronzeBell));
  for (const y of [0.05, 0.36]) g.add(new THREE.Mesh(new THREE.TorusGeometry(y < 0.2 ? 0.215 : 0.137, 0.008, 6, 40).rotateX(Math.PI / 2).translate(0, y, 0), bronzeBell));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 16).translate(0, 0.5, 0), bronzeBell));
  const clapper = new THREE.Group();
  clapper.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6).translate(0, -0.15, 0), m.bronze));
  clapper.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10).translate(0, -0.3, 0), m.bronze));
  clapper.position.y = 0.42;
  g.add(clapper);
  g.userData.clapper = clapper;
  return g;
}

/* ---------------- build all three ---------------- */

export function createStalls(signs = {}) {
  const rng = mulberry32(71);
  const m = mats();
  const group = new THREE.Group();
  const colliders = [], interacts = [], tables = [];
  const { prom } = PIER;

  /* ======================= GELATO ======================= */
  const cart = new THREE.Group();
  const CX = prom.x1 - 3.4, CZ = 19.9;
  cart.position.set(CX, Y, CZ);
  group.add(cart);
  const L = 3.0, D = 1.1;
  // front faces -x (toward the walkway); the server stands at +x
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(D, 0.68, L).translate(0, 0.68, 0), m.cream));
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(D + 0.06, 0.08, L + 0.06).translate(0, 0.3, 0), m.teak));
  // gold pinstripes + raised panels on the front
  const stripes = [];
  for (const z of [-1.0, 0, 1.0]) {
    for (const [yy, zz, w, h] of [[0.94, z, 0.86, 0.015], [0.46, z, 0.86, 0.015], [0.7, z - 0.43, 0.015, 0.49], [0.7, z + 0.43, 0.015, 0.49]]) {
      stripes.push(new THREE.BoxGeometry(0.01, h, w).translate(-D / 2 - 0.006, yy, zz));
    }
  }
  cart.add(new THREE.Mesh(merge(stripes), m.brass));
  const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.26), new THREE.MeshBasicMaterial({ map: signTexture([signs.gelato || 'Gelato'], { w: 640, h: 104, bg: '#f1e8d6', fg: '#8a6a2c', border: '#c9a25a', title: 0.6 }), color: '#c8c0b0' }));
  nameBoard.position.set(-D / 2 - 0.01, 0.7, 0);
  nameBoard.rotation.y = -Math.PI / 2;
  cart.add(nameBoard);
  // counter top: steel with eight round pozzetto openings
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(D + 0.1, 0.05, L + 0.1).translate(0, 1.045, 0), m.marble));
  const flavors = Object.keys(FLAVORS);
  const lids = [];
  flavors.forEach((f, i) => {
    const row = i % 2, col = Math.floor(i / 2);
    const px = row ? 0.2 : -0.2, pz = -1.05 + col * 0.7;
    // the well, the gelato inside, the steel rim, and a hinged lid with a brass knob
    cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.3, 24, 1, true).translate(px, 0.92, pz), new THREE.MeshStandardMaterial({ color: '#5a5d60', metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide })));
    const scoopTop = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: FLAVORS[f], roughness: 0.6, emissive: FLAVORS[f], emissiveIntensity: 0.18 }));
    scoopTop.position.set(px, 1.03, pz);
    cart.add(scoopTop);
    cart.add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 28).rotateX(Math.PI / 2).translate(px, 1.075, pz), m.steel));
    const hinge = new THREE.Group();
    hinge.position.set(px + 0.14, 1.08, pz); // hinged on the server's side
    const lid = new THREE.Group();
    lid.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.014, 28).translate(-0.14, 0.007, 0), m.steel));
    lid.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10).translate(-0.14, 0.03, 0), m.brass));
    hinge.add(lid);
    hinge.userData.keep = true;
    cart.add(hinge);
    lids.push({ hinge, open: 0, until: 0 });
    // a small brass plaque with the flavour name, on the front edge
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.06), new THREE.MeshBasicMaterial({ map: signTexture([f], { w: 256, h: 60, bg: '#c9a25a', fg: '#2a1a10', border: null, title: 0.7 }), color: '#bdb5a5' }));
    plaque.rotation.x = -Math.PI / 2;
    plaque.rotation.z = Math.PI / 2;
    plaque.position.set(px - 0.19, 1.072, pz);
    if (row === 0) cart.add(plaque);
  });
  // two big wheels at the ends, a brass push bar
  for (const s of [-1, 1]) {
    const wh = new THREE.Group();
    wh.position.set(0, 0.48, s * (L / 2 + 0.07));
    wh.add(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 8, 36), m.lacquer));
    wh.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.012, 6, 36), m.brass));
    wh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16).rotateX(Math.PI / 2), m.brass));
    const sp = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; rod(V(0, 0, 0), V(Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0), 0.012, sp, 4); }
    wh.add(new THREE.Mesh(merge(sp), m.cream));
    cart.add(wh);
  }
  const bar = [];
  rod(V(0.35, 1.0, L / 2), V(0.35, 1.05, L / 2 + 0.55), 0.02, bar); rod(V(-0.35, 1.0, L / 2), V(-0.35, 1.05, L / 2 + 0.55), 0.02, bar);
  rod(V(-0.37, 1.05, L / 2 + 0.55), V(0.37, 1.05, L / 2 + 0.55), 0.03, bar);
  cart.add(new THREE.Mesh(merge(bar), m.brass));
  // canopy: cream with fine gold stripes, scalloped valance, warm bulbs
  const canTex = canvasTex(256, 64, (g, W, H) => {
    g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d6b46a';
    for (let x = 0; x < W; x += 32) g.fillRect(x, 0, 4, H);
  });
  const canMat = new THREE.MeshStandardMaterial({ map: canTex, side: THREE.DoubleSide, roughness: 0.85 });
  const poles = [];
  for (const [x, z] of [[0.5, -1.45], [0.5, 1.45], [-0.5, -1.45], [-0.5, 1.45]]) rod(V(x, 1.05, z), V(x, 2.55, z), 0.022, poles, 10);
  cart.add(new THREE.Mesh(merge(poles), m.brass));
  for (const s of [-1, 1]) {
    const slope = new THREE.PlaneGeometry(3.4, 0.85);
    slope.rotateX(-Math.PI / 2); slope.rotateY(Math.PI / 2); slope.rotateZ(-s * 0.4);
    slope.translate(s * 0.38, 2.68, 0);
    cart.add(new THREE.Mesh(slope, canMat));
    const sc = [];
    for (let i = 0; i < 16; i++) sc.push(new THREE.CircleGeometry(0.105, 10, Math.PI, Math.PI).rotateY(Math.PI / 2).translate(s * 0.77, 2.53, -1.6 + i * 0.213));
    cart.add(new THREE.Mesh(merge(sc), new THREE.MeshStandardMaterial({ color: '#f4ecdc', side: THREE.DoubleSide, roughness: 0.85 })));
  }
  const cb = [];
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) cb.push(new THREE.SphereGeometry(0.03, 8, 6).translate(s * 0.74, 2.44, -1.45 + i * 0.264));
  cart.add(new THREE.Mesh(merge(cb), m.warm));
  // warm display spots under the canopy, shining on the tubs
  const spots = [];
  for (const z of [-1.0, -0.35, 0.35, 1.0]) spots.push(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12).translate(0, 2.45, z));
  cart.add(new THREE.Mesh(merge(spots), m.warm));
  const warmPool = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.2, 0.08), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  warmPool.position.y = 1.082;
  cart.add(warmPool);
  // cone stack + menu board
  const cones = [];
  for (let i = 0; i < 7; i++) cones.push(new THREE.ConeGeometry(0.035, 0.12, 14, 1, true).rotateX(Math.PI).translate(0.42, 1.14 + i * 0.022, 1.32));
  cart.add(new THREE.Mesh(merge(cones), new THREE.MeshStandardMaterial({ color: '#d4954e', roughness: 0.8, side: THREE.DoubleSide })));
  shadowAll(cart, true, true);
  const menu = new THREE.Group();
  menu.position.set(CX - 1.25, Y, CZ + 2.35);
  menu.rotation.y = -Math.PI / 2 - 0.4;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshBasicMaterial({ map: signTexture(['Gelato', ...flavors], { w: 300, h: 460, bg: '#f4ecdc', fg: '#5a3b22', border: '#c9a25a', title: 0.18 }), color: '#bdb5a5', side: THREE.DoubleSide }));
  board.position.y = 0.95;
  menu.add(board);
  const mf = [];
  rod(V(-0.28, 0, 0.15), V(-0.26, 1.4, -0.02), 0.015, mf); rod(V(0.28, 0, 0.15), V(0.26, 1.4, -0.02), 0.015, mf); rod(V(0, 0, -0.35), V(0, 1.3, -0.04), 0.014, mf);
  menu.add(new THREE.Mesh(merge(mf), m.brass));
  group.add(menu);
  colliders.push({ seg: [CX, CZ - L / 2 - 0.2, CX, CZ + L / 2 + 0.6], r: 0.68 }, { x: menu.position.x, z: menu.position.z, r: 0.3 });
  cart.updateMatrixWorld(true);
  flavors.forEach((f, i) => {
    const row = i % 2, col = Math.floor(i / 2);
    const c = V(row ? 0.2 : -0.2, 1.1, -1.05 + col * 0.7).applyMatrix4(cart.matrixWorld);
    interacts.push({ center: c, radius: 0.15, label: `gelato · ${f}`, food: 'gelato', flavor: f, onPick: () => { lids[i].until = performance.now() + 1800; } });
  });

  // the bell, hung from a carved teak yoke on two posts, beside the cart
  const bellGroup = new THREE.Group();
  const BX = prom.x1 - 6.8, BZ = prom.z1 - 1.3;
  bellGroup.position.set(BX, Y, BZ);
  const yoke = [];
  for (const s of [-1, 1]) {
    yoke.push(new THREE.BoxGeometry(0.16, 2.9, 0.16).translate(0, 1.45, s * 0.6));
    yoke.push(new THREE.BoxGeometry(0.3, 0.1, 0.3).translate(0, 0.05, s * 0.6));
  }
  yoke.push(new THREE.BoxGeometry(0.2, 0.18, 1.6).translate(0, 2.95, 0));
  yoke.push(new THREE.BoxGeometry(0.14, 0.08, 1.85).translate(0, 3.08, 0));
  bellGroup.add(new THREE.Mesh(merge(yoke), m.teak));
  const brackets = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide }));
  brackets.rotation.y = Math.PI / 2;
  brackets.position.set(0, 2.7, 0);
  bellGroup.add(brackets);
  const swing = new THREE.Group(); // pivots at the yoke
  swing.userData.keep = true;
  swing.position.set(0, 2.82, 0);
  const b = bell(m);
  b.position.y = -0.56;
  swing.add(b);
  const rope = [];
  rod(V(0, -0.1, 0.0), V(0.0, -1.55, 0.0), 0.012, rope, 6);
  const ropeMesh = new THREE.Mesh(merge(rope), new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.7 }));
  ropeMesh.position.set(0.3, -0.05, 0);
  swing.add(ropeMesh);
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 10), new THREE.MeshStandardMaterial({ color: '#8a1e22', roughness: 0.8 }));
  tassel.position.set(0.3, -1.7, 0);
  swing.add(tassel);
  bellGroup.add(swing);
  shadowAll(bellGroup);
  group.add(bellGroup);
  colliders.push({ x: BX, z: BZ - 0.6, r: 0.16 }, { x: BX, z: BZ + 0.6, r: 0.16 });
  let swingT = 99, swingAmp = 0;
  const bellCenter = V(BX + 0.15, Y + 1.85, BZ);

  // two marble café tables by the cart
  const marbleTop = new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.15, clearcoat: 0.8 });
  const bistro = (x, z) => {
    const t = new THREE.Group();
    t.position.set(x, Y, z);
    t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.035, 32).translate(0, 0.75, 0), marbleTop));
    const p = [];
    p.push(new THREE.CylinderGeometry(0.035, 0.05, 0.72, 12).translate(0, 0.38, 0));
    p.push(new THREE.CylinderGeometry(0.24, 0.27, 0.03, 24).translate(0, 0.015, 0));
    t.add(new THREE.Mesh(merge(p), m.brass));
    for (const a of [0.5, 0.5 + Math.PI]) {
      const ch = new THREE.Group();
      ch.position.set(Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68);
      ch.rotation.y = -a - Math.PI / 2;
      ch.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.42).translate(0, 0.46, 0), m.cane));
      const fr = [];
      for (const [cx, cz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) rod(V(cx, 0, cz), V(cx * 0.95, 0.46, cz * 0.95), 0.016, fr, 6);
      fr.push(new THREE.TorusGeometry(0.21, 0.016, 6, 16, Math.PI).translate(0, 0.86, 0.22));
      rod(V(-0.2, 0.46, 0.19), V(-0.21, 0.86, 0.22), 0.016, fr, 6); rod(V(0.2, 0.46, 0.19), V(0.21, 0.86, 0.22), 0.016, fr, 6);
      ch.add(new THREE.Mesh(merge(fr), m.brass));
      t.add(ch);
    }
    shadowAll(t);
    group.add(t);
    colliders.push({ x, z, r: 0.42 });
    tables.push(V(x, Y + 0.77, z));
  };
  bistro(prom.x1 - 5.0, 17.2);
  bistro(prom.x1 - 5.3, 21.0);

  /* ======================= JAMU BAR ======================= */
  const jb = new THREE.Group();
  const JX = prom.x1 - 3.6, JZ = 13.4; // counter centre
  jb.position.set(JX, Y, JZ);
  group.add(jb);
  const JL = 4.4;
  // counter: teak front with bronze kawung panels, a marble top
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.02, JL).translate(0, 0.51, 0), m.teak));
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, JL + 0.12).translate(-0.05, 1.05, 0), m.marble));
  const kp = new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
  for (const z of [-1.5, -0.5, 0.5, 1.5]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.6), kp);
    p.rotation.y = -Math.PI / 2;
    p.position.set(-0.315, 0.55, z);
    jb.add(p);
  }
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, JL).translate(-0.33, 0.1, 0), m.brass));
  // back bar: teak shelving with apothecary jars of rhizomes and rows of bottles
  const BBX = 2.8;
  const shelves = [];
  shelves.push(new THREE.BoxGeometry(0.42, 2.4, JL).translate(BBX + 0.12, 1.2, 0));
  for (const y of [0.9, 1.4, 1.9]) shelves.push(new THREE.BoxGeometry(0.42, 0.04, JL - 0.1).translate(BBX - 0.1, y, 0));
  shelves.push(new THREE.BoxGeometry(0.5, 0.9, JL).translate(BBX - 0.05, 0.45, 0));
  shelves.push(new THREE.BoxGeometry(0.56, 0.05, JL + 0.05).translate(BBX - 0.05, 0.92, 0));
  jb.add(new THREE.Mesh(merge(shelves), m.teak));
  const rhizome = { turmeric: '#e88a1a', ginger: '#d8b07a', kencur: '#c9a98a', temulawak: '#d49a2a', tamarind: '#5a2e1a', 'palm sugar': '#7a4a20' };
  const rk = Object.keys(rhizome);
  for (let i = 0; i < 8; i++) {
    const z = -JL / 2 + 0.35 + i * 0.52;
    const jar = new THREE.Group();
    jar.position.set(BBX - 0.12, 1.42, z);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 20, 1, true), m.glass);
    gl.position.y = 0.15; gl.renderOrder = 2;
    jar.add(gl);
    jar.add(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.025, 20).translate(0, 0.31, 0), m.brass));
    const bits = [];
    const col = rhizome[rk[i % rk.length]];
    for (let k = 0; k < 14; k++) bits.push(new THREE.DodecahedronGeometry(0.03, 0).scale(1.6, 0.8, 1).translate((rng() - 0.5) * 0.12, 0.03 + rng() * 0.14, (rng() - 0.5) * 0.12));
    jar.add(new THREE.Mesh(merge(bits), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 })));
    jb.add(jar);
  }
  const kinds = Object.keys(JAMU);
  for (let i = 0; i < 14; i++) {
    const bt = jamuBottle(kinds[i % kinds.length], i % 2 ? 'leaf' : 'cork');
    bt.position.set(BBX - 0.12, 1.92, -JL / 2 + 0.3 + i * 0.3);
    jb.add(bt);
  }
  for (let i = 0; i < 6; i++) {
    const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.12, 0.08], [0.11, 0.16], [0.08, 0.18], [0.085, 0.19]].map(([r, y]) => new THREE.Vector2(r, y)), 20), m.brass);
    pot.position.set(BBX - 0.12, 0.94, -JL / 2 + 0.45 + i * 0.7);
    jb.add(pot);
  }
  // stone lumpang mortar + alu pestle at the end of the counter
  const lump = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.02], [0.2, 0], [0.24, 0.12], [0.22, 0.2], [0.14, 0.2], [0.1, 0.08], [0, 0.07]].map(([r, y]) => new THREE.Vector2(r, y)), 24), new THREE.MeshStandardMaterial({ color: '#5a5650', roughness: 0.95 }));
  lump.position.set(0, 1.08, JL / 2 - 0.3);
  jb.add(lump);
  const alu = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 12), m.teak);
  alu.position.set(0.05, 1.32, JL / 2 - 0.3); alu.rotation.z = 0.5;
  jb.add(alu);
  // four glass dispensers of jamu on the counter, brass taps
  const disp = [];
  kinds.forEach((k, i) => {
    const z = -JL / 2 + 0.55 + i * 0.85;
    const d = new THREE.Group();
    d.position.set(0.05, 1.08, z);
    d.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 24).translate(0, 0.02, 0), m.brass));
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 24, 1, true), m.glass);
    gl.position.y = 0.25; gl.renderOrder = 2;
    d.add(gl);
    d.add(new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.32, 22).translate(0, 0.2, 0), new THREE.MeshStandardMaterial({ color: JAMU[k], roughness: 0.25, emissive: JAMU[k], emissiveIntensity: 0.22, transparent: true, opacity: 0.88 })));
    d.add(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 24).translate(0, 0.47, 0), m.brass));
    const tap = [];
    rod(V(-0.12, 0.08, 0), V(-0.2, 0.08, 0), 0.012, tap); rod(V(-0.2, 0.08, 0), V(-0.2, 0.04, 0), 0.01, tap);
    tap.push(new THREE.BoxGeometry(0.02, 0.06, 0.01).translate(-0.19, 0.12, 0));
    d.add(new THREE.Mesh(merge(tap), m.brass));
    jb.add(d);
    disp.push({ k, local: V(0.05, 1.3, z) });
  });
  // small glasses on a brass tray
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.07, 14, 1, true), m.glass);
    g.position.set(-0.18, 1.115, -0.3 + i * 0.12);
    g.renderOrder = 2;
    jb.add(g);
  }
  // pergola of teak slats with brass pendants, and the sign
  const perg = [];
  for (const [x, z] of [[-0.9, -JL / 2 - 0.2], [-0.9, JL / 2 + 0.2], [BBX + 0.3, -JL / 2 - 0.2], [BBX + 0.3, JL / 2 + 0.2]]) perg.push(new THREE.BoxGeometry(0.14, 2.9, 0.14).translate(x, 1.45, z));
  for (const z of [-JL / 2 - 0.2, JL / 2 + 0.2]) perg.push(new THREE.BoxGeometry(BBX + 1.4, 0.16, 0.12).translate((BBX - 0.6) / 2, 2.95, z));
  for (let x = -0.9; x <= BBX + 0.3; x += 0.3) perg.push(new THREE.BoxGeometry(0.06, 0.1, JL + 0.6).translate(x, 3.06, 0));
  jb.add(new THREE.Mesh(merge(perg), m.teak));
  for (const z of [-1.3, 0, 1.3]) {
    const pd = new THREE.Group();
    pd.position.set(0.0, 2.2, z);
    pd.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c9a25a', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })));
    pd.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8).translate(0, 0.02, 0), m.warm));
    pd.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4).translate(0, 0.5, 0), m.brass));
    jb.add(pd);
  }
  const jsign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.42), new THREE.MeshBasicMaterial({ map: signTexture([signs.jamu || 'Jamu', 'kunyit asam · beras kencur · sinom · temulawak'], { w: 640, h: 170, bg: '#2a1a12', fg: '#e8c98a' }), color: '#cfc5b2' }));
  jsign.rotation.y = -Math.PI / 2;
  jsign.position.set(-0.92, 2.55, 0);
  jb.add(jsign);
  // bar stools: teak + leather
  for (let i = 0; i < 4; i++) {
    const st = new THREE.Group();
    st.position.set(-0.85, 0, -1.5 + i * 1.0);
    st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 20).translate(0, 0.76, 0), new THREE.MeshStandardMaterial({ color: '#4a2f22', roughness: 0.6 })));
    const lg = [];
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; rod(V(Math.cos(a) * 0.12, 0.72, Math.sin(a) * 0.12), V(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2), 0.018, lg, 6); }
    lg.push(new THREE.TorusGeometry(0.16, 0.01, 6, 20).rotateX(Math.PI / 2).translate(0, 0.3, 0));
    st.add(new THREE.Mesh(merge(lg), m.teak));
    jb.add(st);
  }
  shadowAll(jb, true, true);
  jb.updateMatrixWorld(true);
  for (const d of disp) {
    interacts.push({ center: d.local.clone().applyMatrix4(jb.matrixWorld), radius: 0.16, label: `jamu · ${d.k}`, food: 'jamu', flavor: d.k });
  }
  colliders.push({ seg: [JX, JZ - JL / 2, JX, JZ + JL / 2], r: 0.4 });
  colliders.push({ seg: [JX + BBX, JZ - JL / 2, JX + BBX, JZ + JL / 2], r: 0.35 });
  for (const [x, z] of [[-0.9, -JL / 2 - 0.2], [-0.9, JL / 2 + 0.2]]) colliders.push({ x: JX + x, z: JZ + z, r: 0.14 });
  tables.push(V(JX - 0.2, Y + 1.08, JZ + 0.9));

  /* ======================= REVA MAIA'S NHÀ VIỆT ======================= */
  const nv = new THREE.Group();
  group.add(nv);
  const x0 = prom.x0 + 0.4, x1 = x0 + 6.4, z0 = prom.z0 + 0.7, z1 = prom.z1 - 0.9;
  const zm = (z0 + z1) / 2;
  // posts + roof
  const posts = [];
  for (const x of [x0, x1]) for (const z of [z0, zm, z1]) {
    posts.push(new THREE.BoxGeometry(0.2, 3.0, 0.2).translate(x, Y + 1.5, z));
    posts.push(new THREE.BoxGeometry(0.32, 0.14, 0.32).translate(x, Y + 0.07, z));
    colliders.push({ x, z, r: 0.18 });
  }
  for (const z of [z0, zm, z1]) beam(V(x0, Y + 3.0, z), V(x1, Y + 3.0, z), 0.18, posts);
  for (const x of [x0, x1]) beam(V(x, Y + 3.0, z0), V(x, Y + 3.0, z1), 0.18, posts);
  nv.add(new THREE.Mesh(merge(posts), m.lacquer));
  const tile = new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.75, side: THREE.DoubleSide });
  const ov = 0.6, ridgeY = Y + 4.25, eaveY = Y + 2.95;
  const xm = (x0 + x1) / 2;
  const roofG = [];
  const quadG = (a, b, c, d) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray()], 3));
    const w = a.distanceTo(b) / 2, h = a.distanceTo(d) / 2;
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, w, 0, w, h, 0, 0, w, h, 0, h], 2));
    g.computeVertexNormals();
    return g;
  };
  // hip roof with the ridge along z
  roofG.push(quadG(V(x0 - ov, eaveY, z1 + ov), V(x0 - ov, eaveY, z0 - ov), V(xm, ridgeY, z0 + 1.2), V(xm, ridgeY, z1 - 1.2)));
  roofG.push(quadG(V(x1 + ov, eaveY, z0 - ov), V(x1 + ov, eaveY, z1 + ov), V(xm, ridgeY, z1 - 1.2), V(xm, ridgeY, z0 + 1.2)));
  const tri = (a, b, c) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a.toArray(), ...b.toArray(), ...c.toArray()], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 3, 0, 1.5, 1.5], 2)); g.computeVertexNormals(); return g; };
  roofG.push(tri(V(x0 - ov, eaveY, z0 - ov), V(x1 + ov, eaveY, z0 - ov), V(xm, ridgeY, z0 + 1.2)));
  roofG.push(tri(V(x1 + ov, eaveY, z1 + ov), V(x0 - ov, eaveY, z1 + ov), V(xm, ridgeY, z1 - 1.2)));
  const roof = new THREE.Mesh(merge(roofG), tile);
  roof.castShadow = true;
  nv.add(roof);
  const ridge = [];
  beam(V(xm, ridgeY + 0.06, z0 + 1.0), V(xm, ridgeY + 0.06, z1 - 1.0), 0.14, ridge);
  // gently upturned ridge ends
  for (const s of [-1, 1]) {
    const zE = s < 0 ? z0 + 1.0 : z1 - 1.0;
    ridge.push(new THREE.ConeGeometry(0.08, 0.5, 8).rotateX(s * -1.1).translate(xm, ridgeY + 0.22, zE + s * 0.15));
    for (const [cx, cz] of [[x0 - ov, s < 0 ? z0 - ov : z1 + ov], [x1 + ov, s < 0 ? z0 - ov : z1 + ov]]) {
      ridge.push(new THREE.ConeGeometry(0.05, 0.36, 6).rotateZ(cx < xm ? 0.9 : -0.9).translate(cx, eaveY + 0.14, cz));
    }
  }
  nv.add(new THREE.Mesh(merge(ridge), new THREE.MeshStandardMaterial({ color: '#2a1d18', roughness: 0.6 })));
  // a lattice frieze under the eaves
  const lat = new THREE.MeshStandardMaterial({ map: latticeTexture(), color: '#3a1d12', alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
  const frieze = [];
  for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x1, z0, x1, zm], [x1, zm, x1, z1], [x0, z0, x0, z1]]) {
    const len = Math.hypot(bx - ax, bz - az);
    const p = new THREE.PlaneGeometry(len - 0.2, 0.42);
    p.rotateY(Math.atan2(-(bz - az), bx - ax));
    p.translate((ax + bx) / 2, Y + 2.68, (az + bz) / 2);
    frieze.push(p);
  }
  nv.add(new THREE.Mesh(merge(frieze), lat));
  // back wall: lattice screens over a lacquered panel, with shelves of blue-and-white ceramics
  const wallX = x0 + 0.15;
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, z1 - z0 - 0.3).translate(wallX - 0.05, Y + 1.25, zm), m.lacquer));
  const screenP = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0 - 0.6, 1.0), lat);
  screenP.rotation.y = Math.PI / 2;
  screenP.position.set(wallX + 0.0, Y + 2.0, zm);
  nv.add(screenP);
  const shelfG = [];
  for (const y of [1.1, 1.5]) shelfG.push(new THREE.BoxGeometry(0.3, 0.04, z1 - z0 - 1.2).translate(wallX + 0.15, Y + y, zm));
  nv.add(new THREE.Mesh(merge(shelfG), m.teak));
  const bw = new THREE.MeshPhysicalMaterial({ map: blueWhiteTexture(), roughness: 0.2, clearcoat: 0.8 });
  for (let i = 0; i < 16; i++) {
    const y = i % 2 ? 1.12 : 1.52;
    const z = z0 + 1.0 + Math.floor(i / 2) * ((z1 - z0 - 2) / 8);
    const tall = (i * 7) % 3 === 0;
    const prof = tall ? [[0, 0], [0.05, 0], [0.08, 0.08], [0.07, 0.2], [0.035, 0.26], [0.04, 0.28]] : [[0, 0], [0.04, 0], [0.09, 0.05], [0.1, 0.07], [0.095, 0.07], [0.035, 0.008], [0, 0.008]];
    const v = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), 20), bw);
    v.position.set(wallX + 0.15, Y + y + 0.02, z);
    nv.add(v);
  }
  // the counter: marble top on a lacquered base with a brass line
  const czm = (z0 + z1) / 2, cX = x0 + 2.2, cz0 = czm - 2.3, cz1 = czm + 2.3, cL = cz1 - cz0;
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.98, cL).translate(cX, Y + 0.49, czm), m.lacquer));
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, cL + 0.12).translate(cX + 0.05, Y + 1.01, czm), m.marble));
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, cL).translate(cX + 0.36, Y + 0.85, czm), m.brass));
  // back counter with the stock pot, bamboo steamers and bowls
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, cL).translate(wallX + 0.42, Y + 0.45, czm), m.lacquer));
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, cL + 0.04).translate(wallX + 0.42, Y + 0.92, czm), m.marble));
  const potZ = cz0 + 0.6;
  nv.add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.4, 28, 1, true).translate(wallX + 0.42, Y + 1.15, potZ), new THREE.MeshStandardMaterial({ color: '#b9bdc2', metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide })));
  nv.add(new THREE.Mesh(new THREE.CircleGeometry(0.22, 24).rotateX(-Math.PI / 2).translate(wallX + 0.42, Y + 1.3, potZ), new THREE.MeshStandardMaterial({ color: '#8a5a24', roughness: 0.12 })));
  const steamer = [];
  for (let i = 0; i < 4; i++) steamer.push(new THREE.CylinderGeometry(0.17, 0.17, 0.09, 20).translate(wallX + 0.42, Y + 0.99 + i * 0.09, potZ + 0.65));
  steamer.push(new THREE.ConeGeometry(0.17, 0.08, 20).translate(wallX + 0.42, Y + 1.39, potZ + 0.65));
  nv.add(new THREE.Mesh(merge(steamer), new THREE.MeshStandardMaterial({ map: caneTexture(), color: '#d8b880', roughness: 0.85 })));
  for (let i = 0; i < 6; i++) nv.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.07, 20, 1, true).translate(wallX + 0.42, Y + 0.98 + i * 0.03, potZ + 1.25), new THREE.MeshPhysicalMaterial({ map: blueWhiteTexture(), roughness: 0.2, side: THREE.DoubleSide })));
  // the display on the counter
  const top = Y + 1.04;
  const showPho = phoBowl();
  showPho.position.set(cX + 0.12, top, czm - 0.9);
  nv.add(showPho);
  const showRolls = springRollPlate();
  showRolls.position.set(cX + 0.12, top, czm - 0.25);
  showRolls.rotation.y = -0.4;
  nv.add(showRolls);
  const bm = banhMiBoard(m);
  bm.position.set(cX + 0.1, top + 0.012, czm + 0.4);
  bm.rotation.y = 0.2;
  nv.add(bm);
  const bc = bunCha();
  bc.position.set(cX + 0.12, top, czm + 1.05);
  nv.add(bc);
  const ch = cheGlasses(m);
  ch.position.set(cX + 0.05, top, czm + 1.7);
  ch.rotation.y = Math.PI / 2;
  nv.add(ch);
  const phin = phinStation(m);
  phin.position.set(cX + 0.05, top, cz0 + 0.25);
  phin.rotation.y = Math.PI / 2;
  nv.add(phin);
  // herbs, limes, sauces, chopsticks
  const herb = [];
  for (let i = 0; i < 40; i++) herb.push(new THREE.CircleGeometry(0.025, 5).rotateX(-Math.PI / 2 + (rng() - 0.5)).rotateY(rng() * 6).translate((rng() - 0.5) * 0.24, 0.04 + rng() * 0.06, (rng() - 0.5) * 0.24));
  const herbs = new THREE.Group();
  herbs.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 20, 1, true), new THREE.MeshStandardMaterial({ map: caneTexture(), side: THREE.DoubleSide })));
  herbs.add(new THREE.Mesh(merge(herb), new THREE.MeshStandardMaterial({ color: '#3c7d32', side: THREE.DoubleSide })));
  herbs.position.set(cX - 0.15, top + 0.04, czm - 1.55);
  nv.add(herbs);
  const limes = [];
  for (let i = 0; i < 8; i++) limes.push(new THREE.SphereGeometry(0.03, 10, 8).translate((rng() - 0.5) * 0.12, 0.04, (rng() - 0.5) * 0.12));
  const lb = new THREE.Group();
  lb.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.05, 20, 1, true), bw));
  lb.add(new THREE.Mesh(merge(limes), new THREE.MeshStandardMaterial({ color: '#7ab03a', roughness: 0.5 })));
  lb.position.set(cX - 0.18, top + 0.02, czm + 0.05);
  nv.add(lb);
  for (const [c, dz] of [['#c41e1e', 0], ['#5a2a12', 0.08], ['#a8742a', 0.16], ['#2a1a10', 0.24]]) {
    const btl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.16, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }));
    btl.position.set(cX - 0.2, top + 0.08, czm + 0.6 + dz);
    nv.add(btl);
  }
  // name sign under the front eave + a smaller one over the counter
  const nameMat = new THREE.MeshBasicMaterial({ map: signTexture([signs.boutique || 'Reva Maia’s Nhà Việt'], { w: 900, h: 160, bg: '#2a140d', fg: '#e3c06e', border: '#c9a25a', title: 0.42 }), color: '#d8cfbd' });
  const nsign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.64), nameMat);
  nsign.rotation.y = Math.PI / 2;
  nsign.position.set(x1 + 0.04, Y + 2.62, zm);
  nv.add(nsign);
  const menuBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ map: signTexture(['Thực Đơn', 'Phở Bò · Gỏi Cuốn · Bánh Mì', 'Bún Chả · Chè · Cà Phê Phin'], { w: 520, h: 300, bg: '#2a140d', fg: '#efe2c4', border: '#c9a25a', title: 0.22 }), color: '#cfc6b4' }));
  menuBoard.rotation.y = Math.PI / 2;
  menuBoard.position.set(wallX + 0.03, Y + 2.0, czm + 1.6);
  nv.add(menuBoard);
  // silk lanterns along the front eave, rattan pendants over the tables
  const lanternCols = ['#d42a2a', '#f2b632', '#d63c8c', '#f07a2a', '#2a9a8c', '#7a3cb0', '#d42a2a', '#f2b632', '#d63c8c'];
  const silk = [];
  lanternCols.forEach((c, i) => {
    const l = silkLantern(c);
    l.scale.setScalar(0.9);
    l.position.set(x1 + 0.25, Y + 2.05 - (i % 3) * 0.06, z0 + 0.5 + i * ((z1 - z0 - 1) / 8));
    l.rotation.z = Math.sin(i * 1.3) * 0.04; // a slight, frozen tilt (baked)
    nv.add(l);
    silk.push(l);
  });
  // dining: teak tables with marble tops and cane chairs, an upholstered banquette
  const diningX = x1 - 1.3;
  const dTable = (z) => {
    const t = new THREE.Group();
    t.position.set(diningX, Y, z);
    t.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 1.3).translate(0, 0.76, 0), m.marble));
    t.add(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 1.32).translate(0, 0.72, 0), m.lacquer));
    const lg = [];
    for (const [x, zz] of [[-0.38, -0.58], [0.38, -0.58], [-0.38, 0.58], [0.38, 0.58]]) lg.push(new THREE.BoxGeometry(0.06, 0.7, 0.06).translate(x, 0.35, zz));
    t.add(new THREE.Mesh(merge(lg), m.lacquer));
    for (const [cx, cz, ry] of [[-0.7, -0.32, -Math.PI / 2], [-0.7, 0.32, -Math.PI / 2], [0.7, -0.32, Math.PI / 2], [0.7, 0.32, Math.PI / 2]]) {
      const c = new THREE.Group();
      c.position.set(cx, 0, cz);
      c.rotation.y = ry;
      c.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44).translate(0, 0.46, 0), m.cane));
      const fr = [];
      for (const [a, b] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) fr.push(new THREE.BoxGeometry(0.035, 0.46, 0.035).translate(a, 0.23, b));
      for (const a of [-0.21, 0.21]) fr.push(new THREE.BoxGeometry(0.035, 0.46, 0.035).translate(a, 0.69, 0.2));
      fr.push(new THREE.BoxGeometry(0.46, 0.05, 0.035).translate(0, 0.92, 0.2));
      c.add(new THREE.Mesh(merge(fr), m.lacquer));
      const back = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.38), m.cane);
      back.position.set(0, 0.7, 0.2);
      c.add(back);
      t.add(c);
    }
    const o = orchid(rng, 0.85, '#f6e7ee');
    o.position.set(0, 0.78, -0.35);
    t.add(o);
    // a little caddy: chopsticks, sriracha, hoisin, fish sauce, napkins
    const caddy = new THREE.Group();
    caddy.position.set(0.05, 0.78, 0.25);
    caddy.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.14), m.lacquer));
    const cs = [];
    for (let k = 0; k < 10; k++) cs.push(new THREE.CylinderGeometry(0.003, 0.004, 0.22, 4).translate(-0.09 + (k % 3) * 0.008, 0.11, -0.02 + Math.floor(k / 3) * 0.008));
    caddy.add(new THREE.Mesh(merge(cs), new THREE.MeshStandardMaterial({ color: '#c99b62' })));
    [['#c41e1e', 0.0], ['#5a2a12', 0.05], ['#a8742a', 0.1]].forEach(([c, x]) => {
      caddy.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.12, 10).translate(x, 0.075, 0), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })));
    });
    caddy.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.1).translate(-0.12, 0.045, 0.0), new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.9 })));
    t.add(caddy);
    shadowAll(t);
    nv.add(t);
    colliders.push({ x: diningX, z, r: 0.95 });
    tables.push(V(diningX + 0.2, Y + 0.78, z + 0.35));
    const p = rattanPendant(m.cane, m.warm);
    p.position.set(diningX, Y + 2.1, z);
    nv.add(p);
  };
  dTable(z0 + 1.6);
  dTable(zm);
  dTable(z1 - 1.6);
  // banquette along the lake-side edge
  const banq = new THREE.Group();
  banq.position.set(x0 + 3.8, Y, z0 + 0.15);
  banq.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.55).translate(0, 0.21, 0.27), m.lacquer));
  banq.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.52).translate(0, 0.49, 0.27), new THREE.MeshStandardMaterial({ color: '#eadfc8', roughness: 0.9 })));
  banq.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.14).translate(0, 0.72, 0.03), new THREE.MeshStandardMaterial({ color: '#eadfc8', roughness: 0.9 })));
  for (let i = 0; i < 3; i++) {
    const cu = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.12), new THREE.MeshStandardMaterial({ color: ['#2a7a72', '#c9a25a', '#2a7a72'][i], roughness: 0.9 }));
    cu.position.set(-0.85 + i * 0.85, 0.74, 0.14); cu.rotation.x = 0.15;
    banq.add(cu);
  }
  nv.add(banq);
  colliders.push({ seg: [x0 + 2.5, z0 + 0.4, x0 + 5.1, z0 + 0.4], r: 0.35 });
  // bamboo in tall planters at the front corners
  for (const z of [z0 + 0.1, z1 - 0.1]) {
    const pl = new THREE.Group();
    pl.position.set(x1 + 0.1, Y, z);
    pl.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.7, 16).translate(0, 0.35, 0), m.lacquer));
    const culms = [];
    for (let i = 0; i < 7; i++) rod(V((rng() - 0.5) * 0.3, 0.6, (rng() - 0.5) * 0.3), V((rng() - 0.5) * 0.6, 2.6 + rng() * 0.6, (rng() - 0.5) * 0.6), 0.025, culms, 6);
    pl.add(new THREE.Mesh(merge(culms), new THREE.MeshStandardMaterial({ color: '#7a9a3a', roughness: 0.5 })));
    const lv = [];
    for (let i = 0; i < 60; i++) lv.push(new THREE.PlaneGeometry(0.03, 0.18).rotateZ(rng() * 6).rotateY(rng() * 6).translate((rng() - 0.5) * 0.8, 1.6 + rng() * 1.5, (rng() - 0.5) * 0.8));
    pl.add(new THREE.Mesh(merge(lv), new THREE.MeshStandardMaterial({ color: '#4f8a3a', side: THREE.DoubleSide, roughness: 0.6 })));
    nv.add(pl);
    colliders.push({ x: x1 + 0.1, z, r: 0.3 });
  }
  // colliders around the counter + kitchen
  colliders.push({ seg: [cX, cz0, cX, cz1], r: 0.42 });
  colliders.push({ seg: [wallX + 0.3, z0 + 0.3, wallX + 0.3, z1 - 0.3], r: 0.42 });
  shadowAll(nv, true, true);
  nv.updateMatrixWorld(true);
  interacts.push({ center: V(cX + 0.12, top + 0.08, czm - 0.9), radius: 0.17, label: 'phở', food: 'pho' });
  interacts.push({ center: V(cX + 0.12, top + 0.05, czm - 0.25), radius: 0.17, label: 'spring rolls', food: 'rolls' });
  tables.push(V(cX + 0.2, top, czm + 2.3));

  // steam from the stock pot
  const steamTex = canvasTex(64, 64, (g, W) => {
    const grd = g.createRadialGradient(W / 2, W / 2, 2, W / 2, W / 2, W / 2);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, W);
  }, { srgb: false });
  const steam = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
    s.userData.ph = i / 10;
    nv.add(s);
    steam.push(s);
  }

  // one warm light hung high over the promenade lights all three stall fronts
  const promLight = new THREE.PointLight('#ffc27a', 34, 19, 2);
  promLight.position.set(PIER.x, Y + 4.6, (prom.z0 + prom.z1) / 2);
  group.add(promLight);

  return {
    group, colliders, interacts, tables, light: promLight,
    bell: {
      center: bellCenter, radius: 0.6, reach: 3.4, label: 'ring the bell',
      ring() { swingT = 0; swingAmp = 0.55; },
    },
    update(t, dt) {
      // pozzetto lids lift while she's being served
      const now = performance.now();
      for (const l of lids) {
        const target = now < l.until ? 1 : 0;
        l.open += (target - l.open) * Math.min(1, dt * 6);
        l.hinge.rotation.z = -l.open * 1.2;
      }
      // the bell swings, the clapper lags behind
      swingT += dt;
      const sw = swingAmp * Math.exp(-swingT * 0.45) * Math.sin(swingT * 2.4);
      swing.rotation.z = sw; // the axle runs along the yoke (z), so it swings in x
      b.userData.clapper.rotation.z = -sw * 0.6 + Math.sin(swingT * 3.1) * swingAmp * 0.15 * Math.exp(-swingT * 0.6);
      steam.forEach((s) => {
        const k = (t * 0.22 + s.userData.ph) % 1;
        s.position.set(wallX + 0.42 + Math.sin(t + s.userData.ph * 7) * 0.05, Y + 1.36 + k * 0.8, potZ + Math.cos(t * 0.6 + s.userData.ph * 4) * 0.05);
        s.scale.setScalar(0.12 + k * 0.4);
        s.material.opacity = Math.sin(Math.PI * k) * 0.14;
      });
    },
  };
}
