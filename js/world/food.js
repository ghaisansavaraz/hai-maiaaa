/* Food she can get on the pier: a bowl of phở and fresh spring rolls from the
   Vietnamese boutique, and gelato (pick a flavor) from the Victorian cart.
   The models are also used for the counter displays. Whatever she's holding
   sits in the lower right of her view, bobs as she walks, gets smaller with
   every bite, and can be set down on a table. Purely for fun. */

import * as THREE from 'three';
import { mulberry32, cloudTexture } from './util.js';
import { merge } from './props.js';

export const FLAVORS = {
  pistachio: '#a3bf78',
  strawberry: '#f09aaa',
  chocolate: '#6a3c27',
  vanilla: '#f2e6c4',
  mango: '#f5b043',
  hazelnut: '#b48655',
  pandan: '#8fbf6a',
  kopi: '#7a4e33',
};

/* ---------------- shared materials / textures ---------------- */

const ceramicWhite = () => new THREE.MeshPhysicalMaterial({ color: '#f7f5f0', roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 });

function waffleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d4954e'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#a8662e'; g.lineWidth = 5;
  for (let i = -128; i < 256; i += 22) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  g.fillStyle = 'rgba(255,230,180,0.25)';
  for (let i = 0; i < 60; i++) g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.5);
  return t;
}
let waffleTex = null;
let steamTex = null;

/* ---------------- gelato ---------------- */

/** A rounded, ridged scoop (as from a spade), ~8 cm across. */
export function scoopGeometry(r = 0.042, seed = 1) {
  const g = new THREE.SphereGeometry(r, 28, 18);
  const p = g.attributes.position;
  const rng = mulberry32(seed);
  const ph = rng() * 6.28;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const az = Math.atan2(z, x);
    const k = 1 + Math.sin(az * 7 + y * 60 + ph) * 0.045 + Math.sin(az * 3 - y * 30) * 0.03;
    let ny = y;
    if (y < -r * 0.25) ny = -r * 0.25 + (y + r * 0.25) * 0.35; // flattened where it sits in the cone
    p.setXYZ(i, x * k, ny, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export function gelatoCone(flavor) {
  const group = new THREE.Group();
  waffleTex = waffleTex || waffleTexture();
  const coneMat = new THREE.MeshStandardMaterial({ map: waffleTex, roughness: 0.75 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.13, 24, 1, true).rotateX(Math.PI), coneMat);
  cone.position.y = -0.065;
  group.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 6, 24).rotateX(Math.PI / 2), coneMat);
  group.add(rim);
  const scoopMat = new THREE.MeshStandardMaterial({ color: FLAVORS[flavor] || '#f2e6c4', roughness: 0.55 });
  const scoop = new THREE.Mesh(scoopGeometry(0.044, flavor.length), scoopMat);
  scoop.position.y = 0.022;
  group.add(scoop);
  // a little rolled wafer stuck in at an angle
  const wafer = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 10), new THREE.MeshStandardMaterial({ color: '#e7c27c', roughness: 0.6 }));
  wafer.position.set(0.018, 0.06, -0.01);
  wafer.rotation.set(0.3, 0, -0.45);
  group.add(wafer);
  group.userData.bites = [scoop, wafer, cone];
  return group;
}

/** Display tub for the cart's freezer: steel pan with a wavy mound. */
export function gelatoTub(flavor, glow = 0) {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 0.85, roughness: 0.3 });
  const pan = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.12), steel);
  pan.position.y = 0.03;
  g.add(pan);
  const mound = new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = mound.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const wave = Math.sin(x * 70 + z * 30) * 0.006 + Math.sin(z * 55 - x * 20) * 0.005;
    p.setXYZ(i, x * 0.82, y * 0.55 + wave, z * 0.56);
  }
  mound.computeVertexNormals();
  const m = new THREE.Mesh(mound, new THREE.MeshStandardMaterial({ color: FLAVORS[flavor], roughness: 0.55, emissive: FLAVORS[flavor], emissiveIntensity: glow }));
  m.position.y = 0.055;
  g.add(m);
  return g;
}

/* ---------------- phở ---------------- */

function latheColored(pts, segs, colorAt) {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    colorAt(p.getY(i), c);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

export function phoBowl() {
  const group = new THREE.Group();
  const rng = mulberry32(9);
  const white = new THREE.Color('#f7f5f0'), blue = new THREE.Color('#2c4f92');
  // bowl: foot ring, flaring wall, rolled rim; a blue band under the rim
  const bowlGeo = latheColored([
    [0.0, 0.0], [0.04, 0.0], [0.042, 0.006], [0.045, 0.01], [0.08, 0.03], [0.105, 0.062], [0.118, 0.085],
    [0.121, 0.088], [0.117, 0.088], [0.102, 0.064], [0.075, 0.034], [0.0, 0.016],
  ], 40, (y, c) => c.copy(y > 0.068 && y < 0.08 ? blue : white));
  const bowl = new THREE.Mesh(bowlGeo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.2, clearcoat: 0.8, side: THREE.DoubleSide }));
  group.add(bowl);
  // the broth: amber, glossy, with little fat droplets
  const brothMat = new THREE.MeshPhysicalMaterial({ color: '#a7742f', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.92 });
  const broth = new THREE.Mesh(new THREE.CircleGeometry(0.103, 32).rotateX(-Math.PI / 2), brothMat);
  broth.position.y = 0.064;
  group.add(broth);
  const drops = [];
  for (let i = 0; i < 26; i++) {
    const a = rng() * 6.28, r = Math.sqrt(rng()) * 0.09;
    drops.push(new THREE.CircleGeometry(0.003 + rng() * 0.005, 8).rotateX(-Math.PI / 2).translate(Math.cos(a) * r, 0.0005, Math.sin(a) * r));
  }
  const dropMesh = new THREE.Mesh(merge(drops), new THREE.MeshStandardMaterial({ color: '#e0b25a', roughness: 0.1, transparent: true, opacity: 0.6 }));
  dropMesh.position.y = 0.0006;
  broth.add(dropMesh);
  // rice noodles: soft loops on the surface
  const noodles = [];
  for (let i = 0; i < 14; i++) {
    const pts = [];
    let x = (rng() - 0.5) * 0.08, z = (rng() - 0.5) * 0.08, a = rng() * 6.28;
    for (let k = 0; k < 6; k++) {
      pts.push(new THREE.Vector3(x, 0.062 + Math.sin(k * 1.3 + i) * 0.004 + 0.002, z));
      a += (rng() - 0.5) * 1.6;
      x = THREE.MathUtils.clamp(x + Math.cos(a) * 0.022, -0.085, 0.085);
      z = THREE.MathUtils.clamp(z + Math.sin(a) * 0.022, -0.085, 0.085);
    }
    noodles.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0028, 5));
  }
  const noodleMesh = new THREE.Mesh(merge(noodles), new THREE.MeshStandardMaterial({ color: '#f1ebdc', roughness: 0.45 }));
  group.add(noodleMesh);
  // thin beef slices fanned on one side
  const beef = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.CylinderGeometry(0.026, 0.026, 0.003, 14);
    s.scale(1.25, 1, 0.8);
    s.rotateZ(0.12 * (rng() - 0.5));
    s.rotateY(-0.5 + i * 0.25);
    s.translate(0.03 + i * 0.006, 0.07 + i * 0.002, -0.035 + i * 0.012);
    beef.push(s);
  }
  const beefMesh = new THREE.Mesh(merge(beef), new THREE.MeshStandardMaterial({ color: '#7d4636', roughness: 0.6 }));
  group.add(beefMesh);
  // herbs: basil, cilantro, spring onion rings, bean sprouts, chili, lime
  const herbs = [];
  const leaf = (len, w) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.quadraticCurveTo(w, len * 0.4, 0, len); sh.quadraticCurveTo(-w, len * 0.4, 0, 0);
    return new THREE.ShapeGeometry(sh, 6);
  };
  for (let i = 0; i < 7; i++) {
    const l = leaf(0.035, 0.014);
    l.rotateX(-Math.PI / 2 + 0.2); l.rotateY(rng() * 6.28);
    l.translate(-0.04 + (rng() - 0.5) * 0.04, 0.072, 0.02 + (rng() - 0.5) * 0.05);
    herbs.push(l);
  }
  for (let i = 0; i < 9; i++) {
    const l = new THREE.CircleGeometry(0.008, 5);
    l.rotateX(-Math.PI / 2 + (rng() - 0.5) * 0.4);
    l.translate((rng() - 0.5) * 0.12, 0.072, (rng() - 0.5) * 0.12);
    herbs.push(l);
  }
  const herbMesh = new THREE.Mesh(merge(herbs), new THREE.MeshStandardMaterial({ color: '#2f6e2c', roughness: 0.6, side: THREE.DoubleSide }));
  group.add(herbMesh);
  const rings = [];
  for (let i = 0; i < 12; i++) {
    rings.push(new THREE.TorusGeometry(0.0045, 0.0013, 4, 10).rotateX(Math.PI / 2).translate((rng() - 0.5) * 0.13, 0.068, (rng() - 0.5) * 0.13));
  }
  const onion = new THREE.Mesh(merge(rings), new THREE.MeshStandardMaterial({ color: '#8cbf5a', roughness: 0.5 }));
  group.add(onion);
  const sprouts = [];
  for (let i = 0; i < 10; i++) {
    const a = rng() * 6.28;
    const pts = [0, 1, 2, 3].map((k) => new THREE.Vector3(-0.05 + Math.cos(a) * k * 0.012, 0.07 + k * 0.002, 0.05 + Math.sin(a) * k * 0.012 + Math.sin(k) * 0.004));
    sprouts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.0018, 4));
  }
  group.add(new THREE.Mesh(merge(sprouts), new THREE.MeshStandardMaterial({ color: '#f3f0dc', roughness: 0.5 })));
  const chili = [];
  for (let i = 0; i < 5; i++) chili.push(new THREE.TorusGeometry(0.0055, 0.002, 4, 10).rotateX(Math.PI / 2).translate(0.03 + (rng() - 0.5) * 0.05, 0.071, 0.045 + (rng() - 0.5) * 0.03));
  group.add(new THREE.Mesh(merge(chili), new THREE.MeshStandardMaterial({ color: '#d0202a', roughness: 0.4 })));
  const lime = new THREE.Group();
  lime.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12, 1, false, 0, 1.4), new THREE.MeshStandardMaterial({ color: '#4f9a2f', roughness: 0.4 })));
  lime.rotation.set(Math.PI / 2, 0.2, 0.4);
  lime.position.set(-0.075, 0.075, -0.045);
  group.add(lime);
  // chopsticks resting across the rim
  const sticks = new THREE.Group();
  for (const o of [-0.007, 0.007]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0035, 0.24, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c99b62', roughness: 0.6 }));
    s.position.z = o;
    sticks.add(s);
  }
  sticks.position.set(0.02, 0.092, 0.05);
  sticks.rotation.y = 0.45;
  group.add(sticks);
  // steam
  const steam = [];
  steamTex = steamTex || cloudTexture(64);
  const steamMat = new THREE.SpriteMaterial({ map: steamTex, color: '#ffffff', transparent: true, opacity: 0.0, depthWrite: false });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(steamMat.clone());
    s.userData.ph = i / 6;
    s.userData.ox = (rng() - 0.5) * 0.06;
    group.add(s);
    steam.push(s);
  }
  group.userData.steam = steam;
  group.userData.broth = broth;
  group.userData.bites = [noodleMesh, beefMesh, herbMesh, onion];
  return group;
}

/* ---------------- fresh spring rolls (gỏi cuốn) ---------------- */

export function springRollPlate() {
  const group = new THREE.Group();
  const rng = mulberry32(14);
  const plate = new THREE.Mesh(new THREE.LatheGeometry([
    [0, 0], [0.07, 0], [0.075, 0.004], [0.13, 0.012], [0.135, 0.016], [0.128, 0.016], [0.07, 0.008], [0, 0.008],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 40), ceramicWhite());
  plate.scale.set(1.15, 1, 0.85);
  group.add(plate);
  const paper = new THREE.MeshPhysicalMaterial({
    color: '#f4efe4', roughness: 0.35, transparent: true, opacity: 0.55, clearcoat: 0.6, depthWrite: false,
  });
  const shrimpMat = new THREE.MeshStandardMaterial({ color: '#ff9b78', roughness: 0.45, emissive: '#ff8a64', emissiveIntensity: 0.25 });
  const greenMat = new THREE.MeshStandardMaterial({ color: '#4f8f3a', roughness: 0.6 });
  const noodleMat = new THREE.MeshStandardMaterial({ color: '#efe9da', roughness: 0.5 });
  const rolls = [];
  for (let i = 0; i < 3; i++) {
    const roll = new THREE.Group();
    // inside first (drawn under the translucent rice paper)
    roll.add(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.1, 12).rotateZ(Math.PI / 2), noodleMat));
    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.1, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), greenMat);
    lettuce.rotation.x = 0.6;
    roll.add(lettuce);
    for (let k = 0; k < 3; k++) {
      // halved shrimp pressed flat against the paper: pink C-curls seen from above
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.005, 6, 14, Math.PI * 1.3), shrimpMat);
      s.scale.set(1, 1, 0.45);
      s.rotation.set(Math.PI / 2, 0, k * 0.9 + 0.4);
      s.position.set(-0.032 + k * 0.032, 0.014, 0.0);
      roll.add(s);
    }
    const wrap = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.09, 6, 14).rotateZ(Math.PI / 2), paper);
    wrap.renderOrder = 1;
    roll.add(wrap);
    roll.position.set(-0.03, 0.035, -0.045 + i * 0.048);
    roll.rotation.y = (rng() - 0.5) * 0.15;
    group.add(roll);
    rolls.push(roll);
  }
  // dipping sauce: peanut-hoisin with crushed peanuts and a dot of chili
  const dish = new THREE.Mesh(new THREE.LatheGeometry([
    [0, 0], [0.028, 0], [0.034, 0.022], [0.037, 0.024], [0.033, 0.024], [0.026, 0.006], [0, 0.006],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 28), ceramicWhite());
  dish.position.set(0.085, 0.012, 0.0);
  group.add(dish);
  const sauce = new THREE.Mesh(new THREE.CircleGeometry(0.029, 20).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#7a4626', roughness: 0.15, clearcoat: 1 }));
  sauce.position.set(0.085, 0.03, 0);
  group.add(sauce);
  const nuts = [];
  for (let i = 0; i < 14; i++) {
    const a = rng() * 6.28, r = Math.sqrt(rng()) * 0.016;
    nuts.push(new THREE.DodecahedronGeometry(0.0028, 0).translate(0.085 + Math.cos(a) * r, 0.032, Math.sin(a) * r));
  }
  group.add(new THREE.Mesh(merge(nuts), new THREE.MeshStandardMaterial({ color: '#c99a5a', roughness: 0.7 })));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshStandardMaterial({ color: '#c41e1e', roughness: 0.3 }));
  dot.scale.y = 0.3;
  dot.position.set(0.09, 0.032, 0.008);
  group.add(dot);
  group.userData.bites = rolls;
  return group;
}

/* ---------------- jamu ---------------- */

export const JAMU = {
  'kunyit asam': '#e39a1c',
  'beras kencur': '#eadbb6',
  sinom: '#c7862f',
  temulawak: '#d6ab1f',
};

const glassMat = () => new THREE.MeshPhysicalMaterial({
  color: '#f4fbff', transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
});

/** A glass bottle of jamu with a stopper (for the bars). ~24 cm tall. */
export function jamuBottle(kind, stopper = 'cork') {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.035, 0], [0.038, 0.01], [0.038, 0.15], [0.032, 0.18], [0.014, 0.2], [0.013, 0.235]];
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20), glassMat());
  bottle.renderOrder = 2;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.15, 18).translate(0, 0.08, 0),
    new THREE.MeshStandardMaterial({ color: JAMU[kind], roughness: 0.3, emissive: JAMU[kind], emissiveIntensity: 0.12 }));
  g.add(liquid, bottle);
  const cap = stopper === 'leaf'
    ? new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6).rotateX(Math.PI).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: '#4a7a2e', roughness: 0.7 }))
    : new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.03, 10).translate(0, 0.245, 0), new THREE.MeshStandardMaterial({ color: '#b48a5a', roughness: 0.9 }));
  g.add(cap);
  return g;
}

/** A short glass of jamu for her to sip. */
export function jamuGlass(kind) {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.032, 0], [0.034, 0.004], [0.04, 0.09], [0.038, 0.09], [0.031, 0.006], [0, 0.006]];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24), glassMat());
  glass.renderOrder = 2;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.031, 0.07, 22).translate(0, 0.035, 0),
    new THREE.MeshStandardMaterial({ color: JAMU[kind] || '#e39a1c', roughness: 0.25, emissive: JAMU[kind] || '#e39a1c', emissiveIntensity: 0.15 }));
  liquid.position.y = 0.006;
  const level = new THREE.Group();
  level.add(liquid);
  g.add(level, glass);
  if (kind === 'kunyit asam' || kind === 'sinom') {
    // a thin slice of lime on the rim
    const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 14), new THREE.MeshStandardMaterial({ color: '#b9d86a', roughness: 0.5 }));
    lime.rotation.z = Math.PI / 2; lime.position.set(0.038, 0.088, 0);
    g.add(lime);
  }
  g.userData.bites = [level];
  return g;
}

/* ---------------- martabak (Gesan's Legit & Gurih) ---------------- */

const kraftTray = () => new THREE.Mesh(merge([
  new THREE.BoxGeometry(0.22, 0.006, 0.16).translate(0, 0.003, 0),
  new THREE.BoxGeometry(0.22, 0.03, 0.005).translate(0, 0.015, 0.08), new THREE.BoxGeometry(0.22, 0.03, 0.005).translate(0, 0.015, -0.08),
  new THREE.BoxGeometry(0.005, 0.03, 0.16).translate(0.11, 0.015, 0), new THREE.BoxGeometry(0.005, 0.03, 0.16).translate(-0.11, 0.015, 0),
]), new THREE.MeshStandardMaterial({ color: '#c9a27a', roughness: 0.9 }));

/** Martabak manis ("legit"): three thick folded wedges, chocolate and cheese between the layers, buttery. */
export function martabakManis() {
  const group = new THREE.Group();
  group.add(kraftTray());
  const cake = new THREE.MeshPhysicalMaterial({ color: '#d89a3a', roughness: 0.45, clearcoat: 0.5 });
  const crust = new THREE.MeshPhysicalMaterial({ color: '#c47e30', roughness: 0.4, clearcoat: 0.6 });
  const choc = new THREE.MeshStandardMaterial({ color: '#3e2214', roughness: 0.5 });
  const cheese = new THREE.MeshStandardMaterial({ color: '#f2d36a', roughness: 0.6 });
  const rng = mulberry32(23);
  const wedges = [];
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Group();
    const span = 0.62, th0 = -span / 2;
    const layer = (r, h, y, mat) => w.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14, 1, false, th0, span).translate(0, y, 0), mat));
    layer(0.11, 0.022, 0.011, cake);
    layer(0.106, 0.009, 0.0265, choc);
    layer(0.11, 0.022, 0.042, cake);
    layer(0.111, 0.003, 0.0545, crust);
    const sh = [];
    for (let k = 0; k < 10; k++) { const a = th0 + rng() * span; sh.push(new THREE.BoxGeometry(0.01, 0.006, 0.004).translate(Math.sin(a) * 0.104, 0.027, Math.cos(a) * 0.104)); }
    w.add(new THREE.Mesh(merge(sh), cheese));
    // point the tip at the tray centre, rows side by side
    // fanned from one point, like slices lifted from the round
    w.rotation.y = Math.PI + (i - 1) * 0.68;
    w.position.set(0, 0.006, 0.055);
    group.add(w);
    wedges.push(w);
  }
  group.userData.bites = wedges.slice().reverse();
  return group;
}

/** Martabak telur ("gurih"): crisp golden squares of egg and leek, with a dish of acar. */
export function martabakTelur() {
  const group = new THREE.Group();
  group.add(kraftTray());
  const shell = new THREE.MeshPhysicalMaterial({ color: '#d8a040', roughness: 0.4, clearcoat: 0.4 });
  const fill = new THREE.MeshStandardMaterial({ color: '#e8c45a', roughness: 0.6 });
  const leek = new THREE.MeshStandardMaterial({ color: '#4f9a3a', roughness: 0.6 });
  const rng = mulberry32(29);
  const sq = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.028, 0.066).translate(0, 0.014, 0), shell));
    p.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.004).translate(0, 0.014, 0.0335), fill));
    const g = [];
    for (let k = 0; k < 5; k++) g.push(new THREE.BoxGeometry(0.008, 0.004, 0.003).translate((rng() - 0.5) * 0.05, 0.01 + rng() * 0.01, 0.0355));
    p.add(new THREE.Mesh(merge(g), leek));
    p.position.set(-0.075 + (i % 2) * 0.072, 0.006, -0.035 + Math.floor(i / 2) * 0.072);
    p.rotation.y = (rng() - 0.5) * 0.2;
    group.add(p);
    sq.push(p);
  }
  const dish = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.025, 0], [0.034, 0.02], [0.031, 0.02], [0, 0.004]].map(([r, y]) => new THREE.Vector2(r, y)), 16), ceramicWhite());
  dish.position.set(0.075, 0.006, 0);
  group.add(dish);
  const acar = [];
  for (let k = 0; k < 9; k++) acar.push(new THREE.BoxGeometry(0.009, 0.009, 0.009).translate(0.075 + (rng() - 0.5) * 0.035, 0.02, (rng() - 0.5) * 0.035));
  group.add(new THREE.Mesh(merge(acar.slice(0, 5)), new THREE.MeshStandardMaterial({ color: '#b8d890', roughness: 0.4 })));
  group.add(new THREE.Mesh(merge(acar.slice(5, 7)), new THREE.MeshStandardMaterial({ color: '#a8506a', roughness: 0.4 })));
  group.add(new THREE.Mesh(merge(acar.slice(7)), new THREE.MeshStandardMaterial({ color: '#d42a1a', roughness: 0.4 })));
  group.userData.bites = sq.slice().reverse();
  return group;
}

/* ---------------- holding food ---------------- */

export function createFoodHands(camera, scene) {
  const hand = new THREE.Group();
  hand.position.set(0.24, -0.25, -0.5);
  camera.add(hand);
  let item = null, kind = null, bitesLeft = 0, totalBites = 0;
  let bob = 0;
  const placed = [];
  const tmp = new THREE.Vector3();

  function clear() {
    if (item) hand.remove(item);
    item = null; kind = null;
  }

  function applyBites() {
    if (!item) return;
    const done = 1 - bitesLeft / totalBites;
    if (kind === 'gelato') {
      const [scoop, wafer, cone] = item.userData.bites;
      scoop.scale.setScalar(Math.max(1 - done * 1.6, 0.0001));
      scoop.visible = done < 0.62;
      wafer.visible = done < 0.25;
      cone.scale.set(1, Math.max(1 - Math.max(done - 0.6, 0) * 2.2, 0.08), 1);
    } else if (kind === 'pho') {
      const parts = item.userData.bites;
      parts.forEach((p, i) => { p.visible = done < 1 - (i + 1) / (parts.length + 1); });
      item.userData.broth.position.y = 0.064 - done * 0.04;
      item.userData.broth.scale.setScalar(1 - done * 0.35);
    } else if (kind === 'jamu') {
      const [level] = item.userData.bites;
      level.scale.y = Math.max(1 - done, 0.001);
      level.visible = done < 1;
    } else if (kind === 'rolls' || kind === 'manis' || kind === 'telur') {
      const rolls = item.userData.bites;
      rolls.forEach((r, i) => { r.visible = done < (rolls.length - i) / rolls.length - 0.01; });
    }
  }

  return {
    get holding() { return kind; },
    get finished() { return !!item && bitesLeft <= 0; },
    give(k, flavor = 'pistachio') {
      clear();
      kind = k;
      if (k === 'gelato') { item = gelatoCone(flavor); item.scale.setScalar(1.5); item.position.set(0, 0.02, 0); item.rotation.set(0.15, -0.3, 0.05); totalBites = 5; }
      else if (k === 'pho') { item = phoBowl(); item.scale.setScalar(1.25); item.position.set(-0.08, -0.06, -0.06); item.rotation.set(0.38, -0.2, 0); totalBites = 5; }
      else if (k === 'jamu') { item = jamuGlass(flavor); item.scale.setScalar(1.6); item.position.set(0.0, -0.02, 0); item.rotation.set(0.12, 0, 0.04); totalBites = 4; }
      else if (k === 'manis') { item = martabakManis(); item.scale.setScalar(1.35); item.position.set(-0.06, -0.05, -0.05); item.rotation.set(0.45, -0.25, 0); totalBites = 6; }
      else if (k === 'telur') { item = martabakTelur(); item.scale.setScalar(1.35); item.position.set(-0.06, -0.05, -0.05); item.rotation.set(0.45, -0.25, 0); totalBites = 4; }
      else { item = springRollPlate(); item.scale.setScalar(1.3); item.position.set(-0.06, -0.04, -0.05); item.rotation.set(0.42, -0.2, 0); totalBites = 6; }
      item.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = false; o.frustumCulled = false;
        // a touch of its own colour, so the blue moonlight doesn't turn strawberry lilac
        const m = o.material;
        if (m && m.emissive && m.emissive.getHex() === 0 && !m.transparent) { m.emissive.copy(m.color); m.emissiveIntensity = 0.16; }
      });
      bitesLeft = totalBites;
      hand.add(item);
    },
    bite() {
      if (!item || bitesLeft <= 0) return false;
      bitesLeft--;
      applyBites();
      return true;
    },
    /** Put whatever she's holding down at a world position (a table top). */
    setDown(pos, yaw = 0) {
      if (!item) return false;
      hand.remove(item);
      item.position.copy(pos);
      item.rotation.set(0, yaw, 0);
      item.scale.multiplyScalar(1 / 1.3 * (kind === 'gelato' ? 0.87 : kind === 'jamu' ? 0.62 : 1));
      if (kind === 'gelato') item.position.y += 0.135; // standing on its tip, as if in a cone holder
      scene.add(item);
      placed.push(item);
      if (placed.length > 8) scene.remove(placed.shift());
      item = null; kind = null;
      return true;
    },
    drop() { clear(); },
    update(t, dt, speed) {
      bob += dt * (1.5 + speed * 2.2);
      hand.position.set(0.24 + Math.sin(bob) * 0.006 * (speed > 0.3 ? 1 : 0.3), -0.25 + Math.abs(Math.cos(bob)) * 0.008 * (speed > 0.3 ? 1 : 0.2), -0.5);
      // steam drifting off any phở bowl (held or on a table)
      const bowls = [];
      if (kind === 'pho' && item) bowls.push(item);
      for (const p of placed) if (p.userData.steam) bowls.push(p);
      for (const b of bowls) {
        const level = b === item ? bitesLeft / totalBites : 0.6;
        for (const s of b.userData.steam) {
          const k = (t * 0.25 + s.userData.ph) % 1;
          s.position.set(s.userData.ox + Math.sin(t + s.userData.ph * 9) * 0.01, 0.07 + k * 0.16, Math.cos(t * 0.7 + s.userData.ph * 5) * 0.01);
          s.scale.setScalar(0.03 + k * 0.08);
          s.material.opacity = Math.sin(Math.PI * k) * 0.16 * level;
        }
      }
      tmp.set(0, 0, 0);
    },
  };
}
