/* Hand-built set pieces: pierced-brass lantern posts along the path, the bench + letter at
   the end of the dock, the glass greenhouse (marble vase with the fully
   bloomed flower, the WORLD'S BEST REVA mug, string lights, plants) and
   Mr. Frundles the bunny. (The hilltop ending lives in finale.js.) Each returns its
   meshes, point lights, colliders and interactable spots. */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, mugTextTexture, glowTexture } from './util.js';
import { canvasTex } from './build.js';
import {
  DOCK, BENCH, BUNNY_HOME, mainPathAt, onDock,
} from './layout.js';

const WARM = new THREE.Color('#ffae66');

export function paint(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
export function merge(parts) {
  return mergeGeometries(parts.map((g) => {
    const n = nonIdx(g);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    return n;
  }));
}

/* =============================== lanterns =============================== */

/** Pierced brass for the lantern sides: a star, kawung petals and dots cut out (alphaTest). */
function piercedTexture() {
  return canvasTex(128, 192, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const star = (x, y, r) => {
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    };
    star(W / 2, H / 2, 26);
    for (const [x, y] of [[W * 0.27, H * 0.17], [W * 0.73, H * 0.17], [W * 0.27, H * 0.83], [W * 0.73, H * 0.83]]) star(x, y, 11);
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4;
      g.beginPath(); g.ellipse(W / 2 + Math.cos(a) * 40, H / 2 + Math.sin(a) * 40, 10, 4.5, a, 0, Math.PI * 2); g.fill();
    }
    for (let y = 14; y < H - 8; y += 20) for (const x of [14, W - 14]) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.fillRect(0, 0, W, 8); g.fillRect(0, H - 8, W, 8); g.fillRect(0, 0, 7, H); g.fillRect(W - 7, 0, 7, H);
  });
}

/** The pool the lantern throws on the path: a soft warm disc broken into faint
    rays by the piercing. Built from raw pixels with the light in the colour
    channels and alpha fixed at 1 (soft canvas alpha turns into coloured
    speckles in Safari — the "confetti"). Use with additive blending. */
function poolTexture(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const h = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - h, dy = y + 0.5 - h;
      const t = Math.min(Math.hypot(dx, dy) / h, 1);
      const base = Math.pow(1 - t, 1.7);
      const ray = Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(dy, dx) * 12), 3);
      const shade = 1 - 0.32 * ray * Math.min(Math.max((t - 0.1) / 0.25, 0), 1);
      const v = Math.round(255 * base * shade);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** Javanese-modern lantern posts along the path: a stepped paras-stone umpak,
    a teak post with bronze bands and a carved bracket, a pierced-brass lantern
    with a warm core, a patterned light pool on the path and a jasmine planter. */
export function createLanterns(hf, messages) {
  const group = new THREE.Group();
  const lanterns = [];
  const fractions = [0.075, 0.27, 0.45, 0.63, 0.86];
  const rng = mulberry32(19);
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#ddd2bf', roughness: 0.85 });
  const teakMat = new THREE.MeshStandardMaterial({ color: '#6e4224', roughness: 0.5 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.3, metalness: 0.9 });
  const piercedMat = new THREE.MeshStandardMaterial({ map: piercedTexture(), color: '#c9a25a', roughness: 0.35, metalness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3f6b35', roughness: 0.6, side: THREE.DoubleSide });
  const bloomMat = new THREE.MeshStandardMaterial({ color: '#fbf6ea', emissive: '#f6e6c0', emissiveIntensity: 0.3 });
  const poolTex = poolTexture();
  const LX = 0.66, LY = 2.1; // the lantern hangs here (local), out over the path

  // geometry shared by every post, built once in post-local space
  const stone = [], teak = [], brass = [], pierced = [], leaf = [], bloom = [];
  stone.push(new THREE.BoxGeometry(0.46, 0.5, 0.46).translate(0, -0.11, 0));
  stone.push(new THREE.BoxGeometry(0.36, 0.12, 0.36).translate(0, 0.2, 0));
  stone.push(new THREE.BoxGeometry(0.26, 0.06, 0.26).translate(0, 0.29, 0));
  teak.push(new THREE.BoxGeometry(0.12, 2.3, 0.12).translate(0, 1.47, 0));
  teak.push(new THREE.BoxGeometry(0.2, 0.08, 0.2).translate(0, 2.64, 0));
  teak.push(new THREE.BoxGeometry(0.15, 0.06, 0.15).translate(0, 2.71, 0));
  teak.push(new THREE.BoxGeometry(0.82, 0.08, 0.08).translate(0.37, 2.55, 0));
  teak.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.06, 2.0, 0), new THREE.Vector3(0.1, 2.5, 0), new THREE.Vector3(0.56, 2.52, 0)), 16, 0.026, 6));
  teak.push(new THREE.TorusGeometry(0.05, 0.018, 6, 14, Math.PI * 1.5).translate(0.8, 2.5, 0));
  for (const y of [0.5, 1.45, 2.38]) brass.push(new THREE.BoxGeometry(0.135, 0.035, 0.135).translate(0, y, 0));
  brass.push(new THREE.ConeGeometry(0.05, 0.14, 4).rotateY(Math.PI / 4).translate(0, 2.81, 0));
  brass.push(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4).translate(LX, 2.44, 0));
  // the lantern: frame, pyramid cap with finial, base plate and drop
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) brass.push(new THREE.BoxGeometry(0.02, 0.36, 0.02).translate(LX + sx * 0.12, LY, sz * 0.12));
  brass.push(new THREE.BoxGeometry(0.28, 0.03, 0.28).translate(LX, LY + 0.19, 0));
  brass.push(new THREE.ConeGeometry(0.2, 0.15, 4).rotateY(Math.PI / 4).translate(LX, LY + 0.28, 0));
  brass.push(new THREE.SphereGeometry(0.025, 10, 8).translate(LX, LY + 0.37, 0));
  brass.push(new THREE.BoxGeometry(0.27, 0.03, 0.27).translate(LX, LY - 0.19, 0));
  brass.push(new THREE.ConeGeometry(0.05, 0.12, 4).rotateX(Math.PI).rotateY(Math.PI / 4).translate(LX, LY - 0.27, 0));
  brass.push(new THREE.SphereGeometry(0.018, 8, 6).translate(LX, LY - 0.34, 0));
  for (let k = 0; k < 4; k++) {
    const p = new THREE.PlaneGeometry(0.24, 0.36).translate(0, 0, 0.12).rotateY((k * Math.PI) / 2).translate(LX, LY, 0);
    pierced.push(p);
  }
  // the jasmine planter at the foot of the post
  for (let i = 0; i < 26; i++) {
    const a = rng() * 6.28, r = rng() * 0.17;
    leaf.push(new THREE.PlaneGeometry(0.05, 0.1).rotateX(-0.6 - rng()).rotateY(a).translate(-0.3 + Math.cos(a) * r, 0.27 + rng() * 0.14, 0.22 + Math.sin(a) * r));
  }
  for (let i = 0; i < 16; i++) bloom.push(new THREE.OctahedronGeometry(0.014).translate(-0.3 + (rng() - 0.5) * 0.3, 0.33 + rng() * 0.12, 0.22 + (rng() - 0.5) * 0.3));
  const shared = [[stone, stoneMat], [teak, teakMat], [brass, brassMat], [pierced, piercedMat], [leaf, leafMat], [bloom, bloomMat]].map(([parts, mat]) => [merge(parts), mat]);
  const bowl = new THREE.CylinderGeometry(0.205, 0.155, 0.245, 18).translate(-0.3, 0.12, 0.22);
  const coreGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.28, 12);

  fractions.forEach((f, i) => {
    const pt = mainPathAt(f);
    const side = i % 2 === 0 ? 1 : -1;
    const nx = -pt.tz * side, nz = pt.tx * side; // perpendicular, pointing away from the path
    const px = pt.x + nx * 1.85, pz = pt.z + nz * 1.85;
    const y = hf.sample(px, pz);

    const lg = new THREE.Group();
    lg.position.set(px, y, pz);
    lg.rotation.y = Math.atan2(nz, -nx); // local +x (the bracket) reaches back over the path
    for (const [geo, mat] of shared) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = mat !== leafMat && mat !== bloomMat;
      mesh.receiveShadow = true;
      lg.add(mesh);
    }
    lg.add(new THREE.Mesh(bowl, stoneMat));
    const paper = new THREE.MeshStandardMaterial({ color: '#ffe6c0', emissive: '#ffa45a', emissiveIntensity: 1.2, roughness: 0.6 });
    const body = new THREE.Mesh(coreGeo, paper);
    body.position.set(LX, LY, 0);
    lg.add(body);

    const light = new THREE.PointLight(WARM, 3, 16, 2);
    light.position.set(LX, LY, 0);
    lg.add(light);
    group.add(lg);

    // the patterned light pool, laid on the path below the lantern
    lg.updateMatrixWorld(true);
    const under = new THREE.Vector3(LX, 0, 0).applyMatrix4(lg.matrixWorld);
    const poolMat = new THREE.MeshBasicMaterial({
      map: poolTex, color: new THREE.Color(0.42, 0.26, 0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4,
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4).rotateX(-Math.PI / 2), poolMat);
    pool.position.set(under.x, hf.sample(under.x, under.z) + 0.05, under.z);
    pool.rotation.y = rng() * 6.28;
    pool.renderOrder = 1;
    group.add(pool);

    const world = new THREE.Vector3();
    body.getWorldPosition(world);
    lanterns.push({
      index: i, group: lg, paper, light, pool: poolMat, world, read: false, glow: 0, seed: Math.random() * 10,
      collider: { x: px, z: pz, r: 0.3 },
      interact: { center: world.clone(), radius: 0.9, label: 'click to warm the lantern', message: messages[i] || '' },
    });
  });

  const base = new THREE.Color(0.42, 0.26, 0.12);
  return {
    group, lanterns,
    update(t, dt, celebrate) {
      for (const l of lanterns) {
        const flick = 0.92 + Math.sin(t * 7.3 + l.seed) * 0.04 + Math.sin(t * 13.1 + l.seed * 2) * 0.03;
        const pulse = l.read ? 0 : (Math.sin(t * 1.4 + l.seed) * 0.5 + 0.5) * 0.5;
        const target = (l.read || celebrate ? 3.4 : 1.15 + pulse) * flick;
        l.glow += (target - l.glow) * Math.min(1, dt * 2.5);
        l.paper.emissiveIntensity = l.glow * 1.3;
        l.light.intensity = l.glow * (l.read || celebrate ? 3.2 : 2.2);
        l.pool.color.copy(base).multiplyScalar(0.5 + Math.min(l.glow, 2.2) * 0.3);
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

export function vaseGeometry() {
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

export function bloomedFlower() {
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

export function mug() {
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

export function pot(rng, x, y, z, scale) {
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

  const home = { x: BUNNY_HOME.x, z: BUNNY_HOME.z, r: BUNNY_HOME.r };
  const st = {
    x: BUNNY_HOME.x, z: BUNNY_HOME.z, yaw: 0, mode: 'idle', timer: 2, hops: 0,
    hopT: 0, hopDur: 0.34, fromX: 0, fromZ: 0, toX: 0, toZ: 0, happy: 0, look: 0,
    route: null, ri: 0, onArrive: null,
  };
  const startHop = (dir, dist, free = false) => {
    // never hop into the water: turn around instead (guided hops follow the route)
    if (!free) {
      const tx = st.x + Math.sin(dir) * dist, tz = st.z + Math.cos(dir) * dist;
      if (!onDock(tx, tz) && hf.sample(tx, tz) < 0.25) dir += Math.PI;
    }
    st.mode = 'hop';
    st.hopT = 0;
    st.hopDur = st.route ? 0.3 : 0.34;
    st.fromX = st.x; st.fromZ = st.z;
    st.toX = st.x + Math.sin(dir) * dist;
    st.toZ = st.z + Math.cos(dir) * dist;
    st.yaw = dir;
  };
  let onStep = null, onPoof = null;

  // bigger than life so she can spot it in the grass, wrapped in a faint glow
  const SIZE = 1.5;
  group.scale.setScalar(SIZE);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(64, 2.2), color: new THREE.Color(0.75, 0.82, 1.0), blending: THREE.AdditiveBlending,
    transparent: true, opacity: 0.4, depthWrite: false,
  }));
  aura.scale.setScalar(0.85);
  aura.position.y = 0.16;
  group.add(aura);

  const world = new THREE.Vector3();
  return {
    group,
    interact: { center: world, radius: 0.35 * SIZE, label: 'Mr. Frundles', bunny: true },
    poke() { st.happy = 1.2; st.mode = 'happy'; st.timer = 1.4; },
    get x() { return st.x; },
    get z() { return st.z; },
    get guiding() { return !!st.route; },
    set onStep(fn) { onStep = fn; },
    set onPoof(fn) { onPoof = fn; },
    teleport(x, z) { st.x = x; st.z = z; st.mode = 'idle'; st.timer = 0.5; },
    setHome(x, z, r = 1.5) { home.x = x; home.z = z; home.r = r; },
    /** Lead her along a list of [x, z] points; onArrive fires at the end. */
    guide(route, onArrive) {
      st.route = route.map(([x, z]) => ({ x, z }));
      st.ri = 0;
      st.onArrive = onArrive || null;
    },
    stopGuiding() { st.route = null; },
    update(t, dt, player) {
      const dx = player.x - st.x, dz = player.z - st.z;
      const pd = Math.hypot(dx, dz);
      const lookAtHer = (rate) => {
        const want = Math.atan2(dx, dz);
        st.yaw += Math.atan2(Math.sin(want - st.yaw), Math.cos(want - st.yaw)) * Math.min(1, dt * rate);
      };
      if (st.route && st.mode !== 'hop' && st.mode !== 'happy') {
        // guiding: wait for her when she falls behind, then hop on toward the next point
        let tgt = st.route[st.ri];
        while (tgt && Math.hypot(tgt.x - st.x, tgt.z - st.z) < 0.4) tgt = st.route[++st.ri];
        if (!tgt) {
          const end = st.route[st.route.length - 1];
          st.route = null;
          home.x = end.x; home.z = end.z; home.r = 1.2;
          st.mode = 'idle'; st.timer = 2;
          const cb = st.onArrive; st.onArrive = null;
          if (cb) cb();
        } else {
          const end = st.route[st.route.length - 1];
          const herToEnd = Math.hypot(end.x - player.x, end.z - player.z);
          const meToEnd = Math.hypot(end.x - st.x, end.z - st.z);
          if (pd > 14 && herToEnd < meToEnd - 4) {
            // she ran ahead: pop up a little further along the route, near her
            let j = st.ri, best = 1e9;
            for (let i = st.ri; i < st.route.length; i++) {
              const d = Math.hypot(st.route[i].x - player.x, st.route[i].z - player.z);
              if (d < best) { best = d; j = i; }
            }
            j = Math.min(j + 3, st.route.length - 1);
            if (onPoof) onPoof(st.x, st.z);
            st.x = st.route[j].x; st.z = st.route[j].z; st.ri = j;
            if (onPoof) onPoof(st.x, st.z);
          } else if (pd > 7) {
            st.mode = 'wait';
            lookAtHer(3);
            head.rotation.x = 0;
          } else if (st.mode !== 'wait' || pd < 4.5) {
            const dist = Math.min(0.6, Math.hypot(tgt.x - st.x, tgt.z - st.z));
            startHop(Math.atan2(tgt.x - st.x, tgt.z - st.z), dist, true);
          } else {
            lookAtHer(3);
          }
        }
      } else if (st.mode === 'idle') {
        st.timer -= dt;
        head.rotation.x = Math.sin(t * 6) * 0.08 * (Math.sin(t * 0.7) > 0.3 ? 1 : 0); // nibbling
        if (pd < 4) lookAtHer(2); // curious: turn to look at her
        if (pd < 1.6) { st.hops = 3; startHop(Math.atan2(-dx, -dz) + (Math.random() - 0.5) * 0.8, 0.5); }
        else if (st.timer <= 0) {
          const hx = home.x - st.x, hz = home.z - st.z;
          const far = Math.hypot(hx, hz) > home.r * 0.8;
          const dir = far ? Math.atan2(hx, hz) + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
          st.hops = 2 + Math.floor(Math.random() * 4);
          startHop(dir, 0.42 + Math.random() * 0.12);
        }
      } else if (st.mode === 'hop') {
        st.hopT += dt / st.hopDur;
        const k = Math.min(st.hopT, 1);
        st.x = st.fromX + (st.toX - st.fromX) * k;
        st.z = st.fromZ + (st.toZ - st.fromZ) * k;
        body.position.y = Math.sin(Math.PI * k) * 0.16;
        body.rotation.x = Math.sin(Math.PI * 2 * k) * -0.25;
        torso.scale.set(1, 0.9 + Math.sin(Math.PI * k) * 0.12, 1.25 - Math.sin(Math.PI * k) * 0.1);
        if (k >= 1) {
          body.position.y = 0;
          body.rotation.x = 0;
          if (st.route) { st.mode = 'guide'; if (onStep) onStep(st.x, st.z, st.yaw); }
          else {
            st.hops--;
            if (st.hops > 0) startHop(st.yaw + (Math.random() - 0.5) * 0.4, 0.42 + Math.random() * 0.12);
            else { st.mode = 'idle'; st.timer = 1.5 + Math.random() * 4; }
          }
        }
      } else if (st.mode === 'happy') {
        // a little "binky": hop and spin
        st.timer -= dt;
        const k = 1 - st.timer / 1.4;
        body.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.3;
        body.rotation.y = k * Math.PI * 2;
        if (st.timer <= 0) { st.mode = st.route ? 'guide' : 'idle'; st.timer = 2; body.position.y = 0; body.rotation.y = 0; }
      }
      ears.forEach((e, i) => { e.rotation.x = -0.2 + Math.sin(t * 2.3 + i * 1.7) * 0.06 + (pd < 4 ? 0.12 : 0); });
      group.position.set(st.x, hf.walkHeight(st.x, st.z, group.position.y + 0.5), st.z);
      group.rotation.y = st.yaw;
      aura.material.opacity = 0.34 + Math.sin(t * 1.4) * 0.08;
      world.set(st.x, group.position.y + 0.22 * SIZE, st.z);
    },
  };
}
