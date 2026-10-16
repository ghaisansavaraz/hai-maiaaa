/* Hand-built set pieces: paper lanterns along the path, the bench + letter at
   the end of the dock, the glass greenhouse (marble vase with the fully
   bloomed flower, the WORLD'S BEST REVA mug, string lights, plants), the
   moon-gate on the hilltop, and the little white bunny. Each returns its
   meshes, point lights, colliders and interactable spots. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, marbleTexture, mugTextTexture, tileTexture, glowTexture } from './util.js';
import {
  GREENHOUSE, GREENHOUSE_FLOOR_Y, DOCK, BENCH, HILL, HILLTOP_Y, BUNNY_HOME, MOON_DIR, mainPathAt,
} from './layout.js';

const WARM = new THREE.Color('#ffae66');

function paint(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
function merge(parts) {
  return mergeGeometries(parts.map((g) => {
    const n = nonIdx(g);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    return n;
  }));
}

/* =============================== lanterns =============================== */

export function createLanterns(hf, messages) {
  const group = new THREE.Group();
  const lanterns = [];
  const fractions = [0.075, 0.27, 0.45, 0.63, 0.86];
  const woodMat = new THREE.MeshStandardMaterial({ color: '#5a3f2c', roughness: 0.85 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.5, metalness: 0.6 });

  const profile = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    profile.push(new THREE.Vector2(0.07 + 0.2 * Math.pow(Math.sin(Math.PI * t), 0.8), -0.23 + t * 0.46));
  }
  const bodyGeo = new THREE.LatheGeometry(profile, 24);
  const ribGeo = (r) => new THREE.TorusGeometry(r, 0.006, 4, 32).rotateX(Math.PI / 2);
  const ribs = merge([
    ribGeo(0.27).translate(0, 0, 0), ribGeo(0.235).translate(0, 0.1, 0), ribGeo(0.235).translate(0, -0.1, 0),
    ribGeo(0.16).translate(0, 0.18, 0), ribGeo(0.16).translate(0, -0.18, 0),
  ]);
  const capGeo = new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16);

  fractions.forEach((f, i) => {
    const pt = mainPathAt(f);
    const side = i % 2 === 0 ? 1 : -1;
    const nx = -pt.tz * side, nz = pt.tx * side; // perpendicular, pointing away from the path
    const px = pt.x + nx * 1.85, pz = pt.z + nz * 1.85;
    const y = hf.sample(px, pz);

    const lg = new THREE.Group();
    lg.position.set(px, y, pz);
    lg.rotation.y = Math.atan2(nz, -nx); // local +x (the hook) reaches back over the path
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.55, 8).translate(0, 1.27, 0), woodMat);
    post.castShadow = true;
    lg.add(post);
    const hookCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0.05, 2.85, 0), new THREE.Vector3(0.62, 2.66, 0));
    lg.add(new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 18, 0.022, 6), ironMat));
    lg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4).translate(0.62, 2.55, 0), ironMat));

    const paper = new THREE.MeshStandardMaterial({
      color: '#f3cf9c', emissive: '#ff9a50', emissiveIntensity: 1.2, roughness: 0.75, side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, paper);
    body.position.set(0.62, 2.18, 0);
    lg.add(body);
    const rib = new THREE.Mesh(ribs, ironMat);
    rib.position.copy(body.position);
    lg.add(rib);
    lg.add(new THREE.Mesh(capGeo, woodMat).translateX(0.62).translateY(2.43));
    lg.add(new THREE.Mesh(capGeo, woodMat).translateX(0.62).translateY(1.93));
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#9b2b2b', roughness: 0.8 }));
    tassel.position.set(0.62, 1.84, 0);
    tassel.rotation.x = Math.PI;
    lg.add(tassel);

    const light = new THREE.PointLight(WARM, 3, 16, 2);
    light.position.set(0.62, 2.18, 0);
    lg.add(light);
    group.add(lg);

    const world = new THREE.Vector3();
    lg.updateMatrixWorld(true);
    body.getWorldPosition(world);
    lanterns.push({
      index: i, group: lg, paper, light, world, read: false, glow: 0, seed: Math.random() * 10,
      collider: { x: px, z: pz, r: 0.25 },
      interact: { center: world.clone(), radius: 0.9, label: 'click to warm the lantern', message: messages[i] || '' },
    });
  });

  return {
    group, lanterns,
    update(t, dt, celebrate) {
      for (const l of lanterns) {
        const flick = 0.92 + Math.sin(t * 7.3 + l.seed) * 0.04 + Math.sin(t * 13.1 + l.seed * 2) * 0.03;
        const pulse = l.read ? 0 : (Math.sin(t * 1.4 + l.seed) * 0.5 + 0.5) * 0.5;
        const target = (l.read || celebrate ? 3.4 : 1.15 + pulse) * flick;
        l.glow += (target - l.glow) * Math.min(1, dt * 2.5);
        l.paper.emissiveIntensity = l.glow;
        l.light.intensity = l.glow * (l.read || celebrate ? 3.2 : 2.2);
      }
    },
  };
}

/* =============================== dock bench + letter =============================== */

export function createBench(letter) {
  const group = new THREE.Group();
  // backrest on the +z (land) side, so whoever sits faces -z: across the lake to the moon
  group.position.set(BENCH.x, DOCK.deckY, BENCH.z);

  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.75 });
  const iron = new THREE.MeshStandardMaterial({ color: '#1f1d1b', roughness: 0.45, metalness: 0.65 });
  const slats = [];
  for (let i = 0; i < 5; i++) {
    slats.push(new THREE.BoxGeometry(1.5, 0.035, 0.085).translate(0, 0.45, -0.2 + i * 0.1));
  }
  for (let i = 0; i < 3; i++) {
    const g = new THREE.BoxGeometry(1.5, 0.085, 0.03);
    g.rotateX(-0.22);
    g.translate(0, 0.6 + i * 0.13, 0.27 + i * 0.03);
    slats.push(g);
  }
  const seat = new THREE.Mesh(merge(slats), wood);
  seat.castShadow = true;
  group.add(seat);

  for (const sx of [-0.68, 0.68]) {
    const frame = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0, -0.27), new THREE.Vector3(sx, 0.22, -0.25), new THREE.Vector3(sx, 0.43, -0.27),
      new THREE.Vector3(sx, 0.63, -0.25), new THREE.Vector3(sx, 0.66, -0.02), new THREE.Vector3(sx, 0.62, 0.2),
      new THREE.Vector3(sx, 0.43, 0.25), new THREE.Vector3(sx, 0.2, 0.3), new THREE.Vector3(sx, 0, 0.32),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(frame, 40, 0.022, 6), iron));
    const back = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.43, 0.25), new THREE.Vector3(sx, 0.7, 0.31), new THREE.Vector3(sx, 0.95, 0.36),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(back, 12, 0.02, 6), iron));
  }

  // the letter: cream envelope with a red wax seal, resting on the seat
  const env = new THREE.Group();
  env.position.set(0.15, 0.47, -0.05);
  env.rotation.y = 0.35;
  const paperMat = new THREE.MeshStandardMaterial({ color: '#f3eadb', emissive: '#fff1d8', emissiveIntensity: 0.35, roughness: 0.7 });
  env.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.006, 0.16), paperMat));
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.12, 0.08); flapShape.lineTo(0.12, 0.08); flapShape.lineTo(0, -0.01); flapShape.closePath();
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), new THREE.MeshStandardMaterial({ color: '#e9dcc6', emissive: '#fff1d8', emissiveIntensity: 0.3, side: THREE.DoubleSide }));
  flap.rotation.x = -Math.PI / 2;
  flap.position.y = 0.0045;
  env.add(flap);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 16), new THREE.MeshStandardMaterial({ color: '#8c1f2a', roughness: 0.35 }));
  seal.position.set(0, 0.006, 0.0);
  env.add(seal);
  group.add(env);

  const sparkle = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(64, 3), color: new THREE.Color(1.6, 1.3, 0.9), blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false,
  }));
  // floats above the backrest so it reads from the dock as you walk up
  sparkle.scale.setScalar(0.38);
  sparkle.position.set(0.15, 1.1, 0.05);
  group.add(sparkle);

  // dock-end jar lights (emissive only; reflections come from the point light)
  const jarMat = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffb860', emissiveIntensity: 2.6 });
  for (const sx of [-1.05, 1.05]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.95, 6), wood);
    post.position.set(sx, 0.475, -0.5);
    group.add(post);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.14, 12), jarMat);
    jar.position.set(sx, 1.02, -0.5);
    group.add(jar);
  }
  const light = new THREE.PointLight(WARM, 2.2, 10, 2);
  light.position.set(0, 1.1, -0.4);
  group.add(light);

  group.updateMatrixWorld(true);
  const center = new THREE.Vector3();
  env.getWorldPosition(center);
  let t0 = 0;
  return {
    group, light,
    colliders: [{ seg: [BENCH.x - 0.75, BENCH.z, BENCH.x + 0.75, BENCH.z], r: 0.35 }],
    interact: { center, radius: 0.55, label: 'click to open the letter', letter },
    update(t) {
      t0 = t;
      sparkle.material.opacity = 0.55 + Math.sin(t0 * 2.1) * 0.35;
      sparkle.position.y = 1.1 + Math.sin(t0 * 1.3) * 0.05;
    },
  };
}

/* =============================== greenhouse =============================== */

function vaseGeometry() {
  const pts = [
    [0, 0], [0.075, 0], [0.083, 0.01], [0.072, 0.026], [0.08, 0.045], [0.11, 0.09], [0.138, 0.15],
    [0.15, 0.205], [0.146, 0.255], [0.128, 0.3], [0.098, 0.34], [0.06, 0.372], [0.046, 0.392],
    [0.046, 0.408], [0.056, 0.418], [0.06, 0.426], [0.052, 0.431], [0.04, 0.426], [0.038, 0.39],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 48);
}

function petalGeometry(w, l, cup, curl) {
  const g = new THREE.PlaneGeometry(1, 1, 8, 12);
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const base = new THREE.Color('#c98476'), tip = new THREE.Color('#f1d8cd'), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i);          // -0.5..0.5 across
    const v = p.getY(i) + 0.5;    // 0..1 along
    // rose-petal outline: narrow claw at the base, widest around 70%, rounded tip
    const cap = v > 0.68 ? Math.sqrt(Math.max(1 - ((v - 0.68) / 0.33) ** 2, 0)) : 1;
    const outline = Math.pow(Math.sin(Math.PI * (v * 0.56 + 0.05)), 0.7) * cap;
    const x = u * w * outline * 2;
    const along = v * l;
    // cupped across, with a soft ruffle toward the rim
    const z = -((u * 2) ** 2) * cup * outline + Math.sin(u * Math.PI * 3 + w * 90) * 0.0025 * v * v;
    // curl the petal back along its length
    const ang = curl * v * v;
    const y = along * Math.cos(ang) - z * Math.sin(ang);
    const zz = along * Math.sin(ang) + z * Math.cos(ang);
    p.setXYZ(i, x, y, zz);
    c.copy(base).lerp(tip, Math.pow(v, 0.8));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

function bloomedFlower() {
  const group = new THREE.Group();
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.36, 0), new THREE.Vector3(0.01, 0.44, 0.005), new THREE.Vector3(-0.005, 0.51, 0), new THREE.Vector3(0.008, 0.575, 0),
  ]);
  const green = new THREE.MeshStandardMaterial({ color: '#4f7a42', roughness: 0.6 });
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 24, 0.008, 6), green));
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.035, 0.03, 0.09, 0.012);
  leafShape.quadraticCurveTo(0.04, -0.012, 0, 0);
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 8), new THREE.MeshStandardMaterial({ color: '#5d8a4c', side: THREE.DoubleSide, roughness: 0.55 }));
  leaf.position.set(0.004, 0.48, 0);
  leaf.rotation.set(0.2, 0.3, 0.25);
  group.add(leaf);

  const head = new THREE.Group();
  head.position.set(0.008, 0.585, 0);
  head.rotation.z = 0.32; // nod toward the doorway so she sees its face
  // layered, cupped like a garden rose/peony: open outer guard petals,
  // progressively tighter rings closing over the heart
  const rings = [
    { n: 9, w: 0.052, l: 0.088, tilt: 0.92, cup: 0.024, curl: 0.42, r: 0.016 },
    { n: 8, w: 0.047, l: 0.08, tilt: 0.7, cup: 0.026, curl: 0.28, r: 0.014 },
    { n: 7, w: 0.042, l: 0.07, tilt: 0.5, cup: 0.026, curl: 0.16, r: 0.012 },
    { n: 6, w: 0.036, l: 0.06, tilt: 0.32, cup: 0.024, curl: 0.06, r: 0.009 },
    { n: 5, w: 0.028, l: 0.048, tilt: 0.16, cup: 0.02, curl: -0.06, r: 0.006 },
    { n: 4, w: 0.02, l: 0.036, tilt: 0.04, cup: 0.016, curl: -0.12, r: 0.003 },
  ];
  const parts = [];
  rings.forEach((ring, ri) => {
    const pg = petalGeometry(ring.w, ring.l, ring.cup, ring.curl);
    for (let i = 0; i < ring.n; i++) {
      const g = pg.clone();
      g.rotateX(ring.tilt);                    // lean outward: radians from vertical
      g.translate(0, 0, ring.r);
      g.rotateY((i / ring.n) * Math.PI * 2 + ri * 0.4);
      parts.push(g);
    }
  });
  const petalMat = new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, emissive: '#f2c3b4', emissiveIntensity: 0.26,
  });
  head.add(new THREE.Mesh(mergeGeometries(parts), petalMat));
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 8).scale(1, 0.55, 1), new THREE.MeshStandardMaterial({ color: '#d4a44a', emissive: '#c08a30', emissiveIntensity: 0.4 }));
  center.position.y = 0.012;
  head.add(center);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 5, 4), new THREE.MeshStandardMaterial({ color: '#8a6a3a' }));
    dot.position.set(Math.cos(a) * 0.016, 0.017, Math.sin(a) * 0.016);
    head.add(dot);
  }
  group.add(head);
  return group;
}

function mug() {
  const group = new THREE.Group();
  const pts = [
    [0, 0.012], [0.036, 0.012], [0.037, 0.096], [0.038, 0.1], [0.042, 0.1], [0.042, 0.012],
    [0.041, 0.004], [0.036, 0], [0, 0],
  ].reverse().map(([r, y]) => new THREE.Vector2(r, y));
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#fbfaf7', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), ceramic));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0065, 8, 20, Math.PI).rotateZ(Math.PI / 2), ceramic);
  handle.position.set(-0.044, 0.052, 0);
  group.add(handle);
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0425, 0.0425, 0.07, 32, 1, true, Math.PI / 2 - 0.85, 1.7),
    new THREE.MeshStandardMaterial({ map: mugTextTexture(), transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  label.position.y = 0.053;
  group.add(label);
  return group;
}

function pot(rng, x, y, z, scale) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.07, 0], [0.09, 0.12], [0.1, 0.13], [0.1, 0.15], [0.085, 0.15]].map(([r, h]) => new THREE.Vector2(r * scale, h * scale));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 18), new THREE.MeshStandardMaterial({ color: '#a35a38', roughness: 0.85 })));
  const leaves = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06 * scale * (0.8 + rng() * 0.5), 1), leaves);
    b.position.set((rng() - 0.5) * 0.1 * scale, 0.17 * scale + rng() * 0.1 * scale, (rng() - 0.5) * 0.1 * scale);
    g.add(b);
  }
  g.position.set(x, y, z);
  return g;
}

export function createGreenhouse(itemMessages) {
  const GH = GREENHOUSE;
  const y0 = GREENHOUSE_FLOOR_Y;
  const group = new THREE.Group();
  group.position.set(GH.x, y0, GH.z);
  const rng = mulberry32(33);

  const frameParts = [];
  const glassParts = [];
  const brickParts = [];
  const bar = (w, h, d, x, y, z) => frameParts.push(new THREE.BoxGeometry(w, h, d).translate(x, y, z));
  const KNEE = 0.45, T = 0.05;
  const xs = [-GH.hw, GH.hw], zs = [-GH.hd, GH.hd];
  const doorHalf = GH.doorW / 2, doorH = 2.15;

  // corner posts + top/bottom plates
  for (const x of xs) for (const z of zs) bar(T * 1.4, GH.wallH, T * 1.4, x, GH.wallH / 2, z);
  for (const z of zs) { bar(GH.hw * 2, T, T, 0, GH.wallH, z); bar(GH.hw * 2, T, T, 0, KNEE, z); }
  for (const x of xs) { bar(T, T, GH.hd * 2, x, GH.wallH, 0); }
  bar(T, T, GH.hd * 2, GH.hw, KNEE, 0);
  bar(T, T, GH.hd - doorHalf, -GH.hw, KNEE, -(GH.hd + doorHalf) / 2);
  bar(T, T, GH.hd - doorHalf, -GH.hw, KNEE, (GH.hd + doorHalf) / 2);

  // long walls (z = ±hd): mullions every ~0.8m + glass panes + brick knee wall
  const nLong = 6;
  for (const z of zs) {
    for (let i = 1; i < nLong; i++) bar(T, GH.wallH, T, -GH.hw + (i / nLong) * GH.hw * 2, GH.wallH / 2, z);
    glassParts.push(new THREE.PlaneGeometry(GH.hw * 2, GH.wallH - KNEE).translate(0, KNEE + (GH.wallH - KNEE) / 2, z));
    brickParts.push(new THREE.BoxGeometry(GH.hw * 2, KNEE, 0.14).translate(0, KNEE / 2, z));
  }
  // end walls (x = ±hw); the west one has the doorway
  const nShort = 7;
  for (const x of xs) {
    const isDoor = x < 0;
    for (let i = 1; i < nShort; i++) {
      const z = -GH.hd + (i / nShort) * GH.hd * 2;
      if (isDoor && Math.abs(z) < doorHalf + 0.02) continue;
      bar(T, GH.wallH, T, x, GH.wallH / 2, z);
    }
    if (!isDoor) {
      glassParts.push(new THREE.PlaneGeometry(GH.hd * 2, GH.wallH - KNEE).rotateY(Math.PI / 2).translate(x, KNEE + (GH.wallH - KNEE) / 2, 0));
      brickParts.push(new THREE.BoxGeometry(0.14, KNEE, GH.hd * 2).translate(x, KNEE / 2, 0));
    } else {
      const segL = GH.hd - doorHalf;
      for (const s of [-1, 1]) {
        const zc = s * (doorHalf + segL / 2);
        glassParts.push(new THREE.PlaneGeometry(segL, GH.wallH - KNEE).rotateY(Math.PI / 2).translate(x, KNEE + (GH.wallH - KNEE) / 2, zc));
        brickParts.push(new THREE.BoxGeometry(0.14, KNEE, segL).translate(x, KNEE / 2, zc));
      }
      // door frame + transom glass
      bar(T * 1.4, doorH, T * 1.4, x, doorH / 2, -doorHalf);
      bar(T * 1.4, doorH, T * 1.4, x, doorH / 2, doorHalf);
      bar(T, T * 1.4, GH.doorW, x, doorH, 0);
      glassParts.push(new THREE.PlaneGeometry(GH.doorW, GH.wallH - doorH).rotateY(Math.PI / 2).translate(x, doorH + (GH.wallH - doorH) / 2, 0));
    }
  }
  // gabled roof along z: rafters + ridge + glass
  const rise = GH.roofH - GH.wallH;
  const slope = Math.hypot(GH.hw, rise);
  const ang = Math.atan2(rise, GH.hw);
  bar(T * 1.3, T * 1.3, GH.hd * 2 + 0.1, 0, GH.roofH, 0);
  for (let i = 0; i <= nLong + 1; i++) {
    const z = -GH.hd + (i / (nLong + 1)) * GH.hd * 2;
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(slope, T, T);
      g.rotateZ(s * ang);
      g.translate((s * -GH.hw) / 2, GH.wallH + rise / 2, z);
      frameParts.push(g);
    }
  }
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(slope, GH.hd * 2);
    g.rotateX(-Math.PI / 2);
    g.rotateZ(s * ang);
    g.translate((s * -GH.hw) / 2, GH.wallH + rise / 2 + 0.01, 0);
    glassParts.push(g);
  }
  // gable triangles
  for (const z of zs) {
    const tri = new THREE.Shape();
    tri.moveTo(-GH.hw, 0); tri.lineTo(GH.hw, 0); tri.lineTo(0, rise); tri.closePath();
    glassParts.push(new THREE.ShapeGeometry(tri).translate(0, GH.wallH, z));
    bar(T, rise, T, 0, GH.wallH + rise / 2, z);
  }

  const frame = new THREE.Mesh(merge(frameParts), new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.5, metalness: 0.2 }));
  frame.castShadow = true;
  group.add(frame);
  const brickMat = new THREE.MeshStandardMaterial({ color: '#7d4636', roughness: 0.9 });
  const bricks = new THREE.Mesh(merge(brickParts), brickMat);
  bricks.castShadow = true;
  bricks.receiveShadow = true;
  group.add(bricks);
  const glass = new THREE.Mesh(merge(glassParts), new THREE.MeshStandardMaterial({
    color: '#c7dde6', transparent: true, opacity: 0.13, roughness: 0.06, metalness: 0.15, side: THREE.DoubleSide, depthWrite: false,
  }));
  glass.renderOrder = 2;
  group.add(glass);

  // floor tiles
  const tiles = tileTexture(256);
  tiles.repeat.set(GH.hw * 1.6, GH.hd * 1.6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(GH.hw * 2, GH.hd * 2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.85 }));
  floor.position.y = 0.015;
  floor.receiveShadow = true;
  group.add(floor);

  // table in the middle
  const wood = new THREE.MeshStandardMaterial({ color: '#7b5236', roughness: 0.7 });
  const tableTop = 0.76;
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 1.3).translate(0, tableTop, 0), wood));
  for (const [lx, lz] of [[-0.36, -0.58], [0.36, -0.58], [-0.36, 0.58], [0.36, 0.58]]) {
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, tableTop, 8).translate(lx, tableTop / 2, lz), wood));
  }
  // linen runner
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.005, 1.24).translate(0, tableTop + 0.023, 0), new THREE.MeshStandardMaterial({ color: '#e8e1d3', roughness: 0.95 })));

  // the marble vase + the bloomed flower
  const marble = new THREE.MeshPhysicalMaterial({ color: '#f6f4ef', map: marbleTexture(512), roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
  const vase = new THREE.Group();
  vase.position.set(0.02, tableTop + 0.025, 0.12);
  vase.scale.setScalar(1.3);
  const vaseMesh = new THREE.Mesh(vaseGeometry(), marble);
  vaseMesh.castShadow = true;
  vase.add(vaseMesh);
  vase.add(bloomedFlower());
  group.add(vase);

  // the mug, text toward the door (west, -x)
  const m = mug();
  m.position.set(-0.18, tableTop + 0.025, -0.28);
  m.rotation.y = Math.PI + 0.25;
  m.scale.setScalar(1.3);
  group.add(m);

  // shelves + potted plants along the east wall
  for (const sh of [0.55, 1.05]) {
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, GH.hd * 1.7).translate(GH.hw - 0.24, sh, 0), wood));
    for (let i = 0; i < 5; i++) group.add(pot(rng, GH.hw - 0.24, sh + 0.015, -GH.hd * 0.75 + i * GH.hd * 0.37, 0.8 + rng() * 0.6));
  }
  // big pots flanking the inside of the door + outside
  group.add(pot(rng, -GH.hw + 0.35, 0.01, -GH.hd + 0.4, 2.4));
  group.add(pot(rng, -GH.hw + 0.35, 0.01, GH.hd - 0.4, 2.2));
  group.add(pot(rng, -GH.hw - 0.45, 0.0, -doorHalf - 0.45, 2.0));
  group.add(pot(rng, -GH.hw - 0.45, 0.0, doorHalf + 0.45, 1.8));

  // string lights draped under the ridge
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#ffe2b0', emissive: '#ffbf70', emissiveIntensity: 3.2 });
  const wireMat = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6 });
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const z = -GH.hd + 0.15 + t * (GH.hd * 2 - 0.3);
      const sag = Math.sin(Math.PI * ((t * 3) % 1)) * 0.22;
      pts.push(new THREE.Vector3(side * 0.7, GH.wallH + rise * 0.55 - sag, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.004, 4), wireMat));
    for (let i = 0; i < 18; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), bulbMat);
      b.position.copy(curve.getPoint((i + 0.5) / 18)).add(new THREE.Vector3(0, -0.03, 0));
      group.add(b);
    }
  }
  // hung high in the roof ridge so it warms the whole room without
  // blowing out the flower right under it
  const light = new THREE.PointLight('#ffc27a', 12, 12, 2);
  light.position.set(0, GH.roofH - 0.45, 0);
  group.add(light);

  group.updateMatrixWorld(true);
  const flowerCenter = new THREE.Vector3(0.02, tableTop + 0.55, 0.12).applyMatrix4(group.matrixWorld);
  const mugCenter = new THREE.Vector3(-0.18, tableTop + 0.095, -0.28).applyMatrix4(group.matrixWorld);

  // walls as collision segments (door gap left open on the west wall)
  const X0 = GH.x - GH.hw, X1 = GH.x + GH.hw, Z0 = GH.z - GH.hd, Z1 = GH.z + GH.hd;
  const colliders = [
    { seg: [X0, Z0, X1, Z0], r: 0.25 }, { seg: [X0, Z1, X1, Z1], r: 0.25 }, { seg: [X1, Z0, X1, Z1], r: 0.25 },
    { seg: [X0, Z0, X0, GH.z - doorHalf], r: 0.25 }, { seg: [X0, GH.z + doorHalf, X0, Z1], r: 0.25 },
    { seg: [GH.x, GH.z - 0.62, GH.x, GH.z + 0.62], r: 0.55 },            // table
    { seg: [X1 - 0.24, Z0 + 0.4, X1 - 0.24, Z1 - 0.4], r: 0.3 },         // shelves
  ];

  return {
    group, light, colliders,
    interacts: [
      { center: flowerCenter, radius: 0.38, label: 'click to look closer', message: itemMessages.flower },
      { center: mugCenter, radius: 0.2, label: 'click to look closer', message: itemMessages.mug },
    ],
  };
}

/* =============================== hilltop moon-gate =============================== */

export function createMoonGate() {
  const group = new THREE.Group();
  group.position.set(HILL.x, HILLTOP_Y, HILL.z + 1.5);
  // turn the ring to face the moon, so walking up to it frames the moon inside
  group.rotation.y = Math.atan2(-MOON_DIR[0], -MOON_DIR[2]);
  const stone = new THREE.MeshStandardMaterial({ color: '#a9a497', roughness: 0.9 });
  const R = 2.4, tube = 0.3;
  const ringGeo = new THREE.TorusGeometry(R, tube, 16, 72);
  const p = ringGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const n = Math.sin(p.getX(i) * 9.1) * Math.cos(p.getY(i) * 7.3) * 0.02;
    p.setXYZ(i, p.getX(i) * (1 + n), p.getY(i) * (1 + n), p.getZ(i) * (1 + n * 2));
  }
  ringGeo.computeVertexNormals();
  const ring = new THREE.Mesh(ringGeo, stone);
  const cy = R + tube - 0.05;
  ring.position.y = cy;
  ring.castShadow = true;
  group.add(ring);
  for (const sx of [-0.75, 0.75]) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), stone);
    plinth.position.set(sx, 0.17, 0);
    plinth.castShadow = true;
    group.add(plinth);
  }

  // moonstone inlay: a thin glowing band on both faces + a ring of runes
  const inlayMat = new THREE.MeshStandardMaterial({
    color: '#cfe0ff', emissive: '#9fbcff', emissiveIntensity: 0.9, roughness: 0.3,
  });
  // z of the torus surface at a radial offset d from the tube centre line
  const surf = (d) => Math.sqrt(Math.max(tube * tube - d * d, 0)) * 1.03;
  for (const zf of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.026, 6, 140), inlayMat);
    band.position.set(0, cy, zf * surf(0));
    group.add(band);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R - tube * 0.62, 0.016, 6, 140), inlayMat);
    inner.position.set(0, cy, zf * surf(tube * 0.62));
    group.add(inner);
  }
  const runeGeos = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const big = i % 6 === 0;
    const g = big
      ? new THREE.OctahedronGeometry(0.075, 0).scale(0.7, 1.3, 0.4)
      : new THREE.OctahedronGeometry(0.03, 1);
    g.rotateZ(a - Math.PI / 2);
    for (const zf of [-1, 1]) {
      const gg = g.clone();
      gg.translate(Math.cos(a) * (R + tube * 0.55), cy + Math.sin(a) * (R + tube * 0.55), zf * surf(tube * 0.55));
      runeGeos.push(gg);
    }
  }
  const runes = new THREE.Mesh(mergeGeometries(runeGeos), inlayMat);
  group.add(runes);

  // the portal veil: a sealed, slowly breathing film of moonlight while locked;
  // a bright swirling doorway once it opens
  const veilMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uOpen; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x + 1e-5);
        float swirl = 0.5 + 0.5 * sin(a * 3.0 + r * 7.0 - uTime * 0.6) * sin(a * 2.0 - r * 4.0 + uTime * 0.35);
        float glow = 1.0 - smoothstep(0.1, 1.0, r);
        float rim = smoothstep(0.7, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r));
        // locked: soft concentric ripples drifting inward, like a held breath
        float rings = 0.5 + 0.5 * sin(r * 22.0 + uTime * 1.1);
        rings *= smoothstep(1.0, 0.25, r);
        float breathe = 0.75 + 0.25 * sin(uTime * 0.7);
        vec3 col = mix(vec3(0.55, 0.65, 1.0), vec3(1.0, 0.86, 0.95), swirl);
        float a0 = ((0.06 + 0.05 * rings) * glow + rim * 0.22) * breathe;
        float a1 = (0.22 + 0.34 * swirl) * glow + rim * 0.55;
        float alpha = mix(a0, a1, uOpen);
        gl_FragColor = vec4(col * mix(1.2, 2.3, uOpen) * alpha, alpha);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const veil = new THREE.Mesh(new THREE.CircleGeometry(R - tube * 0.6, 64), veilMat);
  veil.position.y = cy;
  group.add(veil);

  // four stone lanterns (tōrō) around the plaza
  const fireMat = new THREE.MeshStandardMaterial({ color: '#ffd59a', emissive: '#ff9f4a', emissiveIntensity: 2.2 });
  const toroSpots = [[-4.2, -2.6], [4.2, -2.6], [-4.2, 2.4], [4.2, 2.4]];
  const toro = (x, z) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42).translate(0, 0.06, 0), stone));
    t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.75, 8).translate(0, 0.5, 0), stone));
    t.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.34).translate(0, 0.9, 0), stone));
    t.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24).translate(0, 1.05, 0), fireMat));
    t.add(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 4).rotateY(Math.PI / 4).translate(0, 1.28, 0), stone));
    t.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6).translate(0, 1.42, 0), stone));
    t.traverse((o) => { if (o.isMesh && o.material === stone) o.castShadow = true; });
    return t;
  };
  for (const [x, z] of toroSpots) group.add(toro(x, z));

  // cool moonlight from the ring; a whisper while locked, bright when open
  const light = new THREE.PointLight('#c8d6ff', 1.6, 14, 2);
  light.position.set(0, 2.2, 1.2);
  group.add(light);

  group.updateMatrixWorld(true);
  const center = new THREE.Vector3(0, cy, 0).applyMatrix4(group.matrixWorld);
  const at = (x, z, r) => {
    const v = new THREE.Vector3(x, 0, z).applyMatrix4(group.matrixWorld);
    return { x: v.x, z: v.z, r };
  };
  let open = 0;
  return {
    group, light,
    colliders: [
      at(-0.75, 0, 0.55), at(0.75, 0, 0.55),
      ...toroSpots.map(([x, z]) => at(x, z, 0.3)),
    ],
    interact: { center, radius: 2.1, reach: 6, gate: true },
    update(t, dt, unlocked, celebrate) {
      const target = celebrate ? 1 : unlocked ? 0.45 : 0;
      open += (target - open) * Math.min(1, dt * 0.8);
      veilMat.uniforms.uTime.value = t;
      veilMat.uniforms.uOpen.value = open;
      light.intensity = 1.6 + open * 6;
      inlayMat.emissiveIntensity = 0.75 + Math.sin(t * 0.7) * 0.2 + open * 2.5;
      fireMat.emissiveIntensity = 2.0 + Math.sin(t * 5.1) * 0.15 + open;
    },
  };
}

/* =============================== bunny =============================== */

export function createBunny(hf) {
  const group = new THREE.Group();
  const fur = new THREE.MeshPhysicalMaterial({ color: '#f4f1ec', roughness: 0.92, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.6 });
  const pink = new THREE.MeshStandardMaterial({ color: '#e8a2ad', roughness: 0.7 });
  const eye = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.15 });

  const body = new THREE.Group();
  group.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), fur);
  torso.scale.set(1, 0.9, 1.25);
  torso.position.y = 0.14;
  torso.castShadow = true;
  body.add(torso);
  const head = new THREE.Group();
  head.position.set(0, 0.25, 0.15);
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), fur);
  skull.scale.set(1, 0.95, 1.05);
  skull.castShadow = true;
  head.add(skull);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.04, 0.07, -0.01);
    ear.rotation.set(-0.2, 0, s * 0.18);
    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.13, 6, 10), fur);
    outer.position.y = 0.08;
    outer.scale.set(1, 1, 0.55);
    outer.castShadow = true;
    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.1, 4, 8), pink);
    inner.position.set(0, 0.08, 0.008);
    inner.scale.set(1, 1, 0.3);
    ear.add(outer, inner);
    head.add(ear);
    ears.push(ear);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), eye);
    e.position.set(s * 0.05, 0.02, 0.07);
    head.add(e);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), pink);
  nose.position.set(0, -0.01, 0.098);
  head.add(nose);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), fur);
  tail.position.set(0, 0.16, -0.18);
  body.add(tail);
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), fur);
    foot.scale.set(0.8, 0.5, 1.6);
    foot.position.set(s * 0.08, 0.025, -0.06);
    body.add(foot);
  }

  const st = {
    x: BUNNY_HOME.x, z: BUNNY_HOME.z, yaw: 0, mode: 'idle', timer: 2, hops: 0,
    hopT: 0, fromX: 0, fromZ: 0, toX: 0, toZ: 0, happy: 0, look: 0,
  };
  const startHop = (dir, dist) => {
    // never hop into the water or onto the path: turn around instead
    const tx = st.x + Math.sin(dir) * dist, tz = st.z + Math.cos(dir) * dist;
    if (hf.sample(tx, tz) < 0.25) dir += Math.PI;
    st.mode = 'hop';
    st.hopT = 0;
    st.fromX = st.x; st.fromZ = st.z;
    st.toX = st.x + Math.sin(dir) * dist;
    st.toZ = st.z + Math.cos(dir) * dist;
    st.yaw = dir;
  };

  const world = new THREE.Vector3();
  return {
    group,
    interact: { center: world, radius: 0.35, label: 'click to say hi', bunny: true },
    poke() { st.happy = 1.2; st.mode = 'happy'; st.timer = 1.4; },
    update(t, dt, player) {
      const dx = player.x - st.x, dz = player.z - st.z;
      const pd = Math.hypot(dx, dz);
      if (st.mode === 'idle') {
        st.timer -= dt;
        head.rotation.x = Math.sin(t * 6) * 0.08 * (Math.sin(t * 0.7) > 0.3 ? 1 : 0); // nibbling
        if (pd < 4) {
          // curious: turn to look at her
          const want = Math.atan2(dx, dz);
          st.yaw += Math.atan2(Math.sin(want - st.yaw), Math.cos(want - st.yaw)) * Math.min(1, dt * 2);
        }
        if (pd < 1.6) { st.hops = 3; startHop(Math.atan2(-dx, -dz) + (Math.random() - 0.5) * 0.8, 0.5); }
        else if (st.timer <= 0) {
          const hx = BUNNY_HOME.x - st.x, hz = BUNNY_HOME.z - st.z;
          const home = Math.hypot(hx, hz) > BUNNY_HOME.r * 0.8;
          const dir = home ? Math.atan2(hx, hz) + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
          st.hops = 2 + Math.floor(Math.random() * 4);
          startHop(dir, 0.42 + Math.random() * 0.12);
        }
      } else if (st.mode === 'hop') {
        st.hopT += dt / 0.34;
        const k = Math.min(st.hopT, 1);
        st.x = st.fromX + (st.toX - st.fromX) * k;
        st.z = st.fromZ + (st.toZ - st.fromZ) * k;
        body.position.y = Math.sin(Math.PI * k) * 0.16;
        body.rotation.x = Math.sin(Math.PI * 2 * k) * -0.25;
        torso.scale.set(1, 0.9 + Math.sin(Math.PI * k) * 0.12, 1.25 - Math.sin(Math.PI * k) * 0.1);
        if (k >= 1) {
          body.position.y = 0;
          body.rotation.x = 0;
          st.hops--;
          if (st.hops > 0) startHop(st.yaw + (Math.random() - 0.5) * 0.4, 0.42 + Math.random() * 0.12);
          else { st.mode = 'idle'; st.timer = 1.5 + Math.random() * 4; }
        }
      } else if (st.mode === 'happy') {
        // a little "binky": hop and spin
        st.timer -= dt;
        const k = 1 - st.timer / 1.4;
        body.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.3;
        body.rotation.y = k * Math.PI * 2;
        if (st.timer <= 0) { st.mode = 'idle'; st.timer = 2; body.position.y = 0; body.rotation.y = 0; }
      }
      ears.forEach((e, i) => { e.rotation.x = -0.2 + Math.sin(t * 2.3 + i * 1.7) * 0.06 + (pd < 4 ? 0.12 : 0); });
      group.position.set(st.x, hf.sample(st.x, st.z), st.z);
      group.rotation.y = st.yaw;
      world.set(st.x, group.position.y + 0.22, st.z);
    },
  };
}
