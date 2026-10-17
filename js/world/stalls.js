/* The food and drink on the pier, five-star and maximalist:
   - Es puter (on the boardwalk by the gate): a traditional Javanese gerobak —
     lacquered green body with painted floral panels, teak frame and brass
     bands, big spoked wheels, a striped cloth canopy with tassels and a
     petromax lamp, the wooden churn barrel with its hand crank, a glass case of
     cones, cups and roti buns, and brass pozzetti whose lids lift as she picks
     a flavour. The brass bell hangs from a teak yoke beside it.
   - Reva Maia's Nhà Việt (west pod): a red-lacquered two-tier pavilion with
     upturned tiled eaves and two dragons guarding a moon on the ridge, lattice
     friezes, a cluster of Hội An silk lanterns, bird-cage lamps, lacquer art,
     ceramic jars, an herb wall, a noodle station, and a counter of distinctive
     plates: phở on a lacquer tray with its herb plate, gỏi cuốn on banana leaf,
     bánh mì in paper sleeves, bánh xèo, egg coffee, coconut coffee, chè, a lotus
     tea set and a fruit stand. Dining and a low tea corner look over the lake.
   - The jamu bar (east pod): a cocktail bar for jamu under a joglo roof — a
     carved gebyok back bar framing a mirrored, backlit wall of bottles, a
     backlit onyx bar with a brass foot rail, brass jamu taps, bar tools,
     garnish trays, a copper kettle, a hanging stemware rack, velvet stools,
     brass pendants, a lounge corner, and a tasting ledge on the water. */

import * as THREE from 'three';
import { mulberry32, cloudTexture } from './util.js';
import { PIER, CART_BAYS } from './layout.js';
import { merge } from './props.js';
import { V, beam, rod, canvasTex, signTexture, kawungPanelTexture, teakTexture, sirapTexture, shadowAll } from './build.js';
import { FLAVORS, JAMU, phoBowl, jamuGlass, martabakManis, martabakTelur } from './food.js';
import { caneTexture, batikTexture, orchid, palmFronds } from './greenhouse.js';

const Y = PIER.deckY;

/* ---------------- shared materials ---------------- */
const mats = () => ({
  brass: new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.28, metalness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: '#d8ae55', roughness: 0.3, metalness: 0.95 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.35, metalness: 0.85 }),
  steel: new THREE.MeshStandardMaterial({ color: '#dfe2e4', roughness: 0.22, metalness: 0.85 }),
  copper: new THREE.MeshStandardMaterial({ color: '#b8683a', roughness: 0.3, metalness: 0.95 }),
  teak: new THREE.MeshStandardMaterial({ map: teakTexture(), roughness: 0.45 }),
  darkTeak: new THREE.MeshStandardMaterial({ map: teakTexture('#4a2a16'), roughness: 0.4 }),
  lacquer: new THREE.MeshPhysicalMaterial({ color: '#2a140d', roughness: 0.3, clearcoat: 0.8 }),
  red: new THREE.MeshPhysicalMaterial({ color: '#7a1a12', roughness: 0.3, clearcoat: 0.8 }),
  green: new THREE.MeshPhysicalMaterial({ color: '#2f5a44', roughness: 0.35, clearcoat: 0.7 }),
  marble: new THREE.MeshPhysicalMaterial({ color: '#f3efe8', roughness: 0.15, clearcoat: 0.9 }),
  nero: new THREE.MeshPhysicalMaterial({ color: '#1d1a19', roughness: 0.18, clearcoat: 0.9 }),
  white: new THREE.MeshPhysicalMaterial({ color: '#f7f5f0', roughness: 0.2, clearcoat: 0.8 }),
  cream: new THREE.MeshPhysicalMaterial({ color: '#f1e8d6', roughness: 0.3, clearcoat: 0.6 }),
  warm: new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 2.4 }),
  soft: new THREE.MeshStandardMaterial({ color: '#fff0d4', emissive: '#ffbf72', emissiveIntensity: 1.1 }),
  cane: new THREE.MeshStandardMaterial({ map: caneTexture(), roughness: 0.8, side: THREE.DoubleSide }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#f4fbff', transparent: true, opacity: 0.22, roughness: 0.04, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
  leaf: new THREE.MeshStandardMaterial({ color: '#3f7a32', roughness: 0.55, side: THREE.DoubleSide }),
  stone: new THREE.MeshStandardMaterial({ color: '#d9cfbd', roughness: 0.85 }),
  velvet: new THREE.MeshStandardMaterial({ color: '#1f4a3c', roughness: 0.95 }),
  mirror: new THREE.MeshStandardMaterial({ color: '#d6cab4', roughness: 0.05, metalness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: '#2a1f1a', roughness: 0.7 }),
});
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const lathe = (pts, seg = 24) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/* ---------------- textures ---------------- */

function tileTexture() {
  return canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#3a2620'; g.fillRect(0, 0, W, H);
    for (let y = 0, r = 0; y < H; y += 16, r++) {
      for (let x = (r % 2) * 10; x < W + 20; x += 20) {
        const v = 70 + ((x * 7 + y * 13) % 30);
        g.fillStyle = `rgb(${v + 34},${v},${v - 16})`;
        g.beginPath(); g.ellipse(x + 10, y + 12, 9, 9, 0, Math.PI, 0); g.fill();
        g.fillRect(x + 1, y + 2, 18, 10);
      }
    }
  }, { repeat: [1, 1] });
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
    g.fillRect(0, 0, W, 5); g.fillRect(0, H - 5, W, 5);
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

/** Vietnamese lacquer painting: gold leaf and eggshell inlay on black-red. */
function lacquerArtTexture(kind) {
  return canvasTex(256, 320, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#190706'); grd.addColorStop(1, kind ? '#4a0e08' : '#2a0906');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const rng = mulberry32(kind ? 5 : 9);
    // an eggshell moon, crazed
    g.fillStyle = '#efe5cc'; g.beginPath(); g.arc(W * 0.68, H * 0.2, 36, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,30,20,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const a = rng() * 6.28, r = rng() * 34;
      g.beginPath(); g.moveTo(W * 0.68 + Math.cos(a) * r, H * 0.2 + Math.sin(a) * r);
      g.lineTo(W * 0.68 + Math.cos(a + 0.6) * (r * 0.6), H * 0.2 + Math.sin(a + 0.6) * (r * 0.6)); g.stroke();
    }
    if (kind === 0) {
      // lotus pond in gold leaf
      for (let i = 0; i < 6; i++) {
        const x = 30 + rng() * (W - 60), y = H * 0.62 + rng() * H * 0.3, r = 18 + rng() * 20;
        g.fillStyle = `rgba(212,165,72,${0.75 + rng() * 0.25})`;
        g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0.3, Math.PI * 2 - 0.3); g.lineTo(x, y); g.fill();
        g.strokeStyle = '#8a6224'; g.lineWidth = 1;
        for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(k * 0.8) * r, y + Math.sin(k * 0.8) * r * 0.45); g.stroke(); }
      }
      for (let i = 0; i < 3; i++) {
        const x = 50 + i * 75, y = H * 0.5 + i * 18;
        g.strokeStyle = '#c9963c'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y + 60, x - 6, H * 0.9); g.stroke();
        for (let k = -2; k <= 2; k++) {
          g.fillStyle = k === 0 ? '#f0b0a0' : '#e08a78';
          g.beginPath(); g.ellipse(x + k * 7, y - 10, 6, 18, k * 0.35, 0, Math.PI * 2); g.fill();
        }
      }
    } else {
      // two cranes in eggshell and gold
      for (const [x, y, s] of [[90, 170, 1], [160, 230, -1]]) {
        g.fillStyle = '#efe5cc';
        g.beginPath(); g.ellipse(x, y, 30, 13, s * 0.3, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#efe5cc'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x + s * 22, y - 6); g.quadraticCurveTo(x + s * 40, y - 50, x + s * 30, y - 62); g.stroke();
        g.fillStyle = '#c43a2a'; g.beginPath(); g.arc(x + s * 30, y - 64, 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#d4a548';
        g.beginPath(); g.moveTo(x - s * 5, y - 6); g.quadraticCurveTo(x - s * 40, y - 70, x - s * 70, y - 40); g.quadraticCurveTo(x - s * 30, y - 20, x - s * 5, y - 6); g.fill();
        g.strokeStyle = '#d4a548'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x - s * 4, y + 50); g.stroke();
      }
      g.fillStyle = 'rgba(212,165,72,0.8)';
      for (let i = 0; i < 40; i++) g.fillRect(rng() * W, H * 0.8 + rng() * H * 0.18, 3 + rng() * 10, 1.5);
    }
    g.strokeStyle = '#c9a25a'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  });
}

/** Javanese gebyok carving: vine scrolls, leaves and a crest, cut out (alphaTest). */
function gebyokTexture() {
  return canvasTex(512, 160, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round';
    const wood = '#7d4c28', hi = '#a8703e';
    g.strokeStyle = wood; g.fillStyle = wood;
    g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12);
    for (const s of [-1, 1]) {
      for (const [col, wdt, off] of [[wood, 7, 0], [hi, 2, -1.5]]) {
        g.strokeStyle = col; g.lineWidth = wdt;
        g.beginPath();
        for (let t = 0; t <= 1.0001; t += 0.02) {
          const x = W / 2 + s * (70 + t * (W / 2 - 90)), y = H / 2 + Math.sin(t * Math.PI * 3) * 32 + off;
          if (t === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.5) / 6;
        const x = W / 2 + s * (70 + t * (W / 2 - 90)), y = H / 2 + Math.sin(t * Math.PI * 3) * 32;
        const up = Math.cos(t * Math.PI * 3) > 0 ? -1 : 1;
        g.strokeStyle = wood; g.lineWidth = 5;
        g.beginPath(); g.arc(x + s * 12, y + up * 18, 14, 0, Math.PI * 1.6); g.stroke();
        g.beginPath(); g.arc(x + s * 12, y + up * 18, 6, 0, Math.PI * 1.7); g.stroke();
        g.fillStyle = wood;
        g.beginPath(); g.ellipse(x - s * 10, y - up * 16, 14, 6, s * up * 0.7, 0, Math.PI * 2); g.fill();
        g.fillStyle = hi;
        g.beginPath(); g.ellipse(x - s * 10, y - up * 16, 9, 2, s * up * 0.7, 0, Math.PI * 2); g.fill();
      }
    }
    // the central crest (a small gunungan) and a lotus
    g.fillStyle = wood;
    g.beginPath(); g.moveTo(W / 2 - 62, H - 8); g.quadraticCurveTo(W / 2 - 50, 10, W / 2, 8); g.quadraticCurveTo(W / 2 + 50, 10, W / 2 + 62, H - 8); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let r = 0; r < 4; r++) for (let k = -r; k <= r; k++) { g.beginPath(); g.arc(W / 2 + k * 18, 40 + r * 24, 6, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = hi;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(W / 2 + k * 9, H - 30, 5, 16, k * 0.3, 0, Math.PI * 2); g.fill(); }
  });
}

/** Amber onyx, for the backlit bar front. */
function onyxTexture() {
  return canvasTex(256, 256, (g, W, H) => {
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#e9a24e'); grd.addColorStop(0.5, '#f7d295'); grd.addColorStop(1, '#df8e3e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const rng = mulberry32(23);
    for (let i = 0; i < 46; i++) {
      g.strokeStyle = rng() < 0.55 ? `rgba(150,70,18,${0.12 + rng() * 0.25})` : `rgba(255,246,222,${0.2 + rng() * 0.35})`;
      g.lineWidth = 1 + rng() * 6;
      let y = rng() * H;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= W; x += 8) { y += (rng() - 0.5) * 8; g.lineTo(x, y + Math.sin(x * 0.03 + i) * 10); }
      g.stroke();
    }
  });
}

/** The es puter's painted side panel: cream ground, green border, roses, retro lettering. */
function puterPanelTexture(title) {
  return canvasTex(512, 170, (g, W, H) => {
    g.fillStyle = '#f3ead2'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f5a44'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14);
    g.strokeStyle = '#b8322a'; g.lineWidth = 3; g.strokeRect(20, 20, W - 40, H - 40);
    const rose = (x, y, r) => {
      g.fillStyle = '#4a7a3a';
      for (const a of [0.6, 2.4, 4.0]) { g.beginPath(); g.ellipse(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.1, r * 0.9, r * 0.38, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#c43a3a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#7a1a1a'; g.lineWidth = 2;
      g.beginPath(); for (let t = 0; t < 12; t += 0.2) { const rr = r * (1 - t / 13); g.lineTo(x + Math.cos(t) * rr * 0.8, y + Math.sin(t) * rr * 0.8); } g.stroke();
      g.fillStyle = '#f0c040'; g.beginPath(); g.arc(x + r * 1.5, y - r * 0.9, r * 0.35, 0, Math.PI * 2); g.fill();
    };
    if (title) {
      rose(62, H / 2, 20); rose(W - 62, H / 2, 20);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `italic bold ${Math.round(Math.min(H * 0.5, 900 / Math.max(title.length, 5)))}px Georgia, serif`;
      g.fillStyle = '#2f5a44'; g.fillText(title, W / 2 + 3, H / 2 + 4);
      g.fillStyle = '#b8322a'; g.fillText(title, W / 2, H / 2);
    } else {
      rose(W / 2, H / 2, 26); rose(W / 2 - 110, H / 2 + 10, 15); rose(W / 2 + 110, H / 2 - 6, 15);
    }
  });
}

function stripeTexture(a, b, n = 8) {
  return canvasTex(256, 64, (g, W, H) => {
    g.fillStyle = a; g.fillRect(0, 0, W, H);
    g.fillStyle = b;
    for (let i = 0; i < n; i++) g.fillRect((i + 0.5) * (W / n), 0, W / n / 2, H);
  });
}

/* ---------------- roofs ---------------- */

/** One sloped face a→b at the eave up to d→c, outward-facing, tile UVs in metres × s. */
export function quadGeo(a, b, c, d, s = 0.5) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([...a.toArray(), ...c.toArray(), ...b.toArray(), ...a.toArray(), ...d.toArray(), ...c.toArray()], 3));
  const ab = b.clone().sub(a); const w = ab.length(); ab.normalize();
  const h = (a.distanceTo(d) + b.distanceTo(c)) / 2;
  const ud = d.clone().sub(a).dot(ab), uc = c.clone().sub(a).dot(ab);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, uc, h, w, 0, 0, 0, ud, h, uc, h].map((v) => v * s), 2));
  geo.computeVertexNormals();
  return geo;
}
/** Four faces from an outer rectangle (half sizes ax, az at y0) to an inner one (bx, bz at y1). bz = 0 → a ridge. */
export function frustum(ax, az, y0, bx, bz, y1, s = 0.5) {
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const out = [];
  for (let k = 0; k < 4; k++) {
    const [sx, sz] = C[k], [tx, tz] = C[(k + 1) % 4];
    out.push(quadGeo(V(sx * ax, y0, sz * az), V(tx * ax, y0, tz * az), V(tx * bx, y1, tz * bz), V(sx * bx, y1, sz * bz), s));
  }
  return out;
}
export function hips(ax, az, y0, bx, bz, y1, t, out) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) beam(V(sx * ax, y0 + 0.03, sz * az), V(sx * bx, y1 + 0.03, sz * bz), t, out);
}
/** A Vietnamese upturned eave corner (đầu đao) at the corner of a roof tier. */
function upturn(x, y, z, out, r = 0.05, size = 1) {
  const d = V(Math.sign(x), 0, Math.sign(z)).normalize();
  const P = V(x, y, z);
  const at = (k, up) => P.clone().addScaledVector(d, k * size).add(V(0, up * size, 0));
  out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([at(-0.8, 0.3), at(-0.3, 0.12), at(0, 0.06), at(0.3, 0.2), at(0.42, 0.5), at(0.32, 0.7), at(0.2, 0.66)]), 20, r, 6));
}

/* ---------------- Nhà Việt pieces ---------------- */

function silkLantern(color) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.03 + Math.sin(Math.PI * t) * 0.17, t * 0.42)); }
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.7, side: THREE.DoubleSide })));
  const gold = new THREE.MeshStandardMaterial({ color: '#d9a640', roughness: 0.35, metalness: 0.8 });
  const gp = [];
  gp.push(new THREE.CylinderGeometry(0.05, 0.045, 0.04, 12).translate(0, 0.43, 0));
  gp.push(new THREE.CylinderGeometry(0.045, 0.05, 0.035, 12).translate(0, -0.012, 0));
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    gp.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.filter((_, i) => i % 2 === 0).map((p) => V(Math.cos(a) * (p.x + 0.004), p.y, Math.sin(a) * (p.x + 0.004)))), 10, 0.003, 3));
  }
  g.add(new THREE.Mesh(merge(gp), gold));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 8).translate(0, -0.15, 0), new THREE.MeshStandardMaterial({ color: '#b81e1e', roughness: 0.8 })));
  return g;
}

function rattanPendant(cane, warm) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), cane));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), warm);
  bulb.position.y = 0.02;
  g.add(bulb);
  return g;
}

/** A bird-cage lamp: brass bars round a warm bulb, a dome and a hook. */
function birdCage(m) {
  const g = new THREE.Group();
  const parts = [];
  parts.push(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 20));
  parts.push(new THREE.TorusGeometry(0.17, 0.008, 6, 24).rotateX(Math.PI / 2).translate(0, 0.2, 0));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const pts = [V(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17), V(Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17), V(Math.cos(a) * 0.1, 0.43, Math.sin(a) * 0.1), V(0, 0.48, 0)];
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.004, 3));
  }
  parts.push(new THREE.TorusGeometry(0.035, 0.007, 6, 14).translate(0, 0.52, 0));
  g.add(new THREE.Mesh(merge(parts), m.gold));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8).scale(1, 1.3, 1).translate(0, 0.16, 0), m.warm);
  g.add(bulb);
  return g;
}

function ceramicJar(mat, s = 1) {
  return new THREE.Mesh(lathe([[0, 0], [0.16, 0], [0.24, 0.08], [0.3, 0.26], [0.27, 0.44], [0.16, 0.54], [0.13, 0.58], [0.15, 0.6], [0.13, 0.6]].map(([r, y]) => [r * s, y * s]), 28), mat);
}

/** Leaves scattered in a box, as flat quads (herbs, garnish, salad). */
function leaves(rng, n, cx, cy, cz, sx, sy, sz, size, out) {
  for (let i = 0; i < n; i++) {
    out.push(new THREE.PlaneGeometry(size * 0.55, size).rotateX(-Math.PI / 2 + (rng() - 0.5) * 1.6).rotateY(rng() * 6.28)
      .translate(cx + (rng() - 0.5) * sx, cy + rng() * sy, cz + (rng() - 0.5) * sz));
  }
}

/** Phở on a red lacquer tray, with its plate of herbs, sprouts, lime and chili, sauces and chopsticks. */
function phoTray(m, rng) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.4).translate(0, 0.012, 0), m.red));
  const rim = [];
  for (const s of [-1, 1]) { rim.push(new THREE.BoxGeometry(0.62, 0.03, 0.015).translate(0, 0.035, s * 0.2)); rim.push(new THREE.BoxGeometry(0.015, 0.03, 0.4).translate(s * 0.31, 0.035, 0)); }
  g.add(new THREE.Mesh(merge(rim), m.gold));
  const bowl = phoBowl();
  bowl.position.set(-0.13, 0.025, 0);
  g.add(bowl);
  const plate = new THREE.Mesh(lathe([[0, 0], [0.07, 0], [0.1, 0.012], [0.095, 0.014], [0, 0.006]], 24), m.white);
  plate.position.set(0.17, 0.025, -0.05);
  g.add(plate);
  const herb = [];
  leaves(rng, 22, 0.15, 0.04, -0.07, 0.11, 0.03, 0.1, 0.04, herb);
  g.add(new THREE.Mesh(merge(herb), m.leaf));
  const sprouts = [];
  for (let i = 0; i < 18; i++) sprouts.push(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4).rotateZ(Math.PI / 2 + (rng() - 0.5)).rotateY(rng() * 6).translate(0.2 + (rng() - 0.5) * 0.06, 0.04 + rng() * 0.012, -0.02 + (rng() - 0.5) * 0.05));
  g.add(new THREE.Mesh(merge(sprouts), std('#f2eedd')));
  const lime = [];
  for (let i = 0; i < 3; i++) lime.push(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateY(i * 0.8).translate(0.12 + i * 0.03, 0.045, 0.0));
  g.add(new THREE.Mesh(merge(lime), std('#8cc04a')));
  const chili = [];
  for (let i = 0; i < 6; i++) chili.push(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 10).translate(0.22 + (rng() - 0.5) * 0.03, 0.038, -0.1 + (rng() - 0.5) * 0.03));
  g.add(new THREE.Mesh(merge(chili), std('#d42a1a')));
  for (const [c, x] of [['#5a2412', 0.12], ['#c8261a', 0.2]]) {
    const dish = new THREE.Mesh(lathe([[0, 0], [0.025, 0], [0.03, 0.014], [0.028, 0.014], [0, 0.004]], 16), m.white);
    dish.position.set(x, 0.025, 0.13); g.add(dish);
    const sauce = new THREE.Mesh(new THREE.CircleGeometry(0.025, 14).rotateX(-Math.PI / 2), std(c, { roughness: 0.15 }));
    sauce.position.set(x, 0.037, 0.13); g.add(sauce);
  }
  const sticks = [];
  for (const dz of [-0.008, 0.008]) sticks.push(new THREE.CylinderGeometry(0.003, 0.004, 0.24, 6).rotateZ(Math.PI / 2).translate(-0.12, 0.03, 0.16 + dz));
  g.add(new THREE.Mesh(merge(sticks), std('#3a1d10', { roughness: 0.4 })));
  return g;
}

/** Gỏi cuốn laid on a banana leaf, with a dish of peanut-hoisin. */
function goiCuonLeaf(m, rng) {
  const g = new THREE.Group();
  const leaf = new THREE.PlaneGeometry(0.56, 0.24, 8, 2).rotateX(-Math.PI / 2);
  const p = leaf.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.006 + (z * z) * 0.5 + Math.sin(x * 9) * 0.002); p.setZ(i, z * (1 - Math.pow(Math.abs(x) / 0.3, 4) * 0.6)); }
  leaf.computeVertexNormals();
  g.add(new THREE.Mesh(leaf, std('#3f7a2e', { roughness: 0.35, side: THREE.DoubleSide })));
  const rib = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.004, 0.008).translate(0, 0.008, 0), std('#7aa04a'));
  g.add(rib);
  const paper = new THREE.MeshPhysicalMaterial({ color: '#efe9db', roughness: 0.3, clearcoat: 0.6 });
  const shrimp = [], green = [];
  for (let i = 0; i < 5; i++) {
    const x = -0.18 + i * 0.09;
    const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.1, 6, 12).rotateX(Math.PI / 2).scale(1, 0.85, 1), paper);
    roll.position.set(x, 0.028, 0.0); roll.rotation.y = (rng() - 0.5) * 0.15;
    g.add(roll);
    for (let k = 0; k < 2; k++) shrimp.push(new THREE.TorusGeometry(0.014, 0.006, 6, 10, Math.PI).rotateX(-Math.PI / 2).rotateZ(0.3).translate(x, 0.046, -0.03 + k * 0.05));
    leaves(rng, 2, x, 0.044, 0, 0.02, 0.002, 0.08, 0.02, green);
  }
  g.add(new THREE.Mesh(merge(shrimp), std('#ff9b78', { emissive: '#ff8a64', emissiveIntensity: 0.2 })));
  g.add(new THREE.Mesh(merge(green), std('#5a9a3a', { side: THREE.DoubleSide })));
  const dish = new THREE.Mesh(lathe([[0, 0], [0.03, 0], [0.04, 0.025], [0.037, 0.025], [0, 0.006]], 16), m.white);
  dish.position.set(0.26, 0.0, 0.1); g.add(dish);
  const sauce = new THREE.Mesh(new THREE.CircleGeometry(0.035, 14).rotateX(-Math.PI / 2), std('#7a3a1a', { roughness: 0.2 }));
  sauce.position.set(0.26, 0.022, 0.1); g.add(sauce);
  const nuts = [];
  for (let i = 0; i < 8; i++) nuts.push(new THREE.BoxGeometry(0.005, 0.003, 0.005).translate(0.26 + (rng() - 0.5) * 0.03, 0.024, 0.1 + (rng() - 0.5) * 0.03));
  g.add(new THREE.Mesh(merge(nuts), std('#e8c890')));
  return g;
}

/** Bánh mì standing in kraft paper sleeves in a rattan basket. */
function banhMiBasket(m, rng) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.22).translate(0, 0.045, 0), m.cane));
  const kraft = std('#c9a27a', { roughness: 0.9 }), crust = std('#d4914a', { roughness: 0.55 });
  const fills = ['#4f8f3a', '#e8a0a0', '#f0a24a'];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Group();
    s.position.set(-0.13 + i * 0.087, 0.06, (i % 2 - 0.5) * 0.06);
    s.rotation.z = (i - 1.5) * 0.12;
    s.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.16, 0.06).translate(0, 0.08, 0), kraft));
    s.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.12, 6, 10).scale(1, 1, 0.8).translate(0, 0.17, 0), crust));
    fills.forEach((c, k) => s.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.05).translate(-0.02 + k * 0.012, 0.2, 0.0), std(c))));
    g.add(s);
  }
  return g;
}

/** Bánh xèo folded on a plate with lettuce and herbs. */
function banhXeo(m, rng) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0], [0.1, 0], [0.15, 0.014], [0.145, 0.016], [0, 0.007]], 28), m.white));
  const crepe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 28, 1, false, 0, Math.PI).scale(1, 1, 0.9), std('#e8b33a', { roughness: 0.45 }));
  crepe.position.set(-0.01, 0.028, 0.02);
  g.add(crepe);
  const spots = [];
  for (let i = 0; i < 14; i++) { const a = rng() * Math.PI, r = rng() * 0.1; spots.push(new THREE.CircleGeometry(0.008 + rng() * 0.008, 6).rotateX(-Math.PI / 2).translate(-0.01 + Math.cos(a) * r, 0.0415, 0.02 + Math.sin(a) * r * 0.9)); }
  g.add(new THREE.Mesh(merge(spots), std('#9a5a1a')));
  const lett = [];
  leaves(rng, 6, 0.0, 0.02, -0.08, 0.2, 0.02, 0.05, 0.08, lett);
  g.add(new THREE.Mesh(merge(lett), std('#7ab84a', { side: THREE.DoubleSide })));
  return g;
}

/** Cà phê trứng: a cup of egg coffee set in a bowl of hot water. */
function eggCoffee(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0], [0.04, 0], [0.065, 0.04], [0.062, 0.04], [0, 0.006]], 20), m.white));
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.058, 20).rotateX(-Math.PI / 2).translate(0, 0.03, 0), new THREE.MeshPhysicalMaterial({ color: '#b8d0d0', roughness: 0.05, clearcoat: 1 })));
  g.add(new THREE.Mesh(lathe([[0, 0.01], [0.025, 0.01], [0.032, 0.08], [0.03, 0.08], [0, 0.02]], 18), m.white));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 18).translate(0, 0.075, 0), std('#f0d290', { roughness: 0.7 })));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 12).translate(0.035, 0.055, 0), m.white));
  return g;
}

/** Coconut coffee served in a half coconut shell, with a bamboo straw. */
function coconutCoffee(m) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), std('#5a3a22', { roughness: 0.9, side: THREE.DoubleSide }));
  shell.position.y = 0.068;
  g.add(shell);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.069, 0.005, 6, 24).rotateX(Math.PI / 2).translate(0, 0.078, 0), std('#f6f0e2')));
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.066, 20).rotateX(-Math.PI / 2).translate(0, 0.074, 0), std('#e8d8bc', { roughness: 0.6 })));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6).rotateZ(0.35).translate(0.03, 0.14, 0), std('#c9a46a')));
  return g;
}

/** A lotus tea set: clay teapot, four cups and a lotus on a bamboo tray. */
function lotusTeaSet(m, rng) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.26).translate(0, 0.01, 0), std('#c9a46a', { roughness: 0.7 })));
  const clay = std('#6a3a26', { roughness: 0.35 });
  const pot = [];
  pot.push(lathe([[0, 0], [0.04, 0], [0.055, 0.03], [0.05, 0.065], [0.025, 0.08], [0.028, 0.085], [0, 0.085]], 20).translate(-0.08, 0.02, 0));
  pot.push(new THREE.SphereGeometry(0.012, 8, 6).translate(-0.08, 0.11, 0));
  pot.push(new THREE.CylinderGeometry(0.006, 0.011, 0.06, 8).rotateZ(-0.9).translate(-0.025, 0.07, 0));
  pot.push(new THREE.TorusGeometry(0.025, 0.006, 6, 12, Math.PI * 1.2).rotateZ(1.4).translate(-0.13, 0.065, 0));
  g.add(new THREE.Mesh(merge(pot), clay));
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(lathe([[0, 0], [0.014, 0], [0.02, 0.03], [0.018, 0.03], [0, 0.004]], 14), m.white);
    c.position.set(0.04 + (i % 2) * 0.05, 0.02, -0.05 + Math.floor(i / 2) * 0.09);
    g.add(c);
  }
  const petals = [];
  for (let r = 0; r < 2; r++) for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + r * 0.4;
    petals.push(new THREE.SphereGeometry(0.02, 8, 6).scale(0.5, 1.4, 0.25).rotateX(0.5 - r * 0.3).rotateY(a).translate(Math.sin(a) * 0.016, 0.05 + r * 0.008, Math.cos(a) * 0.016));
  }
  const lotus = new THREE.Mesh(merge(petals), std('#f2b6c4', { emissive: '#f0a0b8', emissiveIntensity: 0.15 }));
  lotus.position.set(0.12, 0.0, 0.08);
  g.add(lotus);
  return g;
}

/** Chè in layered glasses. */
function cheGlasses(m) {
  const g = new THREE.Group();
  const layers = [['#7bb85a', '#f2d04a', '#f6f1e2', '#8a2a2a'], ['#f2b0c0', '#f6f1e2', '#6a3a2a', '#e8c24a'], ['#4a8a3a', '#f6f1e2', '#f2d04a', '#2a1a1a']];
  layers.forEach((cols, i) => {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.14, 16, 1, true), m.glass);
    glass.position.set(i * 0.09, 0.07, 0);
    glass.renderOrder = 2;
    g.add(glass);
    cols.forEach((c, k) => g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.03, 0.03, 14).translate(i * 0.09, 0.018 + k * 0.03, 0), std(c, { roughness: 0.4, emissive: c, emissiveIntensity: 0.1 }))));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.2, 4).rotateZ(0.2).translate(i * 0.09 + 0.01, 0.15, 0), m.steel));
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
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.025, 14).translate(i * 0.1, 0.014, 0), std('#efe2c4', { roughness: 0.3 })));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.032, 0.04, 14).translate(i * 0.1, 0.046, 0), std('#3a2216', { roughness: 0.2 })));
    const phin = [];
    phin.push(new THREE.CylinderGeometry(0.045, 0.045, 0.004, 18).translate(i * 0.1, 0.103, 0));
    phin.push(new THREE.CylinderGeometry(0.036, 0.03, 0.06, 18, 1, true).translate(i * 0.1, 0.135, 0));
    phin.push(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 18).translate(i * 0.1, 0.172, 0));
    phin.push(new THREE.SphereGeometry(0.008, 8, 6).translate(i * 0.1, 0.182, 0));
    g.add(new THREE.Mesh(merge(phin), m.steel));
  }
  return g;
}

/** A tiered rattan fruit stand: dragonfruit, mango, rambutan, mangosteen, bananas. */
function fruitStand(m, rng) {
  const g = new THREE.Group();
  const frame = [];
  frame.push(new THREE.CylinderGeometry(0.025, 0.03, 1.25, 8).translate(0, 0.62, 0));
  frame.push(new THREE.CylinderGeometry(0.22, 0.26, 0.04, 16).translate(0, 0.02, 0));
  g.add(new THREE.Mesh(merge(frame), m.darkTeak));
  const tiers = [[0.42, 0.45], [0.32, 0.8], [0.22, 1.12]];
  const fruit = { dragon: [], mango: [], ramb: [], mang: [], cap: [], scale: [], banana: [] };
  for (const [r, y] of tiers) {
    g.add(new THREE.Mesh(lathe([[0, 0], [r * 0.85, 0], [r, 0.08], [r * 0.97, 0.08], [0, 0.02]], 24).translate(0, y, 0), m.cane));
    const n = Math.round(r * 22);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng(), rr = r * (0.35 + rng() * 0.45);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, yy = y + 0.07;
      const kind = ['dragon', 'mango', 'ramb', 'mang'][i % 4];
      if (kind === 'dragon') {
        fruit.dragon.push(new THREE.SphereGeometry(0.055, 12, 10).scale(1, 1.3, 1).translate(x, yy + 0.06, z));
        for (let k = 0; k < 6; k++) { const b = (k / 6) * 6.28; fruit.scale.push(new THREE.ConeGeometry(0.014, 0.04, 4).rotateZ(-0.9).rotateY(-b).translate(x + Math.cos(b) * 0.05, yy + 0.05 + (k % 2) * 0.04, z + Math.sin(b) * 0.05)); }
      } else if (kind === 'mango') fruit.mango.push(new THREE.SphereGeometry(0.05, 12, 8).scale(1.3, 0.85, 0.9).rotateY(rng() * 3).translate(x, yy + 0.04, z));
      else if (kind === 'ramb') { for (let k = 0; k < 3; k++) fruit.ramb.push(new THREE.IcosahedronGeometry(0.026, 1).translate(x + (k - 1) * 0.04, yy + 0.026, z + (k % 2) * 0.03)); }
      else { fruit.mang.push(new THREE.SphereGeometry(0.032, 12, 8).translate(x, yy + 0.03, z)); fruit.cap.push(new THREE.ConeGeometry(0.018, 0.015, 5).translate(x, yy + 0.064, z)); }
    }
  }
  for (let k = 0; k < 5; k++) fruit.banana.push(new THREE.TorusGeometry(0.09, 0.015, 6, 10, 1.4).rotateZ(1.0 + k * 0.08).rotateY(k * 0.25).translate(-0.05, 1.2, 0.0));
  const add = (list, mat) => list.length && g.add(new THREE.Mesh(merge(list), mat));
  add(fruit.dragon, std('#d8306a', { roughness: 0.4 }));
  add(fruit.scale, std('#8ab83a', { roughness: 0.5 }));
  add(fruit.mango, std('#f0a02a', { roughness: 0.45 }));
  add(fruit.ramb, std('#c42a22', { roughness: 0.8, flatShading: true }));
  add(fruit.mang, std('#4a1838', { roughness: 0.35 }));
  add(fruit.cap, std('#4a7a2a'));
  add(fruit.banana, std('#f2d040', { roughness: 0.5 }));
  return g;
}

/* ---------------- jamu bar pieces ---------------- */

/** Instanced copies of one geometry: list of { p, ry, rx, s, c }. */
function instanced(geo, mat, list) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  list.forEach((it, i) => {
    q.setFromEuler(e.set(it.rx || 0, it.ry || 0, 0));
    m4.compose(it.p, q, sc.setScalar(it.s || 1));
    im.setMatrixAt(i, m4);
    if (it.c) im.setColorAt(i, new THREE.Color(it.c));
  });
  im.castShadow = false;
  return im;
}

function velvetStool(m, h = 0.78, back = true) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.1, 22).translate(0, h, 0), m.velvet));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 24).rotateX(Math.PI / 2).translate(0, h - 0.04, 0), m.brass));
  const fr = [];
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; rod(V(Math.cos(a) * 0.12, h - 0.05, Math.sin(a) * 0.12), V(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19), 0.014, fr, 6); }
  fr.push(new THREE.TorusGeometry(0.16, 0.012, 6, 22).rotateX(Math.PI / 2).translate(0, 0.28, 0));
  g.add(new THREE.Mesh(merge(fr), m.brass));
  if (back) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8).translate(0, h + 0.17, 0), new THREE.MeshStandardMaterial({ color: '#1f4a3c', roughness: 0.95, side: THREE.DoubleSide })));
  }
  return g;
}

function domePendant(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c9a25a', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 24).rotateX(Math.PI / 2), m.brass));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8).translate(0, 0.02, 0), m.soft));
  return g;
}

function bambooPendant(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0.02, 0.32], [0.12, 0.28], [0.2, 0.15], [0.22, 0.02], [0.2, 0]], 18), new THREE.MeshStandardMaterial({ map: caneTexture(), color: '#e0c08a', roughness: 0.8, side: THREE.DoubleSide })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8).translate(0, 0.06, 0), m.soft));
  return g;
}

/** Garnish tray: lime, turmeric slices, ginger, lemongrass, cinnamon, star anise, pandan knots. */
function garnishTray(m, rng) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.035, 0.22).translate(0, 0.018, 0), m.darkTeak));
  const div = [];
  for (let k = 0; k <= 6; k++) div.push(new THREE.BoxGeometry(0.006, 0.03, 0.2).translate(-0.3 + k * 0.1, 0.05, 0));
  g.add(new THREE.Mesh(merge(div), m.brass));
  const cell = (k) => -0.25 + k * 0.1;
  const bits = { lime: [], tur: [], gin: [], lem: [], cin: [], anise: [], pandan: [] };
  for (let i = 0; i < 5; i++) bits.lime.push(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 12).rotateX(0.4 * (rng() - 0.5)).translate(cell(0) + (rng() - 0.5) * 0.04, 0.042 + i * 0.006, (rng() - 0.5) * 0.14));
  for (let i = 0; i < 8; i++) bits.tur.push(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 8).translate(cell(1) + (rng() - 0.5) * 0.05, 0.04 + i * 0.004, (rng() - 0.5) * 0.15));
  for (let i = 0; i < 4; i++) bits.gin.push(new THREE.DodecahedronGeometry(0.02, 0).scale(1.6, 0.8, 1).translate(cell(2) + (rng() - 0.5) * 0.04, 0.05, -0.06 + i * 0.04));
  for (let i = 0; i < 4; i++) bits.lem.push(new THREE.CylinderGeometry(0.006, 0.007, 0.19, 6).rotateX(Math.PI / 2).translate(cell(3) - 0.02 + i * 0.013, 0.045, 0));
  for (let i = 0; i < 6; i++) bits.cin.push(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 6).rotateX(Math.PI / 2).rotateY((rng() - 0.5) * 0.4).translate(cell(4) + (rng() - 0.5) * 0.05, 0.042 + (i % 2) * 0.01, (rng() - 0.5) * 0.08));
  for (let i = 0; i < 5; i++) for (let k = 0; k < 8; k++) bits.anise.push(new THREE.ConeGeometry(0.004, 0.018, 4).rotateZ(Math.PI / 2).rotateY((k / 8) * 6.28).translate(cell(5) + (i % 2 - 0.5) * 0.04 + Math.cos(-(k / 8) * 6.28) * 0.009, 0.043, -0.07 + i * 0.035 + Math.sin(-(k / 8) * 6.28) * 0.009));
  for (let i = 0; i < 4; i++) bits.pandan.push(new THREE.TorusKnotGeometry(0.014, 0.004, 24, 4, 2, 3).translate(-0.3 - 0.07, 0.03, -0.06 + i * 0.04));
  const add = (list, mat) => g.add(new THREE.Mesh(merge(list), mat));
  add(bits.lime, std('#a8d050', { roughness: 0.4 }));
  add(bits.tur, std('#f08a12', { roughness: 0.5 }));
  add(bits.gin, std('#d8b480', { roughness: 0.8, flatShading: true }));
  add(bits.lem, std('#c8d890'));
  add(bits.cin, std('#7a3e1c', { roughness: 0.8 }));
  add(bits.anise, std('#5a2a14', { roughness: 0.8 }));
  add(bits.pandan, std('#2f8a3a'));
  return g;
}

/** Shaker, jigger, muddler, bar spoon and strainer on a bar mat. */
function barTools(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.008, 0.18).translate(0, 0.004, 0), std('#1a1a1a', { roughness: 0.9 })));
  const p = [];
  p.push(lathe([[0, 0], [0.035, 0], [0.042, 0.13], [0.035, 0.15], [0.02, 0.18], [0.014, 0.2], [0, 0.2]], 18).translate(-0.14, 0.008, 0));
  p.push(lathe([[0, 0.05], [0.022, 0.05], [0.012, 0.035], [0.012, 0.03], [0.02, 0], [0, 0]], 14).translate(-0.04, 0.008, -0.03));
  rod(V(0.03, 0.02, 0.05), V(0.16, 0.02, -0.02), 0.004, p, 6);
  p.push(new THREE.TorusGeometry(0.035, 0.004, 6, 18).rotateX(Math.PI / 2).translate(0.1, 0.012, 0.05));
  g.add(new THREE.Mesh(merge(p), m.copper));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.2, 10).rotateZ(Math.PI / 2).translate(0.06, 0.025, -0.05), m.darkTeak));
  return g;
}

function copperKettle(m) {
  const g = new THREE.Group();
  const k = [];
  k.push(lathe([[0, 0], [0.1, 0], [0.13, 0.06], [0.12, 0.13], [0.06, 0.18], [0.04, 0.19], [0, 0.19]], 22));
  k.push(new THREE.CylinderGeometry(0.012, 0.022, 0.18, 10).rotateZ(-1.0).translate(0.15, 0.12, 0));
  k.push(new THREE.TorusGeometry(0.09, 0.01, 6, 18, Math.PI).translate(0, 0.2, 0));
  k.push(new THREE.SphereGeometry(0.018, 8, 6).translate(0, 0.2, 0));
  g.add(new THREE.Mesh(merge(k), m.copper));
  g.position.y = 0.07;
  const stand = new THREE.Group();
  stand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.07, 18, 1, true).translate(0, 0.035, 0), m.dark));
  stand.add(new THREE.Mesh(new THREE.CircleGeometry(0.06, 12).rotateX(-Math.PI / 2).translate(0, 0.05, 0), new THREE.MeshStandardMaterial({ color: '#ff9a40', emissive: '#ff7a20', emissiveIntensity: 1.6 })));
  stand.add(g);
  return stand;
}

function lumpang() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0.02], [0.13, 0], [0.16, 0.08], [0.15, 0.13], [0.09, 0.13], [0.065, 0.05], [0, 0.045]], 22), std('#5a5650', { roughness: 0.95 })));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.3, 10).rotateZ(0.55).translate(0.06, 0.2, 0), std('#6a4a2a')));
  return g;
}

/** A jar of rhizomes or spice under a brass lid. */
function spiceJar(m, rng, col, h = 0.3, r = 0.1) {
  const jar = new THREE.Group();
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), m.glass);
  gl.position.y = h / 2; gl.renderOrder = 2;
  jar.add(gl);
  jar.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.025, 20).translate(0, h + 0.012, 0), m.brass));
  jar.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.25, 10, 8).translate(0, h + 0.04, 0), m.brass));
  const bits = [];
  for (let k = 0; k < 16; k++) bits.push(new THREE.DodecahedronGeometry(r * 0.3, 0).scale(1.6, 0.8, 1).translate((rng() - 0.5) * r * 1.2, r * 0.3 + rng() * h * 0.6, (rng() - 0.5) * r * 1.2));
  jar.add(new THREE.Mesh(merge(bits), std(col, { roughness: 0.8 })));
  return jar;
}

/* ---------------- the church bell ---------------- */

function bell(m) {
  const g = new THREE.Group();
  const prof = [[0, 0.46], [0.07, 0.46], [0.12, 0.44], [0.135, 0.38], [0.15, 0.25], [0.2, 0.1], [0.255, 0.02], [0.262, 0.0], [0.24, 0.0], [0.19, 0.08], [0.135, 0.24], [0.12, 0.38], [0.07, 0.43], [0, 0.44]];
  const bronzeBell = new THREE.MeshPhysicalMaterial({ color: '#b58a3c', roughness: 0.28, metalness: 0.95, clearcoat: 0.3, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(lathe(prof, 40), bronzeBell));
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

/* ======================= ES PUTER (the gelato gerobak) ======================= */

function buildEsPuter(m, rng, name, out, bay) {
  const cart = new THREE.Group();
  cart.position.set(bay.x, Y, bay.z);
  cart.rotation.y = bay.yaw; // its front (local -z) faces the promenade aisle
  out.group.add(cart);
  const L = 2.8, D = 0.95, H0 = 0.4, H1 = 1.0, T = H1 + 0.05;

  // body: lacquered green with painted panels in a teak frame, brass corners
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(L, H1 - H0, D).translate(0, (H0 + H1) / 2, 0), m.green));
  const named = new THREE.MeshStandardMaterial({ map: puterPanelTexture(name), roughness: 0.45 });
  const floral = new THREE.MeshStandardMaterial({ map: puterPanelTexture(''), roughness: 0.45 });
  const pane = (w, h, mat, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, (H0 + H1) / 2, z); p.rotation.y = ry; cart.add(p); };
  pane(1.78, H1 - H0 - 0.14, named, 0.42, -D / 2 - 0.006, Math.PI); // the name, clear of the wheel
  pane(0.78, H1 - H0 - 0.14, floral, -0.9, -D / 2 - 0.006, Math.PI);
  pane(L - 0.3, H1 - H0 - 0.14, floral, 0, D / 2 + 0.006, 0);
  pane(D - 0.24, H1 - H0 - 0.14, floral, L / 2 + 0.006, 0, Math.PI / 2);
  pane(D - 0.24, H1 - H0 - 0.14, floral, -L / 2 - 0.006, 0, -Math.PI / 2);
  const fr = [];
  for (const y of [H0 + 0.035, H1 - 0.035]) fr.push(new THREE.BoxGeometry(L + 0.04, 0.07, D + 0.04).translate(0, y, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.push(new THREE.BoxGeometry(0.08, H1 - H0, 0.08).translate(sx * L / 2, (H0 + H1) / 2, sz * D / 2));
  fr.push(new THREE.BoxGeometry(L + 0.12, 0.05, D + 0.12).translate(0, H1 + 0.025, 0));
  cart.add(new THREE.Mesh(merge(fr), m.teak));
  const corners = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [H0 + 0.04, H1 - 0.04]) corners.push(new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(sx * L / 2, y, sz * D / 2));
  for (const sz of [-1, 1]) corners.push(new THREE.BoxGeometry(L + 0.12, 0.025, 0.015).translate(0, H1 + 0.04, sz * (D / 2 + 0.06)));
  cart.add(new THREE.Mesh(merge(corners), m.brass));

  // brass pozzetti in the teak top; the lids lift when she picks a flavour
  const flavors = Object.keys(FLAVORS);
  const lids = [], wells = [];
  const wellMat = new THREE.MeshStandardMaterial({ color: '#5a5d60', metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide });
  flavors.forEach((f, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const px = -1.15 + col * 0.4, pz = row ? 0.2 : -0.2;
    cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.3, 24, 1, true).translate(px, T - 0.15, pz), wellMat));
    cart.add(new THREE.Mesh(new THREE.CircleGeometry(0.13, 24).rotateX(-Math.PI / 2).translate(px, T - 0.02, pz), std(FLAVORS[f], { roughness: 0.6, emissive: FLAVORS[f], emissiveIntensity: 0.18 })));
    cart.add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.014, 6, 28).rotateX(Math.PI / 2).translate(px, T + 0.01, pz), m.brass));
    const hinge = new THREE.Group();
    hinge.position.set(px, T + 0.02, pz + 0.14); // hinged on the server's side
    const lid = new THREE.Group();
    lid.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.016, 28).translate(0, 0.008, -0.14), m.brass));
    lid.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10).translate(0, 0.03, -0.2), m.gold));
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05).rotateX(-Math.PI / 2).rotateY(Math.PI).translate(0, 0.0175, -0.1),
      new THREE.MeshBasicMaterial({ map: signTexture([f], { w: 256, h: 64, bg: '#2f5a44', fg: '#f3e2b0', border: null, title: 0.62 }), color: '#c8c0b0' }));
    lid.add(plaque);
    hinge.add(lid);
    hinge.userData.keep = true;
    cart.add(hinge);
    lids.push({ hinge, open: 0, until: 0 });
    wells.push({ f, i, local: V(px, T + 0.06, pz) });
  });

  // the wooden churn barrel (the "puter") with its hand crank
  const tong = new THREE.Group();
  tong.position.set(0.62, T, 0.08);
  tong.add(new THREE.Mesh(lathe([[0, 0], [0.19, 0], [0.215, 0.12], [0.222, 0.24], [0.215, 0.36], [0.19, 0.48], [0, 0.48]], 20), m.darkTeak));
  const hoops = [];
  for (const y of [0.05, 0.24, 0.43]) hoops.push(new THREE.TorusGeometry(y === 0.24 ? 0.224 : 0.205, 0.01, 6, 28).rotateX(Math.PI / 2).translate(0, y, 0));
  tong.add(new THREE.Mesh(merge(hoops), m.brass));
  const crank = [];
  crank.push(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20).translate(0, 0.495, 0));
  crank.push(new THREE.CylinderGeometry(0.013, 0.013, 0.22, 8).translate(0, 0.6, 0));
  rod(V(0, 0.7, 0), V(0.19, 0.7, 0), 0.013, crank, 6);
  crank.push(new THREE.BoxGeometry(0.06, 0.04, 0.05).translate(0, 0.68, 0));
  tong.add(new THREE.Mesh(merge(crank), m.steel));
  tong.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 10).translate(0.19, 0.76, 0), m.darkTeak));
  cart.add(tong);

  // a glass case: cones, paper cups and soft roti buns (es puter is eaten in bread too)
  const dc = new THREE.Group();
  dc.position.set(1.14, T, 0);
  const cw = 0.34, ch = 0.42, cd = 0.62;
  const box = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd).translate(0, ch / 2, 0), m.glass);
  box.renderOrder = 2;
  dc.add(box);
  const edges = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) edges.push(new THREE.BoxGeometry(0.025, ch, 0.025).translate(sx * cw / 2, ch / 2, sz * cd / 2));
  edges.push(new THREE.BoxGeometry(cw + 0.04, 0.03, cd + 0.04).translate(0, ch, 0));
  edges.push(new THREE.BoxGeometry(cw + 0.02, 0.012, cd - 0.02).translate(0, 0.2, 0));
  dc.add(new THREE.Mesh(merge(edges), m.teak));
  const buns = [];
  for (let i = 0; i < 6; i++) buns.push(new THREE.SphereGeometry(0.045, 12, 8).scale(1.3, 0.75, 1).translate((i % 2 - 0.5) * 0.12, 0.035, -0.22 + Math.floor(i / 2) * 0.16));
  dc.add(new THREE.Mesh(merge(buns), std('#d9a060', { roughness: 0.6 })));
  const cones = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) cones.push(new THREE.ConeGeometry(0.03, 0.11, 12, 1, true).rotateX(Math.PI).translate(-0.06 + (i % 2) * 0.1, 0.27 + k * 0.018, -0.2 + Math.floor(i / 2) * 0.14));
  dc.add(new THREE.Mesh(merge(cones), new THREE.MeshStandardMaterial({ color: '#d4954e', roughness: 0.8, side: THREE.DoubleSide })));
  const cups = [];
  for (let k = 0; k < 6; k++) cups.push(new THREE.CylinderGeometry(0.035, 0.026, 0.06, 14, 1, true).translate(0.0, 0.24 + k * 0.012, 0.16));
  dc.add(new THREE.Mesh(merge(cups), new THREE.MeshStandardMaterial({ color: '#f6f1e6', roughness: 0.7, side: THREE.DoubleSide })));
  cart.add(dc);
  // scoops standing in a brass tin
  cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14).translate(0.3, T + 0.06, -0.3), m.brass));
  const scoops = [];
  for (let k = 0; k < 3; k++) rod(V(0.3 + (k - 1) * 0.015, T + 0.1, -0.3), V(0.3 + (k - 1) * 0.04, T + 0.27, -0.33), 0.005, scoops, 5);
  cart.add(new THREE.Mesh(merge(scoops), m.steel));

  // big spoked wheels, axle, stand legs and the push handles
  const wheelMesh = [];
  for (const s of [-1, 1]) {
    const wh = [];
    wh.push(new THREE.TorusGeometry(0.38, 0.032, 8, 36));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; rod(V(0, 0, 0), V(Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0), 0.015, wh, 5); }
    const g = merge(wh).translate(-0.95, 0.42, s * (D / 2 + 0.09));
    wheelMesh.push(g);
    cart.add(new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.013, 6, 40).translate(-0.95, 0.42, s * (D / 2 + 0.09)), m.dark));
    cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 14).rotateX(Math.PI / 2).translate(-0.95, 0.42, s * (D / 2 + 0.09)), m.brass));
  }
  cart.add(new THREE.Mesh(merge(wheelMesh), m.darkTeak));
  const legs = [];
  rod(V(-0.95, 0.42, -D / 2 - 0.1), V(-0.95, 0.42, D / 2 + 0.1), 0.025, legs, 8);
  for (const sz of [-1, 1]) {
    legs.push(new THREE.BoxGeometry(0.07, H0, 0.07).translate(1.25, H0 / 2, sz * 0.36));
    rod(V(-1.4, H0 + 0.35, sz * 0.36), V(-2.0, 0.92, sz * 0.36), 0.026, legs, 8);
  }
  cart.add(new THREE.Mesh(merge(legs), m.teak));
  const grip = [];
  rod(V(-2.0, 0.92, -0.42), V(-2.0, 0.92, 0.42), 0.03, grip, 10);
  cart.add(new THREE.Mesh(merge(grip), m.brass));

  // canopy: teak posts, a striped cloth vault with a scalloped, tasselled valance
  const posts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.push(new THREE.BoxGeometry(0.05, 1.5, 0.05).translate(sx * 1.32, T + 0.75, sz * 0.44));
  for (const sz of [-1, 1]) posts.push(new THREE.BoxGeometry(2.74, 0.06, 0.05).translate(0, T + 1.47, sz * 0.44));
  cart.add(new THREE.Mesh(merge(posts), m.teak));
  const canTex = canvasTex(64, 256, (g, W, H) => {
    g.fillStyle = '#f3e7d0'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#b8322a';
    for (let i = 0; i < 8; i++) g.fillRect(0, (i + 0.25) * (H / 8), W, H / 16);
  });
  const r = 0.69, a = 0.85;
  const vault = new THREE.CylinderGeometry(r, r, L + 0.3, 24, 1, true, Math.PI / 2 - a, 2 * a).rotateZ(Math.PI / 2).translate(0, T + 1.5 - r * Math.cos(a), 0);
  const canopy = new THREE.Mesh(vault, new THREE.MeshStandardMaterial({ map: canTex, roughness: 0.85, side: THREE.DoubleSide }));
  canopy.castShadow = true;
  cart.add(canopy);
  const edgeZ = r * Math.sin(a), edgeY = T + 1.5;
  const sc = [], tass = [];
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 15; i++) {
      const x = -L / 2 - 0.15 + (i + 0.5) * ((L + 0.3) / 15);
      sc.push(new THREE.CircleGeometry(0.095, 10, Math.PI, Math.PI).translate(x, edgeY, sz * (edgeZ + 0.005)));
      tass.push(new THREE.ConeGeometry(0.018, 0.07, 6).translate(x, edgeY - 0.13, sz * (edgeZ + 0.005)));
    }
  }
  cart.add(new THREE.Mesh(merge(sc), new THREE.MeshStandardMaterial({ color: '#b8322a', roughness: 0.85, side: THREE.DoubleSide })));
  cart.add(new THREE.Mesh(merge(tass), m.gold));
  // a petromax lamp hanging under the canopy, warm on the lids
  const pm = [];
  pm.push(new THREE.CylinderGeometry(0.05, 0.07, 0.06, 14).translate(0, -0.2, 0));
  pm.push(new THREE.ConeGeometry(0.12, 0.08, 14).translate(0, 0.09, 0));
  pm.push(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 4).translate(0, 0.28, 0));
  for (let k = 0; k < 3; k++) { const b = (k / 3) * Math.PI * 2; rod(V(Math.cos(b) * 0.07, -0.18, Math.sin(b) * 0.07), V(Math.cos(b) * 0.1, 0.06, Math.sin(b) * 0.1), 0.005, pm, 4); }
  const petromax = new THREE.Group();
  petromax.add(new THREE.Mesh(merge(pm), m.brass));
  petromax.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10).scale(1, 1.2, 1).translate(0, -0.06, 0), m.soft));
  petromax.position.set(-0.35, T + 1.2, 0);
  cart.add(petromax);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.19, 0.08), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.position.set(-0.5, T + 0.035, 0);
  cart.add(pool);
  const light = new THREE.PointLight('#ffc27a', 5, 8, 2);
  light.position.set(-0.35, T + 1.0, -0.4);
  cart.add(light);

  // a little enamel menu board on an A-frame
  const menu = new THREE.Group();
  menu.position.set(-1.0, 0, -1.05);
  menu.rotation.y = 0.25;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7).rotateY(Math.PI), new THREE.MeshBasicMaterial({ map: signTexture([name, ...flavors], { w: 300, h: 440, bg: '#f3ead2', fg: '#2f5a44', border: '#b8322a', title: 0.17 }), color: '#c8c0b0' }));
  board.position.set(0, 0.62, 0); board.rotation.x = 0.12;
  menu.add(board);
  const mf = [];
  rod(V(-0.24, 0, -0.08), V(-0.24, 0.98, 0.04), 0.015, mf); rod(V(0.24, 0, -0.08), V(0.24, 0.98, 0.04), 0.015, mf);
  rod(V(-0.24, 0, 0.3), V(-0.24, 0.98, 0.05), 0.012, mf); rod(V(0.24, 0, 0.3), V(0.24, 0.98, 0.05), 0.012, mf);
  menu.add(new THREE.Mesh(merge(mf), m.teak));
  cart.add(menu);

  // the brass bell on a carved teak yoke beside the cart (es puter sellers ring a bell)
  const bellGroup = new THREE.Group();
  bellGroup.position.set(L / 2 + 0.85, 0, 0.1);
  const yoke = [];
  for (const s of [-1, 1]) {
    yoke.push(new THREE.BoxGeometry(0.15, 2.9, 0.15).translate(0, 1.45, s * 0.55));
    yoke.push(new THREE.BoxGeometry(0.28, 0.1, 0.28).translate(0, 0.05, s * 0.55));
    yoke.push(new THREE.BoxGeometry(0.2, 0.06, 0.2).translate(0, 2.92, s * 0.55));
  }
  yoke.push(new THREE.BoxGeometry(0.2, 0.18, 1.5).translate(0, 2.95, 0));
  yoke.push(new THREE.BoxGeometry(0.14, 0.08, 1.8).translate(0, 3.08, 0));
  for (const s of [-1, 1]) yoke.push(new THREE.ConeGeometry(0.07, 0.22, 4).rotateY(Math.PI / 4).translate(0, 3.2, s * 0.85));
  bellGroup.add(new THREE.Mesh(merge(yoke), m.teak));
  const brackets = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide }));
  brackets.rotation.y = Math.PI / 2;
  brackets.position.set(0, 2.7, 0);
  bellGroup.add(brackets);
  const swing = new THREE.Group();
  swing.userData.keep = true;
  swing.position.set(0, 2.82, 0);
  const b = bell(m);
  b.position.y = -0.56;
  swing.add(b);
  const rope = [];
  rod(V(0.3, -0.15, 0), V(0.3, -1.6, 0), 0.012, rope, 6);
  swing.add(new THREE.Mesh(merge(rope), new THREE.MeshStandardMaterial({ color: '#c9a25a', roughness: 0.7 })));
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 10), new THREE.MeshStandardMaterial({ color: '#8a1e22', roughness: 0.8 }));
  tassel.position.set(0.3, -1.7, 0);
  swing.add(tassel);
  bellGroup.add(swing);
  cart.add(bellGroup);
  shadowAll(cart, true, true);
  pool.castShadow = false;

  // world-space bookkeeping
  cart.updateMatrixWorld(true);
  const W = (x, y, z) => V(x, y, z).applyMatrix4(cart.matrixWorld);
  const a0 = W(-2.0, 0, 0), a1 = W(1.45, 0, 0);
  out.colliders.push({ seg: [a0.x, a0.z, a1.x, a1.z], r: 0.62 });
  for (const s of [-1, 1]) { const p = W(L / 2 + 0.85, 0, 0.1 + s * 0.55); out.colliders.push({ x: p.x, z: p.z, r: 0.16 }); }
  const mp = W(-1.0, 0, -1.0); out.colliders.push({ x: mp.x, z: mp.z, r: 0.3 });
  for (const w of wells) {
    out.interacts.push({ center: W(w.local.x, w.local.y, w.local.z), radius: 0.15, label: `gelato · ${w.f}`, food: 'gelato', flavor: w.f, onPick: () => { lids[w.i].until = performance.now() + 1800; } });
  }
  const bellCenter = W(L / 2 + 0.85 + 0.15, 1.85, 0.1);
  let swingT = 99, swingAmp = 0;
  return {
    light,
    bell: { center: bellCenter, radius: 0.6, reach: 3.4, label: 'ring the bell', ring() { swingT = 0; swingAmp = 0.55; } },
    update(t, dt) {
      const now = performance.now();
      for (const l of lids) {
        const target = now < l.until ? 1 : 0;
        l.open += (target - l.open) * Math.min(1, dt * 6);
        l.hinge.rotation.x = l.open * 1.2;
      }
      swingT += dt;
      const sw = swingAmp * Math.exp(-swingT * 0.45) * Math.sin(swingT * 2.4);
      swing.rotation.z = sw;
      b.userData.clapper.rotation.z = -sw * 0.6 + Math.sin(swingT * 3.1) * swingAmp * 0.15 * Math.exp(-swingT * 0.6);
      light.intensity = 4 * (0.94 + Math.sin(t * 9.1) * 0.03 + Math.sin(t * 15.7) * 0.03);
    },
  };
}

/* ======================= GESAN'S LEGIT & GURIH (the martabak cart) ======================= */

/** Sajian Dapur Gesan livery: deep green lacquer, gold double border, cream lettering, a round crest. */
function dapurPanelTexture(title, sub) {
  return canvasTex(512, 170, (g, W, H) => {
    g.fillStyle = '#1f3d2e'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#c9a25a'; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16);
    g.lineWidth = 2; g.strokeRect(18, 18, W - 36, H - 36);
    const crest = (x, y, r) => {
      g.fillStyle = '#c9a25a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1f3d2e'; g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#efe2c4'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(x, y + r * 0.1, r * 0.42, 0.15, Math.PI - 0.15); g.stroke(); // a wok
      for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * r * 0.2, y - r * 0.05); g.quadraticCurveTo(x + k * r * 0.2 + r * 0.12, y - r * 0.3, x + k * r * 0.2, y - r * 0.55); g.stroke(); } // steam
    };
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (title) {
      crest(56, H / 2, 30); crest(W - 56, H / 2, 30);
      g.fillStyle = '#efe2c4';
      g.font = `italic ${Math.round(Math.min(H * 0.34, 660 / Math.max(title.length, 5)))}px Georgia, serif`;
      g.fillText(title, W / 2, H * 0.42);
      if (sub) { g.fillStyle = '#c9a25a'; g.font = `${Math.round(H * 0.12)}px Georgia, serif`; g.fillText(sub.toUpperCase().split('').join(' '), W / 2, H * 0.74); }
    } else {
      crest(W / 2, H / 2, 46);
      if (sub) { g.fillStyle = '#c9a25a'; g.font = `${Math.round(H * 0.1)}px Georgia, serif`; g.fillText(sub.toUpperCase().split('').join(' '), W / 2, H - 30); }
    }
  });
}

function honeycombTexture() {
  return canvasTex(128, 128, (g, W, H) => {
    g.fillStyle = '#c9842e'; g.fillRect(0, 0, W, H);
    const rng = mulberry32(31);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + rng() * 40},${45 + rng() * 25},15,${0.5 + rng() * 0.4})`; g.beginPath(); g.arc(rng() * W, rng() * H, 1.5 + rng() * 2.5, 0, Math.PI * 2); g.fill(); }
  });
}

function buildMartabak(m, rng, name, brand, out, bay) {
  const cart = new THREE.Group();
  cart.position.set(bay.x, Y, bay.z);
  cart.rotation.y = bay.yaw;
  out.group.add(cart);
  const L = 2.6, D = 0.95, H0 = 0.4, H1 = 1.0, T = H1 + 0.05;
  const livery = new THREE.MeshPhysicalMaterial({ color: '#1f3d2e', roughness: 0.3, clearcoat: 0.8 });
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(L, H1 - H0, D).translate(0, (H0 + H1) / 2, 0), livery));
  const named = new THREE.MeshStandardMaterial({ map: dapurPanelTexture(name, brand), roughness: 0.45 });
  const crestOnly = new THREE.MeshStandardMaterial({ map: dapurPanelTexture('', brand), roughness: 0.45 });
  const pane = (w, mat, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, H1 - H0 - 0.14), mat); p.position.set(x, (H0 + H1) / 2, z); p.rotation.y = ry; cart.add(p); };
  pane(1.75, named, 0.35, -D / 2 - 0.006, Math.PI);
  pane(0.6, crestOnly, -0.93, -D / 2 - 0.006, Math.PI);
  pane(L - 0.3, crestOnly, 0, D / 2 + 0.006, 0);
  const fr = [], gold = [];
  for (const y of [H0 + 0.035, H1 - 0.035]) fr.push(new THREE.BoxGeometry(L + 0.04, 0.07, D + 0.04).translate(0, y, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.push(new THREE.BoxGeometry(0.08, H1 - H0, 0.08).translate(sx * L / 2, (H0 + H1) / 2, sz * D / 2));
  cart.add(new THREE.Mesh(merge(fr), m.darkTeak));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [H0 + 0.04, H1 - 0.04]) gold.push(new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(sx * L / 2, y, sz * D / 2));
  // brushed steel worktop with a brass edge
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(L + 0.12, 0.05, D + 0.12).translate(0, H1 + 0.025, 0), m.steel));
  for (const sz of [-1, 1]) gold.push(new THREE.BoxGeometry(L + 0.12, 0.03, 0.015).translate(0, H1 + 0.04, sz * (D / 2 + 0.06)));
  // wheels, axle, legs, handles
  const wheelG = [];
  for (const sz of [-1, 1]) {
    const wh = [new THREE.TorusGeometry(0.38, 0.032, 8, 36)];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; rod(V(0, 0, 0), V(Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0), 0.015, wh, 5); }
    wheelG.push(merge(wh).translate(-0.85, 0.42, sz * (D / 2 + 0.09)));
    cart.add(new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.013, 6, 40).translate(-0.85, 0.42, sz * (D / 2 + 0.09)), m.dark));
    gold.push(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 14).rotateX(Math.PI / 2).translate(-0.85, 0.42, sz * (D / 2 + 0.09)));
  }
  cart.add(new THREE.Mesh(merge(wheelG), m.darkTeak));
  const legs = [];
  rod(V(-0.85, 0.42, -D / 2 - 0.1), V(-0.85, 0.42, D / 2 + 0.1), 0.025, legs, 8);
  for (const sz of [-1, 1]) {
    legs.push(new THREE.BoxGeometry(0.07, H0, 0.07).translate(1.15, H0 / 2, sz * 0.36));
    rod(V(-1.3, H0 + 0.35, sz * 0.36), V(-1.9, 0.92, sz * 0.36), 0.026, legs, 8);
  }
  cart.add(new THREE.Mesh(merge(legs), m.darkTeak));
  rod(V(-1.9, 0.92, -0.42), V(-1.9, 0.92, 0.42), 0.03, gold, 10);

  // the round loyang for martabak manis, on its burner, a golden honeycomb cake inside
  const iron = new THREE.MeshStandardMaterial({ color: '#2a2826', roughness: 0.45, metalness: 0.7 });
  const burner = (x, z) => {
    cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 20).translate(x, T + 0.03, z), m.dark));
    cart.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.01, 6, 24).rotateX(Math.PI / 2).translate(x, T + 0.065, z), new THREE.MeshStandardMaterial({ color: '#4a8cff', emissive: '#3a6cff', emissiveIntensity: 1.6 })));
  };
  burner(-0.75, 0.1);
  cart.add(new THREE.Mesh(lathe([[0, 0], [0.2, 0], [0.24, 0.09], [0.225, 0.09], [0.19, 0.012], [0, 0.012]], 32).translate(-0.75, T + 0.07, 0.1), iron));
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.19, 0.065, 32).translate(-0.75, T + 0.11, 0.1), new THREE.MeshStandardMaterial({ map: honeycombTexture(), roughness: 0.55 }));
  cart.add(cake);
  // the flat square iron for martabak telur, one folded parcel crisping on it, a spatula
  burner(0.05, 0.1);
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.5).translate(0.05, T + 0.08, 0.1), iron));
  const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.18).translate(0.05, T + 0.11, 0.1), std('#d8a040', { roughness: 0.5 }));
  cart.add(parcel);
  cart.add(new THREE.Mesh(merge([new THREE.BoxGeometry(0.11, 0.004, 0.09).translate(0.27, T + 0.096, 0.18), new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6).rotateZ(Math.PI / 2 - 0.25).translate(0.4, T + 0.115, 0.2)]), m.steel));
  // prep along the back edge: eggs, leek, onion, toppings, butter, condensed milk, dough
  const BZ = 0.36;
  const eggs = [];
  for (let i = 0; i < 9; i++) eggs.push(new THREE.SphereGeometry(0.024, 10, 8).scale(1, 1.25, 1).translate(-1.12 + (i % 3) * 0.05, T + 0.05 + Math.floor(i / 3) * 0.03, BZ + (i % 2) * 0.03 - 0.02));
  cart.add(new THREE.Mesh(merge(eggs), std('#e8d0b0', { roughness: 0.5 })));
  cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.08, 14, 1, true).translate(-1.07, T + 0.04, BZ), new THREE.MeshStandardMaterial({ color: '#8a8a88', metalness: 0.8, roughness: 0.4, wireframe: true })));
  const bowl = (x, col, n) => {
    cart.add(new THREE.Mesh(lathe([[0, 0], [0.045, 0], [0.07, 0.05], [0.067, 0.05], [0, 0.006]], 18).translate(x, T, BZ), m.white));
    const bits = [];
    for (let i = 0; i < n; i++) bits.push(new THREE.BoxGeometry(0.012, 0.006, 0.012).rotateY(rng() * 3).translate(x + (rng() - 0.5) * 0.08, T + 0.04 + rng() * 0.012, BZ + (rng() - 0.5) * 0.08));
    cart.add(new THREE.Mesh(merge(bits), std(col)));
  };
  bowl(-0.42, '#5aa040', 40); bowl(-0.25, '#f0e8f0', 34);
  [['#3e2214', 0.42], ['#f2d36a', 0.55], ['#c89a5a', 0.68]].forEach(([col, x]) => {
    const j = new THREE.Group();
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 16, 1, true).translate(0, 0.065, 0), m.glass);
    gl.renderOrder = 2; j.add(gl);
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.09, 14).translate(0, 0.045, 0), std(col, { roughness: 0.8 })));
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.02, 16).translate(0, 0.14, 0), m.brass));
    j.position.set(x, T, BZ); cart.add(j);
  });
  cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16).translate(0.82, T + 0.05, BZ), std('#f2d040', { metalness: 0.4, roughness: 0.35 })));
  cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 16).translate(0.94, T + 0.045, BZ), std('#e8e2d4', { metalness: 0.5, roughness: 0.3 })));
  cart.add(new THREE.Mesh(lathe([[0, 0], [0.08, 0], [0.12, 0.07], [0.115, 0.07], [0, 0.008]], 20).translate(1.1, T, BZ - 0.05), m.steel));
  cart.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1).translate(1.1, T + 0.02, BZ - 0.05), std('#efe0c0', { roughness: 0.7 })));
  // serving plates at the front edge: what she can take
  const manisShow = martabakManis(); manisShow.position.set(0.55, T, -0.3); manisShow.rotation.y = 0.2; cart.add(manisShow);
  const telurShow = martabakTelur(); telurShow.position.set(-0.3, T, -0.3); telurShow.rotation.y = -0.15; cart.add(telurShow);
  // a stack of kraft boxes
  const boxes = [];
  for (let i = 0; i < 5; i++) boxes.push(new THREE.BoxGeometry(0.24, 0.05, 0.24).translate(1.12, T + 0.025 + i * 0.052, -0.22));
  cart.add(new THREE.Mesh(merge(boxes), std('#c9a27a', { roughness: 0.9 })));
  cart.add(new THREE.Mesh(merge(gold), m.gold));

  // canopy: teak posts, a green-and-cream striped vault, a gold fringe, the name board on top
  const posts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.push(new THREE.BoxGeometry(0.05, 1.5, 0.05).translate(sx * 1.22, T + 0.75, sz * 0.44));
  for (const sz of [-1, 1]) posts.push(new THREE.BoxGeometry(2.54, 0.06, 0.05).translate(0, T + 1.47, sz * 0.44));
  cart.add(new THREE.Mesh(merge(posts), m.darkTeak));
  const canTex = canvasTex(64, 256, (g, W, H) => {
    g.fillStyle = '#efe2c4'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1f3d2e';
    for (let i = 0; i < 8; i++) g.fillRect(0, (i + 0.25) * (H / 8), W, H / 16);
  });
  const r = 0.69, a = 0.85;
  const vault = new THREE.CylinderGeometry(r, r, L + 0.3, 24, 1, true, Math.PI / 2 - a, 2 * a).rotateZ(Math.PI / 2).translate(0, T + 1.5 - r * Math.cos(a), 0);
  const canopy = new THREE.Mesh(vault, new THREE.MeshStandardMaterial({ map: canTex, roughness: 0.85, side: THREE.DoubleSide }));
  canopy.castShadow = true;
  cart.add(canopy);
  const edgeZ = r * Math.sin(a), edgeY = T + 1.5, fringe = [];
  for (const sz of [-1, 1]) for (let i = 0; i < 26; i++) fringe.push(new THREE.BoxGeometry(0.012, 0.09, 0.006).translate(-L / 2 - 0.15 + (i + 0.5) * ((L + 0.3) / 26), edgeY - 0.045, sz * (edgeZ + 0.005)));
  cart.add(new THREE.Mesh(merge(fringe), m.gold));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.42).rotateY(Math.PI), new THREE.MeshBasicMaterial({ map: dapurPanelTexture(name, brand), color: '#cfc6b4' }));
  board.position.set(0, T + 1.95, -0.02);
  cart.add(board);
  const boardBack = board.clone(); boardBack.rotation.y = Math.PI; boardBack.position.z = 0.02; cart.add(boardBack);
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.03).translate(0, T + 1.95, 0), m.darkTeak));
  for (const sx of [-0.85, 0.85]) rod(V(sx, T + 1.7, 0), V(sx, T + 1.72, 0), 0.02, posts, 6);
  // a caged bulb lamp hanging over the griddles
  const lampG = new THREE.Group();
  lampG.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8).scale(1, 1.3, 1), m.soft));
  const cage = [];
  for (let k = 0; k < 6; k++) { const b = (k / 6) * Math.PI * 2; rod(V(Math.cos(b) * 0.08, -0.09, Math.sin(b) * 0.08), V(Math.cos(b) * 0.08, 0.1, Math.sin(b) * 0.08), 0.004, cage, 4); }
  cage.push(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 4).translate(0, 0.25, 0));
  lampG.add(new THREE.Mesh(merge(cage), m.brass));
  lampG.position.set(-0.35, T + 1.15, 0);
  cart.add(lampG);
  const light = new THREE.PointLight('#ffc27a', 4, 8, 2);
  light.position.set(-0.35, T + 1.0, -0.4);
  cart.add(light);
  // menu A-frame
  const menu = new THREE.Group();
  menu.position.set(-1.0, 0, -1.05); menu.rotation.y = 0.25;
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7).rotateY(Math.PI), new THREE.MeshBasicMaterial({ map: signTexture([name, 'Martabak Manis', 'cokelat · keju · kacang', 'Martabak Telur', 'telur bebek · daun bawang'], { w: 300, h: 440, bg: '#1f3d2e', fg: '#efe2c4', border: '#c9a25a', title: 0.12 }), color: '#c8c0b0' }));
  mb.position.set(0, 0.62, 0); mb.rotation.x = 0.12;
  menu.add(mb);
  const mf = [];
  rod(V(-0.24, 0, -0.08), V(-0.24, 0.98, 0.04), 0.015, mf); rod(V(0.24, 0, -0.08), V(0.24, 0.98, 0.04), 0.015, mf);
  rod(V(-0.24, 0, 0.3), V(-0.24, 0.98, 0.05), 0.012, mf); rod(V(0.24, 0, 0.3), V(0.24, 0.98, 0.05), 0.012, mf);
  menu.add(new THREE.Mesh(merge(mf), m.darkTeak));
  cart.add(menu);
  shadowAll(cart, true, true);

  cart.updateMatrixWorld(true);
  const W = (x, y, z) => V(x, y, z).applyMatrix4(cart.matrixWorld);
  const a0 = W(-1.9, 0, 0), a1 = W(1.35, 0, 0);
  out.colliders.push({ seg: [a0.x, a0.z, a1.x, a1.z], r: 0.62 });
  const mp = W(-1.0, 0, -1.0); out.colliders.push({ x: mp.x, z: mp.z, r: 0.3 });
  out.interacts.push({ center: W(0.55, T + 0.05, -0.3), radius: 0.17, label: 'martabak manis', food: 'manis' });
  out.interacts.push({ center: W(-0.3, T + 0.05, -0.3), radius: 0.17, label: 'martabak telur', food: 'telur' });
  out.tables.push(W(0.95, T + 0.01, -0.3));
  return {
    light,
    update(t) { light.intensity = 4 * (0.96 + Math.sin(t * 7.3) * 0.02); },
  };
}

/** An empty cart bay waits with a frangipani planter until a new cart arrives. */
function emptyBay(m, rng, out, bay) {
  const g = new THREE.Group();
  g.position.set(bay.x, Y, bay.z);
  g.rotation.y = bay.yaw;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.8).translate(0, 0.275, 0.3), m.stone));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.7).translate(0, 0.55, 0.3), std('#3a2a1e', { roughness: 1 })));
  const tr = [], lv = [], bl = [];
  for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.28 + rng(); rod(V(0, 0.5, 0.3), V(Math.cos(a) * 0.4, 1.3 + rng() * 0.3, 0.3 + Math.sin(a) * 0.25), 0.04, tr, 6); }
  for (let i = 0; i < 40; i++) { const a = rng() * 6.28, r = 0.15 + rng() * 0.45; lv.push(new THREE.SphereGeometry(0.16, 8, 6).scale(1.5, 0.22, 0.6).rotateY(a).translate(Math.cos(a) * r, 1.35 + rng() * 0.35, 0.3 + Math.sin(a) * r * 0.6)); }
  for (let i = 0; i < 40; i++) bl.push(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 0.45, 1).translate((rng() - 0.5) * 1.1, 1.5 + rng() * 0.3, 0.3 + (rng() - 0.5) * 0.7));
  g.add(new THREE.Mesh(merge(tr), std('#8a7a68', { roughness: 0.8 })));
  g.add(new THREE.Mesh(merge(lv), std('#3f6b35', { roughness: 0.6 })));
  g.add(new THREE.Mesh(merge(bl), new THREE.MeshStandardMaterial({ color: '#fbf1dc', emissive: '#f6d8a0', emissiveIntensity: 0.25 })));
  for (let i = 0; i < 26; i++) {
    const a = rng() * 6.28;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4).scale(1, 0.4, 1).translate((rng() - 0.5) * 1.5, 0.6 + rng() * 0.1, 0.3 + (rng() - 0.5) * 0.6), std(['#d4849b', '#f0e0e6', '#f3e08a'][i % 3])));
  }
  shadowAll(g, true, true);
  out.group.add(g);
  const p = V(0, 0, 0.3).applyAxisAngle(V(0, 1, 0), bay.yaw);
  out.colliders.push({ x: bay.x + p.x, z: bay.z + p.z, r: 0.75 });
}

/* ======================= shared pavilion frame ======================= */

const PX = 4.75, PZ = 4.25, H = 2.9, IX = 3.0, IZ = 2.6; // column grid, eave height, inner tier ring
const COLUMN_SPOTS = [[-PX, -PZ], [0, -PZ], [PX, -PZ], [-PX, PZ], [0, PZ], [PX, PZ], [-PX, 0], [PX, 0]];

function ringBeams(ax, az, y, t, out) {
  beam(V(-ax, y, -az), V(ax, y, -az), t, out); beam(V(-ax, y, az), V(ax, y, az), t, out);
  beam(V(-ax, y, -az), V(-ax, y, az), t, out); beam(V(ax, y, -az), V(ax, y, az), t, out);
}
function vpanel(ax, az, bx, bz, y0, y1, out) {
  const g = new THREE.PlaneGeometry(Math.hypot(bx - ax, bz - az), y1 - y0);
  g.rotateY(Math.atan2(-(bz - az), bx - ax));
  g.translate((ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
  out.push(g);
}
/** Frieze panels hung between the columns, under the ring beam. */
function friezes(out, y0 = H - 0.45, y1 = H - 0.1) {
  for (const [ax, az, bx, bz] of [[-PX, -PZ, 0, -PZ], [0, -PZ, PX, -PZ], [-PX, PZ, 0, PZ], [0, PZ, PX, PZ], [-PX, -PZ, -PX, 0], [-PX, 0, -PX, PZ], [PX, -PZ, PX, 0], [PX, 0, PX, PZ]]) {
    const dx = Math.sign(bx - ax) * 0.16, dz = Math.sign(bz - az) * 0.16;
    vpanel(ax + dx, az + dz, bx - dx, bz - dz, y0, y1, out);
  }
}
/** Curved brackets from each column up to the ring beams. */
function brackets(out, r = 0.3) {
  for (const [x, z] of COLUMN_SPOTS) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (Math.abs(x + dx) > PX + 0.01 || Math.abs(z + dz) > PZ + 0.01) continue;
    const g = new THREE.TorusGeometry(r, 0.024, 6, 10, Math.PI / 2).rotateZ(Math.PI / 2).translate(r, H - r - 0.1, 0);
    g.rotateY(Math.atan2(-dz, dx));
    g.translate(x, 0, z);
    out.push(g);
  }
}
const nameSigns = (name, bg, fg, border) => new THREE.MeshBasicMaterial({ map: signTexture([name], { w: 900, h: 150, bg, fg, border, title: 0.46 }), color: '#d8cfbd' });

/* ======================= REVA MAIA'S NHÀ VIỆT (west pod) ======================= */

function buildNhaViet(m, rng, name, cx, cz, out) {
  const nv = new THREE.Group();
  nv.position.set(cx, Y, cz);
  out.group.add(nv);
  const col = (x, z, r) => out.colliders.push({ x: cx + x, z: cz + z, r });
  const seg = (ax, az, bx, bz, r) => out.colliders.push({ seg: [cx + ax, cz + az, cx + bx, cz + bz], r });
  const table = (x, y, z) => out.tables.push(V(cx + x, Y + y, cz + z));
  const put = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; nv.add(obj); return obj; };
  const H2 = 3.95;

  /* ---- red-lacquer columns on stone bases, gilded bands and brackets ---- */
  const cols = [], bases = [], gold = [];
  for (const [x, z] of COLUMN_SPOTS) {
    cols.push(new THREE.CylinderGeometry(0.12, 0.14, H - 0.2, 16).translate(x, 0.2 + (H - 0.2) / 2, z));
    bases.push(new THREE.CylinderGeometry(0.2, 0.26, 0.2, 8).translate(x, 0.1, z));
    for (const y of [0.3, H - 0.24]) gold.push(new THREE.CylinderGeometry(0.145, 0.145, 0.05, 16).translate(x, y, z));
    col(x, z, 0.2);
  }
  brackets(gold);
  nv.add(new THREE.Mesh(merge(cols), m.red));
  nv.add(new THREE.Mesh(merge(bases), m.stone));
  /* ---- beams, tie beams and king posts carrying the upper tier, rafters ---- */
  const bm = [];
  ringBeams(PX, PZ, H, 0.2, bm);
  for (const z of [-IZ, IZ]) beam(V(-PX, H + 0.04, z), V(PX, H + 0.04, z), 0.15, bm);
  for (const x of [-IX, IX]) beam(V(x, H + 0.04, -PZ), V(x, H + 0.04, PZ), 0.15, bm);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bm.push(new THREE.BoxGeometry(0.16, H2 + 0.5 - H, 0.16).translate(sx * IX, (H + H2 + 0.5) / 2, sz * IZ));
  ringBeams(IX, IZ, H2, 0.16, bm); ringBeams(IX, IZ, H2 + 0.5, 0.16, bm);
  for (let x = -PX + 0.45; x < PX - 0.3; x += 0.55) for (const s of [-1, 1]) beam(V(x, 3.17, s * PZ), V(x * IX / PX, H2 - 0.1, s * IZ), 0.07, bm);
  for (let z = -PZ + 0.45; z < PZ - 0.3; z += 0.55) for (const s of [-1, 1]) beam(V(s * PX, 3.17, z), V(s * IX, H2 - 0.1, z * IZ / PZ), 0.07, bm);
  nv.add(new THREE.Mesh(merge(bm), m.lacquer));
  for (const sz of [-1, 1]) gold.push(new THREE.BoxGeometry(2 * PX, 0.03, 0.03).translate(0, H - 0.08, sz * (PZ + 0.1)));
  for (const sx of [-1, 1]) gold.push(new THREE.BoxGeometry(0.03, 0.03, 2 * PZ).translate(sx * (PX + 0.1), H - 0.08, 0));
  nv.add(new THREE.Mesh(merge(gold), m.gold));
  /* ---- lattice friezes + a lattice clerestory between the tiers ---- */
  const lat = new THREE.MeshStandardMaterial({ map: latticeTexture(), color: '#6a1e14', alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4 });
  const fz = [];
  friezes(fz);
  vpanel(-IX, -IZ, IX, -IZ, H2 + 0.06, H2 + 0.44, fz); vpanel(-IX, IZ, IX, IZ, H2 + 0.06, H2 + 0.44, fz);
  vpanel(-IX, -IZ, -IX, IZ, H2 + 0.06, H2 + 0.44, fz); vpanel(IX, -IZ, IX, IZ, H2 + 0.06, H2 + 0.44, fz);
  nv.add(new THREE.Mesh(merge(fz), lat));

  /* ---- the two-tier tiled roof, upturned eaves, dragons guarding the moon ---- */
  const tile = new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.7, side: THREE.DoubleSide });
  const roof = new THREE.Mesh(merge([...frustum(5.55, 5.05, H + 0.05, IX, IZ, H2), ...frustum(IX + 0.45, IZ + 0.45, H2 + 0.42, 1.5, 0, H2 + 1.7)]), tile);
  roof.castShadow = true;
  nv.add(roof);
  const rd = [];
  hips(5.55, 5.05, H + 0.05, IX, IZ, H2, 0.11, rd);
  hips(IX + 0.45, IZ + 0.45, H2 + 0.42, 1.5, 0, H2 + 1.7, 0.1, rd);
  beam(V(-1.55, H2 + 1.76, 0), V(1.55, H2 + 1.76, 0), 0.17, rd);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    upturn(sx * 5.55, H + 0.08, sz * 5.05, rd, 0.06, 1.1);
    upturn(sx * (IX + 0.45), H2 + 0.45, sz * (IZ + 0.45), rd, 0.05, 0.85);
  }
  for (const s of [-1, 1]) rd.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(s * 1.2, H2 + 1.8, 0), V(s * 1.6, H2 + 1.86, 0), V(s * 1.82, H2 + 2.12, 0), V(s * 1.68, H2 + 2.34, 0), V(s * 1.52, H2 + 2.24, 0)]), 16, 0.065, 6));
  // eave boards
  for (const [ax, az, bx, bz] of [[-5.55, -5.05, 5.55, -5.05], [-5.55, 5.05, 5.55, 5.05], [-5.55, -5.05, -5.55, 5.05], [5.55, -5.05, 5.55, 5.05]]) beam(V(ax, H, az), V(bx, H, bz), 0.1, rd);
  nv.add(new THREE.Mesh(merge(rd), new THREE.MeshStandardMaterial({ color: '#2a1d18', roughness: 0.5 })));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.2, 28), new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: '#ffe8b8', emissiveIntensity: 1.3, side: THREE.DoubleSide }));
  moon.position.set(0, H2 + 2.1, 0);
  nv.add(moon);
  const flames = [], dragons = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; flames.push(new THREE.ConeGeometry(0.028, 0.1, 5).rotateZ(-a).translate(Math.sin(a) * 0.26, H2 + 2.1 + Math.cos(a) * 0.26, 0)); }
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(V(s * (1.3 - t * 0.95), H2 + 1.88 + Math.sin(t * Math.PI * 2.5) * 0.1 + t * 0.12, 0)); }
    dragons.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.045, 6));
    dragons.push(new THREE.SphereGeometry(0.07, 10, 8).scale(1.4, 1, 0.9).translate(s * 0.32, H2 + 2.02, 0));
    for (let k = 0; k < 5; k++) dragons.push(new THREE.ConeGeometry(0.02, 0.09, 4).translate(s * (1.15 - k * 0.18), H2 + 2.0 + Math.sin((k / 5) * Math.PI * 2.5) * 0.08, 0));
  }
  nv.add(new THREE.Mesh(merge(dragons), new THREE.MeshPhysicalMaterial({ color: '#2f7a5a', roughness: 0.3, clearcoat: 0.8 })));
  nv.add(new THREE.Mesh(merge(flames), m.gold));

  /* ---- the kitchen wall: herb wall, lacquer paintings, ceramics ---- */
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.45, 0.1).translate(-0.5, 1.225, 4.47), m.lacquer));
  const wallGold = [];
  wallGold.push(new THREE.BoxGeometry(8.8, 0.03, 0.02).translate(-0.5, 2.4, 4.41), new THREE.BoxGeometry(8.8, 0.03, 0.02).translate(-0.5, 1.15, 4.41));
  for (const ax of [-1.7, 1.7]) {
    const art = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.05).rotateY(Math.PI), new THREE.MeshStandardMaterial({ map: lacquerArtTexture(ax < 0 ? 0 : 1), roughness: 0.25 }));
    art.position.set(ax, 1.78, 4.405);
    nv.add(art);
    for (const [w, h, dx, dy] of [[0.95, 0.05, 0, 0.55], [0.95, 0.05, 0, -0.55], [0.05, 1.15, 0.45, 0], [0.05, 1.15, -0.45, 0]]) wallGold.push(new THREE.BoxGeometry(w, h, 0.03).translate(ax + dx, 1.78 + dy, 4.4));
  }
  nv.add(new THREE.Mesh(merge(wallGold), m.gold));
  const troughs = [], herbs = [];
  for (const y of [1.45, 1.85, 2.25]) {
    troughs.push(new THREE.BoxGeometry(1.8, 0.13, 0.18).translate(-3.9, y, 4.33));
    leaves(rng, 70, -3.9, y + 0.05, 4.3, 1.75, 0.2, 0.16, 0.06, herbs);
  }
  nv.add(new THREE.Mesh(merge(troughs), m.teak));
  nv.add(new THREE.Mesh(merge(herbs), new THREE.MeshStandardMaterial({ color: '#4f8f3a', roughness: 0.55, side: THREE.DoubleSide })));
  const bw = new THREE.MeshPhysicalMaterial({ map: blueWhiteTexture(), roughness: 0.2, clearcoat: 0.8 });
  nv.add(new THREE.Mesh(merge([1.4, 1.85].map((y) => new THREE.BoxGeometry(1.3, 0.04, 0.26).translate(3.15, y, 4.3))), m.teak));
  for (let i = 0; i < 10; i++) {
    const y = i % 2 ? 1.42 : 1.87, x = 2.62 + Math.floor(i / 2) * 0.26;
    const tall = (i * 7) % 3 === 0;
    const prof = tall ? [[0, 0], [0.05, 0], [0.08, 0.08], [0.07, 0.2], [0.035, 0.26], [0.04, 0.28]] : [[0, 0], [0.04, 0], [0.09, 0.05], [0.1, 0.07], [0.095, 0.07], [0.035, 0.008], [0, 0.008]];
    put(new THREE.Mesh(lathe(prof, 20), bw), x, y + 0.02, 4.3);
  }

  /* ---- back counter: noodle station, steamers, bowls, pickles ---- */
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.9, 0.6).translate(-0.45, 0.45, 4.05), m.lacquer));
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(8.34, 0.05, 0.64).translate(-0.45, 0.925, 4.05), m.marble));
  const BT = 0.95;
  const potMat = new THREE.MeshStandardMaterial({ color: '#b9bdc2', metalness: 0.85, roughness: 0.28, side: THREE.DoubleSide });
  const pots = [[-4.15, 0.26], [-3.45, 0.22]];
  for (const [x, r] of pots) {
    nv.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.42, 28, 1, true).translate(x, BT + 0.21, 4.05), potMat));
    nv.add(new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 24).rotateX(-Math.PI / 2).translate(x, BT + 0.36, 4.05), std('#8a5a24', { roughness: 0.12 })));
    nv.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 28).rotateX(Math.PI / 2).translate(x, BT + 0.42, 4.05), m.steel));
  }
  // the noodle rack: fresh rice noodles hanging from a teak bar
  const rack = [], noodles = [];
  for (const x of [-2.95, -2.05]) rack.push(new THREE.BoxGeometry(0.05, 0.95, 0.05).translate(x, BT + 0.47, 4.15));
  rack.push(new THREE.BoxGeometry(1.0, 0.05, 0.05).translate(-2.5, BT + 0.93, 4.15));
  nv.add(new THREE.Mesh(merge(rack), m.teak));
  for (let b = 0; b < 6; b++) for (let k = 0; k < 14; k++) {
    const x = -2.85 + b * 0.14 + (rng() - 0.5) * 0.05, z = 4.15 + (rng() - 0.5) * 0.05;
    noodles.push(new THREE.CylinderGeometry(0.0025, 0.0025, 0.4 + rng() * 0.1, 3).translate(x, BT + 0.7, z));
  }
  nv.add(new THREE.Mesh(merge(noodles), std('#f4efe2', { roughness: 0.5 })));
  const steamer = [];
  for (let i = 0; i < 4; i++) steamer.push(new THREE.CylinderGeometry(0.17, 0.17, 0.09, 20).translate(-1.4, BT + 0.045 + i * 0.09, 4.05));
  steamer.push(new THREE.ConeGeometry(0.17, 0.08, 20).translate(-1.4, BT + 0.4, 4.05));
  nv.add(new THREE.Mesh(merge(steamer), new THREE.MeshStandardMaterial({ map: caneTexture(), color: '#d8b880', roughness: 0.85 })));
  const bowls = [];
  for (const x of [-0.75, -0.4]) for (let i = 0; i < 6; i++) bowls.push(new THREE.CylinderGeometry(0.1, 0.055, 0.06, 20, 1, true).translate(x, BT + 0.03 + i * 0.028, 4.05));
  nv.add(new THREE.Mesh(merge(bowls), new THREE.MeshPhysicalMaterial({ map: blueWhiteTexture(), roughness: 0.2, side: THREE.DoubleSide })));
  for (const [x, c] of [[0.5, '#f08a2a'], [0.78, '#f2ecdc'], [1.06, '#c8261a'], [1.34, '#9ab84a']]) {
    const j = new THREE.Group();
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 18, 1, true).translate(0, 0.12, 0), m.glass);
    gl.renderOrder = 2; j.add(gl);
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.17, 16).translate(0, 0.085, 0), std(c, { roughness: 0.35 })));
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 18).translate(0, 0.25, 0), m.red));
    put(j, x, BT, 4.05);
  }
  const board = new THREE.Group();
  board.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.32).translate(0, 0.02, 0), m.teak));
  const bh = [];
  leaves(rng, 26, -0.05, 0.05, 0, 0.3, 0.04, 0.2, 0.05, bh);
  board.add(new THREE.Mesh(merge(bh), m.leaf));
  board.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.08).translate(0.14, 0.045, 0.08), m.steel));
  put(board, 2.1, BT, 4.05, 0.1);
  for (let i = 0; i < 4; i++) put(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 14).translate(0, 0.07, 0), std(['#c9a25a', '#8a1e22', '#2f5a44', '#c9a25a'][i], { metalness: 0.5, roughness: 0.35 })), 2.85 + i * 0.13, BT, 4.1);

  /* ---- the front counter: red lacquer panels in gold frames, marble top ---- */
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.98, 0.7).translate(-0.6, 0.49, 2.7), m.lacquer));
  nv.add(new THREE.Mesh(new THREE.BoxGeometry(6.96, 0.06, 0.86).translate(-0.6, 1.01, 2.66), m.marble));
  const cp = [], cf = [];
  for (let i = 0; i < 6; i++) {
    const x = -3.9 + (i + 0.5) * 1.1;
    cp.push(new THREE.PlaneGeometry(0.92, 0.6).rotateY(Math.PI).translate(x, 0.52, 2.343));
    for (const [w, h, dx, dy] of [[0.98, 0.03, 0, 0.31], [0.98, 0.03, 0, -0.31], [0.03, 0.65, 0.48, 0], [0.03, 0.65, -0.48, 0]]) cf.push(new THREE.BoxGeometry(w, h, 0.014).translate(x + dx, 0.52 + dy, 2.343));
  }
  cf.push(new THREE.BoxGeometry(6.8, 0.03, 0.03).translate(-0.6, 0.1, 2.335));
  nv.add(new THREE.Mesh(merge(cp), m.red));
  nv.add(new THREE.Mesh(merge(cf), m.gold));
  seg(-4.0, 2.7, 2.8, 2.7, 0.42);
  seg(-4.6, 4.05, 3.7, 4.05, 0.35);

  // the plates, each one its own thing
  const top = 1.04;
  put(phinStation(m), -3.82, top, 2.88);
  put(eggCoffee(m), -3.66, top, 2.5);
  put(coconutCoffee(m), -3.28, top, 2.55);
  put(phoTray(m, rng), -2.45, top, 2.62);
  put(goiCuonLeaf(m, rng), -1.35, top, 2.62, 0.08);
  put(banhMiBasket(m, rng), -0.35, top, 2.66, -0.1);
  put(banhXeo(m, rng), 0.62, top, 2.6, 0.3);
  put(cheGlasses(m), 1.3, top, 2.55);
  put(lotusTeaSet(m, rng), 2.28, top, 2.62, -0.2);
  // along the back edge: herbs, limes, sauces, chopsticks
  const hb = new THREE.Group();
  hb.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 20, 1, true).translate(0, 0.04, 0), m.cane));
  const hl = [];
  leaves(rng, 40, 0, 0.06, 0, 0.24, 0.06, 0.24, 0.05, hl);
  hb.add(new THREE.Mesh(merge(hl), m.leaf));
  put(hb, -1.95, top, 2.95);
  const lb = new THREE.Group();
  lb.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.05, 20, 1, true).translate(0, 0.025, 0), bw));
  const lm = [];
  for (let i = 0; i < 8; i++) lm.push(new THREE.SphereGeometry(0.03, 10, 8).translate((rng() - 0.5) * 0.12, 0.05, (rng() - 0.5) * 0.12));
  lb.add(new THREE.Mesh(merge(lm), std('#7ab03a', { roughness: 0.5 })));
  put(lb, -0.9, top, 2.95);
  [['#c41e1e', 0], ['#5a2a12', 0.08], ['#a8742a', 0.16], ['#2a1a10', 0.24]].forEach(([c, dx]) => put(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.16, 10).translate(0, 0.08, 0), std(c, { roughness: 0.3 })), 0.1 + dx, top, 2.97));
  const cs = [];
  for (let k = 0; k < 14; k++) cs.push(new THREE.CylinderGeometry(0.003, 0.004, 0.24, 4).translate((k % 4) * 0.01 - 0.015, 0.14, Math.floor(k / 4) * 0.01 - 0.015));
  cs.push(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 14, 1, true).translate(0, 0.06, 0));
  put(new THREE.Mesh(merge(cs), std('#c99b62')), 1.0, top, 2.97);
  table(2.62, top, 2.72);

  // the fruit stand at the end of the counter
  put(fruitStand(m, rng), 3.62, 0, 2.78);
  col(3.62, 2.78, 0.45);

  /* ---- dining by the water: lacquer + marble tables, cane chairs, place settings ---- */
  const chair = () => {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44).translate(0, 0.46, 0), m.cane));
    const f = [];
    for (const [a, b2] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) f.push(new THREE.BoxGeometry(0.035, 0.46, 0.035).translate(a, 0.23, b2));
    for (const a of [-0.21, 0.21]) f.push(new THREE.BoxGeometry(0.035, 0.5, 0.035).translate(a, 0.71, 0.2));
    f.push(new THREE.BoxGeometry(0.48, 0.06, 0.04).translate(0, 0.95, 0.2));
    c.add(new THREE.Mesh(merge(f), m.lacquer));
    c.add(new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4).translate(0, 0.71, 0.2), m.cane));
    c.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.38).translate(0, 0.5, 0), std('#8a1e22', { roughness: 0.9 })));
    return c;
  };
  const dTable = (x, z) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.82).translate(0, 0.76, 0), m.marble));
    t.add(new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.06, 0.84).translate(0, 0.72, 0), m.lacquer));
    const lg = [];
    for (const [a, b2] of [[-0.58, -0.36], [0.58, -0.36], [-0.58, 0.36], [0.58, 0.36]]) lg.push(new THREE.BoxGeometry(0.06, 0.7, 0.06).translate(a, 0.35, b2));
    t.add(new THREE.Mesh(merge(lg), m.lacquer));
    const set = [], sticks = [];
    for (const [cxx, czz, ry] of [[-0.32, -0.66, Math.PI], [0.32, -0.66, Math.PI], [-0.32, 0.66, 0], [0.32, 0.66, 0]]) {
      const c = chair(); c.position.set(cxx, 0, czz); c.rotation.y = ry; t.add(c);
      const pz = Math.sign(czz) * 0.24;
      set.push(lathe([[0, 0], [0.08, 0], [0.11, 0.012], [0.105, 0.014], [0, 0.006]], 20).translate(cxx, 0.78, pz));
      set.push(lathe([[0, 0], [0.03, 0], [0.055, 0.045], [0.052, 0.045], [0, 0.008]], 16).translate(cxx, 0.795, pz));
      sticks.push(new THREE.BoxGeometry(0.008, 0.006, 0.22).translate(cxx + 0.14, 0.785, pz), new THREE.BoxGeometry(0.008, 0.006, 0.22).translate(cxx + 0.155, 0.785, pz));
    }
    t.add(new THREE.Mesh(merge(set), m.white));
    t.add(new THREE.Mesh(merge(sticks), std('#3a1d10')));
    const o = orchid(rng, 0.85, '#f6e7ee');
    o.position.set(-0.05, 0.78, 0);
    t.add(o);
    for (const [c, dx] of [['#c41e1e', 0.0], ['#5a2a12', 0.05], ['#a8742a', 0.1]]) t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.12, 10).translate(0.25 + dx, 0.84, 0), std(c, { roughness: 0.3 })));
    nv.add(t);
    seg(x - 0.45, z, x + 0.45, z, 0.85);
    table(x + 0.42, 0.78, z + 0.05);
    const cage = birdCage(m);
    cage.position.set(x, 2.05, z);
    nv.add(cage);
    const cord = []; rod(V(x, 2.57, z), V(x, 3.3, z), 0.004, cord, 4);
    nv.add(new THREE.Mesh(merge(cord), m.dark));
  };
  dTable(-2.6, -3.45);
  dTable(2.2, -3.45);

  /* ---- a low lotus-tea corner on a batik rug ---- */
  const lounge = new THREE.Group();
  lounge.position.set(-3.85, 0, 0.3);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: batikTexture('#5a1612', '#d8b060'), roughness: 0.95 }));
  rug.position.y = 0.012;
  lounge.add(rug);
  lounge.add(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.95).translate(0, 0.36, 0), m.red));
  const lt = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lt.push(new THREE.BoxGeometry(0.07, 0.34, 0.07).translate(sx * 0.4, 0.17, sz * 0.4));
  lounge.add(new THREE.Mesh(merge(lt), m.lacquer));
  lounge.add(new THREE.Mesh(merge([new THREE.BoxGeometry(0.97, 0.02, 0.02).translate(0, 0.385, 0.475), new THREE.BoxGeometry(0.97, 0.02, 0.02).translate(0, 0.385, -0.475), new THREE.BoxGeometry(0.02, 0.02, 0.97).translate(0.475, 0.385, 0), new THREE.BoxGeometry(0.02, 0.02, 0.97).translate(-0.475, 0.385, 0)]), m.gold));
  [['#2a7a72', 0.78, 0], ['#c9a25a', -0.78, 0], ['#8a1e22', 0, 0.78], ['#2a7a72', 0, -0.78]].forEach(([c, x, z]) => {
    lounge.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55).translate(x, 0.07, z), std(c, { roughness: 0.9 })));
    lounge.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 10).rotateZ(Math.PI / 2).rotateY(x ? Math.PI / 2 : 0).translate(x * 1.32, 0.2, z * 1.32), std('#d8b060', { roughness: 0.9 })));
  });
  const tea = lotusTeaSet(m, rng);
  tea.position.y = 0.385;
  lounge.add(tea);
  const lo = orchid(rng, 0.7, '#f0c8dc');
  lo.position.set(0.32, 0.385, -0.32);
  lounge.add(lo);
  nv.add(lounge);
  col(-3.85, 0.3, 0.7);
  table(-3.6, 0.4, 0.55);
  const lcage = birdCage(m);
  lcage.position.set(-3.85, 1.95, 0.3);
  nv.add(lcage);
  const lc = []; rod(V(-3.85, 2.47, 0.3), V(-3.85, 3.45, 0.3), 0.004, lc, 4);
  nv.add(new THREE.Mesh(merge(lc), m.dark));

  /* ---- a cluster of Hội An silk lanterns over the middle ---- */
  const lanternCols = ['#d42a2a', '#f2b632', '#d63c8c', '#f07a2a', '#2a9a8c', '#7a3cb0', '#e8c040', '#c41e3a', '#2a7ad0'];
  const cords = [];
  for (let i = 0; i < 19; i++) {
    const a = i * 2.4, rr = 0.25 + Math.sqrt(i / 19) * 1.05;
    const x = 0.3 + Math.cos(a) * rr, z = -0.7 + Math.sin(a) * rr * 0.8, y = 2.0 + rng() * 0.75;
    const l = silkLantern(lanternCols[i % lanternCols.length]);
    l.scale.setScalar(0.8 + rng() * 0.35);
    l.position.set(x, y, z);
    nv.add(l);
    rod(V(x, y + 0.35, z), V(x, H2 + 0.4, z), 0.003, cords, 3);
  }
  nv.add(new THREE.Mesh(merge(cords), m.dark));
  // rattan pendants over the counter
  for (const x of [-3.0, -0.9, 1.3]) {
    put(rattanPendant(m.cane, m.warm), x, 2.2, 2.62);
    const pc = []; rod(V(x, 2.45, 2.62), V(x, 2.95, 2.62), 0.004, pc, 4);
    nv.add(new THREE.Mesh(merge(pc), m.dark));
  }

  /* ---- jars and bamboo at the corners, the menu easel, the name boards ---- */
  const celadon = new THREE.MeshPhysicalMaterial({ color: '#9ab8a0', roughness: 0.15, clearcoat: 0.9 });
  const brown = new THREE.MeshPhysicalMaterial({ color: '#5a3420', roughness: 0.2, clearcoat: 0.8 });
  put(ceramicJar(celadon, 1.4), 4.25, 0, -3.75);
  put(ceramicJar(bw, 0.8), 3.75, 0, -3.95);
  put(ceramicJar(brown, 1.3), 4.25, 0, 3.75);
  put(ceramicJar(brown, 0.85), 4.3, 0.84, 3.75);
  col(4.1, -3.8, 0.5); col(4.25, 3.75, 0.4);
  const bam = new THREE.Group();
  bam.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.7, 16).translate(0, 0.35, 0), m.lacquer));
  const culms = [], bl = [];
  for (let i = 0; i < 8; i++) rod(V((rng() - 0.5) * 0.3, 0.6, (rng() - 0.5) * 0.3), V((rng() - 0.5) * 0.7, 2.5 + rng() * 0.5, (rng() - 0.5) * 0.7), 0.025, culms, 6);
  for (let i = 0; i < 70; i++) bl.push(new THREE.PlaneGeometry(0.03, 0.18).rotateZ(rng() * 6).rotateY(rng() * 6).translate((rng() - 0.5) * 0.9, 1.5 + rng() * 1.4, (rng() - 0.5) * 0.9));
  bam.add(new THREE.Mesh(merge(culms), std('#7a9a3a', { roughness: 0.5 })));
  bam.add(new THREE.Mesh(merge(bl), std('#4f8a3a', { side: THREE.DoubleSide })));
  put(bam, -4.55, 0, -3.85);
  col(-4.55, -3.85, 0.32);
  const easel = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshBasicMaterial({ map: signTexture(['Thực Đơn', 'Phở · Gỏi Cuốn · Bánh Mì', 'Bánh Xèo · Chè', 'Cà Phê Trứng · Trà Sen'], { w: 360, h: 500, bg: '#2a140d', fg: '#efe2c4', border: '#c9a25a', title: 0.16 }), color: '#cfc6b4' }));
  mb.position.set(0, 1.05, 0); mb.rotation.x = -0.1;
  easel.add(mb);
  const ef = [];
  rod(V(-0.28, 0, 0.12), V(-0.26, 1.55, -0.02), 0.016, ef); rod(V(0.28, 0, 0.12), V(0.26, 1.55, -0.02), 0.016, ef); rod(V(0, 0, -0.4), V(0, 1.45, -0.04), 0.014, ef);
  easel.add(new THREE.Mesh(merge(ef), m.gold));
  put(easel, 4.25, 0, 1.3, Math.PI / 2);
  col(4.25, 1.3, 0.3);
  const nameMat = nameSigns(name, '#2a140d', '#e3c06e', '#c9a25a');
  const sE = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.56), nameMat);
  sE.position.set(PX + 0.17, H - 0.28, 0); sE.rotation.y = Math.PI / 2;
  nv.add(sE);
  const sN = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.56), nameMat);
  sN.position.set(0, H - 0.28, -PZ - 0.17); sN.rotation.y = Math.PI;
  nv.add(sN);

  shadowAll(nv, true, true);
  const light = new THREE.PointLight('#ffc27a', 12, 11, 2);
  light.position.set(0.0, 2.6, 0.2);
  nv.add(light);
  nv.updateMatrixWorld(true);
  out.interacts.push({ center: V(cx - 2.58, Y + top + 0.09, cz + 2.62), radius: 0.18, label: 'phở', food: 'pho' });
  out.interacts.push({ center: V(cx - 1.35, Y + top + 0.05, cz + 2.62), radius: 0.2, label: 'gỏi cuốn', food: 'rolls' });

  // steam from the stock pots
  const steamTex = cloudTexture(64);
  const steam = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
    s.userData.ph = i / 14;
    s.userData.pot = pots[i % 2];
    nv.add(s);
    steam.push(s);
  }
  return {
    light,
    update(t) {
      for (const s of steam) {
        const k = (t * 0.22 + s.userData.ph) % 1;
        s.position.set(s.userData.pot[0] + Math.sin(t + s.userData.ph * 7) * 0.06, BT + 0.42 + k * 0.85, 4.05 + Math.cos(t * 0.6 + s.userData.ph * 4) * 0.06);
        s.scale.setScalar(0.14 + k * 0.45);
        s.material.opacity = Math.sin(Math.PI * k) * 0.13;
      }
    },
  };
}

/* ======================= THE JAMU BAR (east pod) ======================= */

function buildJamuBar(m, rng, name, cx, cz, out) {
  const jb = new THREE.Group();
  jb.position.set(cx, Y, cz);
  out.group.add(jb);
  const col = (x, z, r) => out.colliders.push({ x: cx + x, z: cz + z, r });
  const seg = (ax, az, bx, bz, r) => out.colliders.push({ seg: [cx + ax, cz + az, cx + bx, cz + bz], r });
  const table = (x, y, z) => out.tables.push(V(cx + x, Y + y, cz + z));
  const put = (obj, x, y, z, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; jb.add(obj); return obj; };
  const R1 = 3.7; // where the joglo's shallow lower roof meets the steep brunjung

  /* ---- saka columns: square teak on stone umpak, brass collars ---- */
  const saka = [], umpak = [], brass = [];
  for (const [x, z] of COLUMN_SPOTS) {
    saka.push(new THREE.BoxGeometry(0.22, H - 0.22, 0.22).translate(x, 0.22 + (H - 0.22) / 2, z));
    umpak.push(new THREE.CylinderGeometry(0.2, 0.3, 0.22, 4).rotateY(Math.PI / 4).translate(x, 0.11, z));
    for (const y of [0.26, H - 0.2]) brass.push(new THREE.BoxGeometry(0.25, 0.04, 0.25).translate(x, y, z));
    col(x, z, 0.2);
  }
  brackets(saka, 0.28);
  jb.add(new THREE.Mesh(merge(saka), m.darkTeak));
  jb.add(new THREE.Mesh(merge(umpak), m.stone));
  /* ---- beams, king posts, and the tumpang-sari ceiling rising under the brunjung ---- */
  const bm = [];
  ringBeams(PX, PZ, H, 0.2, bm);
  for (const z of [-IZ, IZ]) beam(V(-PX, H + 0.04, z), V(PX, H + 0.04, z), 0.15, bm);
  for (const x of [-IX, IX]) beam(V(x, H + 0.04, -PZ), V(x, H + 0.04, PZ), 0.15, bm);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bm.push(new THREE.BoxGeometry(0.18, R1 - H, 0.18).translate(sx * IX, (H + R1) / 2, sz * IZ));
  for (let k = 0; k < 6; k++) ringBeams(IX - k * 0.2, IZ - k * 0.2, R1 + k * 0.15, 0.15, bm);
  for (let x = -PX + 0.45; x < PX - 0.3; x += 0.5) for (const s of [-1, 1]) beam(V(x, 3.14, s * PZ), V(x * IX / PX, R1 - 0.08, s * IZ), 0.06, bm);
  for (let z = -PZ + 0.45; z < PZ - 0.3; z += 0.5) for (const s of [-1, 1]) beam(V(s * PX, 3.14, z), V(s * IX, R1 - 0.08, z * IZ / PZ), 0.06, bm);
  jb.add(new THREE.Mesh(merge(bm), m.darkTeak));
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * (IX - 1.0), 2 * (IZ - 1.0)).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: batikTexture('#3a2414', '#c9a25a'), roughness: 0.6 }));
  ceil.position.y = R1 + 0.82;
  jb.add(ceil);
  for (const sz of [-1, 1]) brass.push(new THREE.BoxGeometry(2 * PX, 0.03, 0.03).translate(0, H - 0.08, sz * (PZ + 0.11)));
  for (const sx of [-1, 1]) brass.push(new THREE.BoxGeometry(0.03, 0.03, 2 * PZ).translate(sx * (PX + 0.11), H - 0.08, 0));
  jb.add(new THREE.Mesh(merge(brass), m.brass));
  // bronze kawung friezes
  const fz = [];
  friezes(fz);
  jb.add(new THREE.Mesh(merge(fz), new THREE.MeshStandardMaterial({ map: kawungPanelTexture(), color: '#8a6a3c', metalness: 0.8, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide })));
  /* ---- the joglo roof in sirap shingles, brass finials ---- */
  const sirap = new THREE.MeshStandardMaterial({ map: sirapTexture(), roughness: 0.85, side: THREE.DoubleSide });
  const roof = new THREE.Mesh(merge([...frustum(5.55, 5.05, H + 0.05, IX, IZ, R1, 0.18), ...frustum(IX + 0.25, IZ + 0.25, R1 - 0.08, 1.3, 0, 5.9, 0.18)]), sirap);
  roof.castShadow = true;
  jb.add(roof);
  const rd = [];
  hips(5.55, 5.05, H + 0.05, IX, IZ, R1, 0.1, rd);
  hips(IX + 0.25, IZ + 0.25, R1 - 0.08, 1.3, 0, 5.9, 0.09, rd);
  beam(V(-1.35, 5.95, 0), V(1.35, 5.95, 0), 0.15, rd);
  for (const [ax, az, bx, bz] of [[-5.55, -5.05, 5.55, -5.05], [-5.55, 5.05, 5.55, 5.05], [-5.55, -5.05, -5.55, 5.05], [5.55, -5.05, 5.55, 5.05]]) beam(V(ax, H, az), V(bx, H, bz), 0.1, rd);
  jb.add(new THREE.Mesh(merge(rd), new THREE.MeshStandardMaterial({ color: '#1f1a16', roughness: 0.7 })));
  const fin = [];
  for (const s of [-1, 1]) {
    fin.push(new THREE.SphereGeometry(0.08, 12, 8).translate(s * 1.35, 6.08, 0));
    fin.push(new THREE.ConeGeometry(0.04, 0.32, 8).translate(s * 1.35, 6.3, 0));
  }
  fin.push(new THREE.CylinderGeometry(0.1, 0.14, 0.14, 8).translate(0, 6.04, 0), new THREE.SphereGeometry(0.1, 12, 8).translate(0, 6.2, 0), new THREE.ConeGeometry(0.045, 0.42, 8).translate(0, 6.5, 0));
  jb.add(new THREE.Mesh(merge(fin), m.brass));

  /* ---- the back bar: carved gebyok frame, mirror, three backlit shelves of bottles ---- */
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.45, 0.1).translate(0.5, 1.225, 4.47), m.darkTeak));
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.95, 0.6).translate(0.45, 0.475, 4.05), m.darkTeak));
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(8.34, 0.05, 0.64).translate(0.45, 0.975, 4.05), m.nero));
  const carve = gebyokTexture();
  const carveMat = new THREE.MeshStandardMaterial({ map: carve, alphaTest: 0.5, roughness: 0.5, side: THREE.DoubleSide });
  const doors = [], pulls = [];
  for (let i = 0; i < 7; i++) {
    const x = -3.55 + (i + 0.5) * (8.0 / 7);
    doors.push(new THREE.PlaneGeometry(1.0, 0.62).rotateY(Math.PI).translate(x, 0.5, 3.742));
    pulls.push(new THREE.SphereGeometry(0.022, 10, 8).translate(x + 0.4, 0.62, 3.73));
  }
  jb.add(new THREE.Mesh(merge(doors), carveMat));
  jb.add(new THREE.Mesh(merge(pulls), m.brass));
  const GX0 = -3.3, GX1 = 4.5, gm = (GX0 + GX1) / 2, gw = GX1 - GX0;
  const frame = [];
  for (const x of [GX0, GX1]) {
    frame.push(new THREE.BoxGeometry(0.3, 2.85, 0.24).translate(x, 1.425, 4.28));
    frame.push(new THREE.BoxGeometry(0.4, 0.12, 0.3).translate(x, 2.3, 4.26));
  }
  frame.push(new THREE.BoxGeometry(gw + 0.3, 0.12, 0.26).translate(gm, 2.28, 4.28));
  frame.push(new THREE.BoxGeometry(gw + 0.5, 0.1, 0.3).translate(gm, 2.98, 4.28));
  jb.add(new THREE.Mesh(merge(frame), m.darkTeak));
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(gw + 0.1, 0.62).rotateY(Math.PI), carveMat);
  crest.position.set(gm, 2.64, 4.2);
  jb.add(crest);
  for (const x of [GX0, GX1]) put(new THREE.Mesh(new THREE.PlaneGeometry(0.24, 1.9).rotateY(Math.PI), carveMat), x, 1.15, 4.155);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(gw - 0.34, 1.26).rotateY(Math.PI), m.mirror);
  mirror.position.set(gm, 1.63, 4.405);
  jb.add(mirror);
  const shelves = [], edges = [], strips = [];
  const SH = [1.3, 1.66, 2.02];
  for (const y of SH) {
    shelves.push(new THREE.BoxGeometry(gw - 0.34, 0.03, 0.3).translate(gm, y, 4.25));
    edges.push(new THREE.BoxGeometry(gw - 0.34, 0.03, 0.014).translate(gm, y, 4.1));
    strips.push(new THREE.BoxGeometry(gw - 0.4, 0.016, 0.02).translate(gm, y - 0.028, 4.37));
  }
  jb.add(new THREE.Mesh(merge(shelves), m.darkTeak));
  jb.add(new THREE.Mesh(merge(edges), m.brass));
  jb.add(new THREE.Mesh(merge(strips), new THREE.MeshStandardMaterial({ color: '#ffe2b0', emissive: '#ffb860', emissiveIntensity: 3 })));
  // bottles, instanced by shape, each with a cream label
  const shapes = [
    { geo: lathe([[0, 0], [0.038, 0], [0.04, 0.01], [0.04, 0.2], [0.03, 0.235], [0.014, 0.26], [0.014, 0.3], [0.017, 0.305], [0, 0.305]], 14), label: new THREE.CylinderGeometry(0.0405, 0.0405, 0.07, 14, 1, true).translate(0, 0.1, 0) },
    { geo: lathe([[0, 0], [0.05, 0], [0.056, 0.03], [0.05, 0.12], [0.02, 0.15], [0.016, 0.2], [0.02, 0.205], [0, 0.205]], 14), label: new THREE.CylinderGeometry(0.0565, 0.054, 0.05, 14, 1, true).translate(0, 0.06, 0) },
    { geo: lathe([[0, 0], [0.045, 0], [0.047, 0.01], [0.047, 0.17], [0.034, 0.19], [0.03, 0.2], [0.036, 0.215], [0.026, 0.215], [0.028, 0.25], [0, 0.25]], 14), label: new THREE.CylinderGeometry(0.0475, 0.0475, 0.06, 14, 1, true).translate(0, 0.09, 0) },
  ];
  const tints = ['#9a5214', '#7a3a10', '#3a5a2a', '#2a4a3a', '#e8dcc0', '#e0901c', '#8a2a3a', '#c9a25a', '#d6ab1f', '#5a2a14'];
  const lists = shapes.map(() => []);
  for (const y of SH) {
    for (let x = GX0 + 0.3; x < GX1 - 0.25; x += 0.17 + rng() * 0.05) {
      const k = Math.floor(rng() * 3);
      lists[k].push({ p: V(x, y + 0.016, 4.24 + (rng() - 0.5) * 0.08), ry: rng() * 6.28, s: 0.9 + rng() * 0.25, c: tints[Math.floor(rng() * tints.length)] });
    }
  }
  const bottleMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, clearcoat: 1, emissive: '#3a2410', emissiveIntensity: 0.4 });
  const labelMat = new THREE.MeshStandardMaterial({ color: '#efe4cc', roughness: 0.8, side: THREE.DoubleSide });
  shapes.forEach((sh, k) => {
    jb.add(instanced(sh.geo, bottleMat, lists[k]));
    jb.add(instanced(sh.label, labelMat, lists[k].map((it) => ({ ...it, c: null }))));
  });
  // on the back counter: rhizome jars, the copper kettle on its brazier, a lumpang, more jars
  const rh = { kunyit: '#e88a1a', jahe: '#d8b07a', kencur: '#c9a98a', temulawak: '#d49a2a', asam: '#5a2e1a', 'gula aren': '#7a4a20', sereh: '#b8c878', 'kayu manis': '#7a3e1c' };
  Object.values(rh).forEach((c, i) => put(spiceJar(m, rng, c, 0.26 + (i % 3) * 0.05, 0.085), -3.35 + i * 0.36, 1.0, 4.08));
  put(copperKettle(m), 3.95, 1.0, 4.05);
  put(lumpang(), 3.3, 1.0, 4.08);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 14, 1, true), m.glass);
    g.renderOrder = 2;
    put(g, 0.6 + (i % 2) * 0.09, 1.045 + Math.floor(i / 2) * 0.09, 4.05);
  }
  seg(-3.7, 4.05, 4.6, 4.05, 0.35);

  /* ---- the bar: backlit onyx front, teak top with a brass edge, foot rail ---- */
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.0, 0.7).translate(0.6, 0.5, 2.7), m.darkTeak));
  const onyx = onyxTexture();
  const onyxMat = new THREE.MeshStandardMaterial({ map: onyx, color: '#b0a090', emissive: '#ffffff', emissiveMap: onyx, emissiveIntensity: 0.26, roughness: 0.25 });
  const ony = [], stiles = [], trims = [];
  for (let i = 0; i < 5; i++) {
    const x = -2.8 + 0.1 + (i + 0.5) * (6.6 / 5);
    ony.push(new THREE.PlaneGeometry(6.6 / 5 - 0.1, 0.68).rotateY(Math.PI).translate(x, 0.56, 2.343));
  }
  for (let i = 0; i <= 5; i++) stiles.push(new THREE.BoxGeometry(0.09, 0.8, 0.03).translate(-2.7 + i * (6.6 / 5), 0.56, 2.34));
  trims.push(new THREE.BoxGeometry(6.8, 0.035, 0.035).translate(0.6, 0.2, 2.33), new THREE.BoxGeometry(6.8, 0.035, 0.035).translate(0.6, 0.92, 2.33));
  jb.add(new THREE.Mesh(merge(ony), onyxMat));
  jb.add(new THREE.Mesh(merge(stiles), m.darkTeak));
  const top = 1.07;
  jb.add(new THREE.Mesh(new THREE.BoxGeometry(6.96, 0.07, 0.92).translate(0.6, 1.035, 2.64), m.darkTeak));
  trims.push(new THREE.BoxGeometry(6.96, 0.04, 0.025).translate(0.6, 1.04, 2.18));
  rod(V(-2.78, 0.22, 2.12), V(3.98, 0.22, 2.12), 0.025, trims, 10);
  for (let x = -2.6; x < 4.0; x += 1.3) rod(V(x, 0.22, 2.12), V(x, 0.12, 2.36), 0.014, trims, 6);
  jb.add(new THREE.Mesh(merge(trims), m.brass));
  seg(-2.8, 2.7, 4.0, 2.7, 0.45);

  /* ---- brass jamu taps on a tower: ceramic handles in each jamu's colour ---- */
  const kinds = Object.keys(JAMU);
  const tower = [];
  for (const x of [-0.12, 1.32]) {
    tower.push(new THREE.CylinderGeometry(0.035, 0.055, 0.5, 14).translate(x, top + 0.25, 2.86));
    tower.push(new THREE.SphereGeometry(0.05, 12, 8).translate(x, top + 0.52, 2.86));
  }
  rod(V(-0.12, top + 0.5, 2.86), V(1.32, top + 0.5, 2.86), 0.038, tower, 14);
  tower.push(new THREE.BoxGeometry(1.5, 0.02, 0.2).translate(0.6, top + 0.01, 2.66));
  const taps = [];
  kinds.forEach((k, i) => {
    const tx = 0.12 + i * 0.32;
    rod(V(tx, top + 0.5, 2.86), V(tx, top + 0.5, 2.7), 0.016, tower, 8);
    rod(V(tx, top + 0.5, 2.7), V(tx, top + 0.39, 2.68), 0.013, tower, 8);
    tower.push(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 12).translate(tx, top + 0.565, 2.72));
    const cer = new THREE.MeshPhysicalMaterial({ color: JAMU[k], roughness: 0.2, clearcoat: 1, emissive: JAMU[k], emissiveIntensity: 0.12 });
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.17, 12).translate(0, top + 0.665, 0), cer), tx, 0, 2.72);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 18).rotateX(Math.PI / 2), cer);
    disc.position.set(tx, top + 0.5, 2.815);
    jb.add(disc);
    taps.push({ k, x: tx });
  });
  jb.add(new THREE.Mesh(merge(tower), m.brass));
  // bar dressing: garnish tray, tools, a tray of little glasses, lumpang, orchid, a hurricane candle
  put(garnishTray(m, rng), -1.85, top, 2.78);
  put(barTools(m), -1.0, top, 2.56, 0.1);
  const tray = new THREE.Group();
  tray.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 28).translate(0, 0.008, 0), m.brass));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const g = jamuGlass(kinds[i % kinds.length]);
    g.scale.setScalar(0.85);
    g.position.set(Math.cos(a) * 0.12, 0.015, Math.sin(a) * 0.12);
    tray.add(g);
  }
  put(tray, 2.15, top, 2.64);
  put(lumpang(), 2.9, top, 2.8);
  put(spiceJar(m, rng, '#7a3e1c', 0.2, 0.06), 3.35, top, 2.85);
  put(orchid(rng, 1.0, '#f0c8dc'), 3.7, top, 2.75);
  const hurricane = new THREE.Group();
  hurricane.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 16).translate(0, 0.015, 0), m.brass));
  const chim = new THREE.Mesh(lathe([[0.05, 0.03], [0.07, 0.1], [0.06, 0.2], [0.045, 0.26]], 16), m.glass);
  chim.renderOrder = 2;
  hurricane.add(chim);
  hurricane.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 10).translate(0, 0.06, 0), std('#f6eedc')));
  hurricane.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6).scale(1, 1.8, 1).translate(0, 0.105, 0), m.warm));
  put(hurricane, -2.5, top, 2.6);
  table(-2.3, top, 2.48); table(2.75, top, 2.45);

  /* ---- the stemware rack over the bar, brass dome pendants ---- */
  const rack = [];
  for (const z of [3.22, 3.48]) rack.push(new THREE.BoxGeometry(6.2, 0.05, 0.05).translate(0.6, 2.38, z));
  for (const x of [-2.4, 0.6, 3.6]) { rod(V(x, 2.4, 3.22), V(x, 3.4, 3.22), 0.008, rack, 4); rod(V(x, 2.4, 3.48), V(x, 3.4, 3.48), 0.008, rack, 4); }
  jb.add(new THREE.Mesh(merge(rack), m.darkTeak));
  const stem = lathe([[0, 0], [0.034, 0], [0.035, 0.005], [0.004, 0.012], [0.004, 0.1], [0.03, 0.11], [0.042, 0.15], [0.04, 0.2], [0.038, 0.2], [0.039, 0.15], [0.028, 0.113], [0, 0.108]], 14);
  stem.rotateX(Math.PI);
  const glasses = [];
  for (let x = -2.3; x < 3.55; x += 0.19) for (const z of [3.29, 3.41]) glasses.push({ p: V(x, 2.41, z) });
  const gl = instanced(stem, m.glass, glasses);
  gl.renderOrder = 2;
  jb.add(gl);
  const cords = [];
  for (const x of [-1.9, 0.6, 3.1]) {
    put(domePendant(m), x, 2.3, 2.5);
    rod(V(x, 2.45, 2.5), V(x, 2.95, 2.5), 0.004, cords, 4);
  }
  // a cluster of woven pendants under the tumpang sari
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, rr = i ? 0.55 : 0;
    const x = 0.6 + Math.cos(a) * rr, z = -0.5 + Math.sin(a) * rr, y = 2.35 + (i % 3) * 0.25;
    const p = bambooPendant(m); p.scale.setScalar(i ? 0.85 : 1.15);
    put(p, x, y, z);
    rod(V(x, y + 0.3, z), V(x, R1 + 0.8, z), 0.004, cords, 4);
  }
  jb.add(new THREE.Mesh(merge(cords), m.dark));

  /* ---- velvet bar stools ---- */
  for (const x of [-2.3, -1.15, 0.0, 1.15, 2.3, 3.45]) { put(velvetStool(m), x, 0, 1.8); col(x, 1.8, 0.22); }

  /* ---- a rhizome market stand at the spine end of the bar ---- */
  const stand = new THREE.Group();
  stand.add(new THREE.Mesh(merge([new THREE.CylinderGeometry(0.025, 0.03, 1.2, 8).translate(0, 0.6, 0), new THREE.CylinderGeometry(0.22, 0.26, 0.04, 16).translate(0, 0.02, 0)]), m.darkTeak));
  const roots = { tur: [], gin: [], pale: [], pods: [], grass: [] };
  [[0.42, 0.42], [0.32, 0.78], [0.22, 1.1]].forEach(([r, y], ti) => {
    stand.add(new THREE.Mesh(lathe([[0, 0], [r * 0.85, 0], [r, 0.08], [r * 0.97, 0.08], [0, 0.02]], 22).translate(0, y, 0), m.cane));
    const n = Math.round(r * 40);
    for (let i = 0; i < n; i++) {
      const a = rng() * 6.28, rr = rng() * r * 0.8;
      const p = [Math.cos(a) * rr, y + 0.06 + rng() * 0.04, Math.sin(a) * rr];
      const list = [roots.tur, roots.gin, roots.pale, roots.pods][(i + ti) % 4];
      if (list === roots.pods) list.push(new THREE.CapsuleGeometry(0.014, 0.1, 4, 6).rotateZ(Math.PI / 2).rotateY(rng() * 3).translate(...p));
      else list.push(new THREE.DodecahedronGeometry(0.03, 0).scale(1.8, 0.8, 1).rotateY(rng() * 3).translate(...p));
    }
  });
  for (let i = 0; i < 9; i++) rod(V((rng() - 0.5) * 0.06, 1.15, (rng() - 0.5) * 0.06), V((rng() - 0.5) * 0.2, 1.65, (rng() - 0.5) * 0.2), 0.008, roots.grass, 5);
  stand.add(new THREE.Mesh(merge(roots.tur), std('#e88a1a', { roughness: 0.8, flatShading: true })));
  stand.add(new THREE.Mesh(merge(roots.gin), std('#d8b07a', { roughness: 0.8, flatShading: true })));
  stand.add(new THREE.Mesh(merge(roots.pale), std('#d49a2a', { roughness: 0.8, flatShading: true })));
  stand.add(new THREE.Mesh(merge(roots.pods), std('#6a3a1e', { roughness: 0.8 })));
  stand.add(new THREE.Mesh(merge(roots.grass), std('#a8c070')));
  put(stand, -3.65, 0, 2.78);
  col(-3.65, 2.78, 0.45);

  /* ---- a tasting ledge along the water, with stools and candles ---- */
  const ledge = [];
  for (const [x0, x1] of [[-4.45, -0.22], [0.22, 4.45]]) {
    ledge.push(new THREE.BoxGeometry(x1 - x0, 0.05, 0.34).translate((x0 + x1) / 2, 1.05, -4.33));
    for (let x = x0 + 0.3; x < x1; x += 1.2) rod(V(x, 1.02, -4.4), V(x, 0.75, -4.48), 0.012, ledge, 6);
  }
  jb.add(new THREE.Mesh(merge(ledge), m.darkTeak));
  kinds.forEach((k, i) => { const g = jamuGlass(k); put(g, [-3.0, -1.3, 1.6, 3.2][i], 1.075, -4.3); });
  for (const x of [-2.2, 2.4]) { const h = hurricane.clone(); put(h, x, 1.075, -4.32); }
  for (const x of [-3.6, -2.4, -1.2, 1.2, 2.4, 3.6]) { put(velvetStool(m, 0.74, true), x, 0, -3.72, Math.PI); col(x, -3.72, 0.22); }
  for (const x of [-3.0, 1.6]) table(x + 0.25, 1.075, -4.3);

  /* ---- the lounge on the water side: velvet armchairs, a marble table, a floor lamp ---- */
  const arm = () => {
    const a = new THREE.Group();
    a.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.66).translate(0, 0.27, 0), m.velvet));
    a.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.14).translate(0, 0.68, 0.27), m.velvet));
    for (const s of [-1, 1]) a.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.66).translate(s * 0.36, 0.52, 0), m.velvet));
    const l = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(V(sx * 0.3, 0.08, sz * 0.26), V(sx * 0.32, 0, sz * 0.28), 0.015, l, 6);
    l.push(new THREE.BoxGeometry(0.74, 0.02, 0.68).translate(0, 0.08, 0));
    a.add(new THREE.Mesh(merge(l), m.brass));
    return a;
  };
  put(arm(), 3.95, 0, -1.4, Math.PI);
  put(arm(), 3.95, 0, 0.6, 0);
  const lt = new THREE.Group();
  lt.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 30).translate(0, 0.45, 0), m.nero));
  lt.add(new THREE.Mesh(merge([new THREE.CylinderGeometry(0.03, 0.03, 0.43, 10).translate(0, 0.22, 0), new THREE.CylinderGeometry(0.22, 0.24, 0.02, 24).translate(0, 0.01, 0), new THREE.TorusGeometry(0.36, 0.01, 6, 30).rotateX(Math.PI / 2).translate(0, 0.45, 0)]), m.brass));
  const lg = jamuGlass('beras kencur'); lg.position.set(0.1, 0.465, 0.05); lt.add(lg);
  put(lt, 3.95, 0, -0.4);
  table(3.8, 0.47, -0.45);
  const lamp = new THREE.Group();
  lamp.add(new THREE.Mesh(merge([new THREE.CylinderGeometry(0.015, 0.015, 1.5, 8).translate(0, 0.75, 0), new THREE.CylinderGeometry(0.16, 0.18, 0.03, 20).translate(0, 0.015, 0)]), m.brass));
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.28, 20, 1, true).translate(0, 1.55, 0), new THREE.MeshStandardMaterial({ color: '#f3e2c0', emissive: '#ffb060', emissiveIntensity: 1.1, side: THREE.DoubleSide })));
  put(lamp, 4.55, 0, 1.55);
  put(palmFronds(rng, 0.8), 4.4, 0, -2.6);
  col(3.95, -1.4, 0.45); col(3.95, 0.6, 0.45); col(3.95, -0.4, 0.38); col(4.4, -2.6, 0.38); col(4.55, 1.55, 0.18);
  for (let i = 0; i < 3; i++) {
    const z = -1.0 + i * 0.6, y = 2.0 + (i % 2) * 0.3;
    put(bambooPendant(m), 3.95, y, z);
    const c = []; rod(V(3.95, y + 0.3, z), V(3.95, 3.3, z), 0.004, c, 4);
    jb.add(new THREE.Mesh(merge(c), m.dark));
  }

  /* ---- menu easel at the entrance, name boards ---- */
  const easel = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshBasicMaterial({ map: signTexture([name, ...kinds], { w: 360, h: 500, bg: '#1f1a16', fg: '#e8c98a', border: '#c9a25a', title: 0.18 }), color: '#cfc6b4' }));
  mb.position.set(0, 1.05, 0); mb.rotation.x = -0.1;
  easel.add(mb);
  const ef = [];
  rod(V(-0.28, 0, 0.12), V(-0.26, 1.55, -0.02), 0.016, ef); rod(V(0.28, 0, 0.12), V(0.26, 1.55, -0.02), 0.016, ef); rod(V(0, 0, -0.4), V(0, 1.45, -0.04), 0.014, ef);
  easel.add(new THREE.Mesh(merge(ef), m.brass));
  put(easel, -4.25, 0, 1.3, -Math.PI / 2);
  col(-4.25, 1.3, 0.3);
  const nameMat = nameSigns(name, '#1f1a16', '#e8c98a', '#c9a25a');
  const sW = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.56), nameMat);
  sW.position.set(-PX - 0.17, H - 0.28, 0); sW.rotation.y = -Math.PI / 2;
  jb.add(sW);
  const sN = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.56), nameMat);
  sN.position.set(0, H - 0.28, -PZ - 0.17); sN.rotation.y = Math.PI;
  jb.add(sN);

  shadowAll(jb, true, true);
  const light = new THREE.PointLight('#ffc27a', 11, 11, 2);
  light.position.set(0.6, 2.6, 0.6);
  jb.add(light);
  for (const t of taps) out.interacts.push({ center: V(cx + t.x, Y + top + 0.42, cz + 2.66), radius: 0.12, label: `jamu · ${t.k}`, food: 'jamu', flavor: t.k });
  return { light };
}

/* ======================= build all three ======================= */

const CART_BUILDERS = {
  esputer: (m, rng, signs, out, bay) => buildEsPuter(m, rng, signs.gelato || 'Gelato', out, bay),
  martabak: (m, rng, signs, out, bay) => buildMartabak(m, rng, signs.martabak || 'Gesan’s Legit & Gurih', signs.dapur || 'Sajian Dapur Gesan', out, bay),
};

export function createStalls(signs = {}, carts = ['esputer', 'martabak']) {
  const rng = mulberry32(71);
  const m = mats();
  const out = { group: new THREE.Group(), colliders: [], interacts: [], tables: [] };
  const { podW, podE } = PIER;
  // carts fill the promenade bays in order; the rest wait as planters
  const built = [];
  let bell = null;
  CART_BAYS.forEach((bay, i) => {
    const kind = carts[i];
    if (kind && CART_BUILDERS[kind]) {
      const c = CART_BUILDERS[kind](m, rng, signs, out, bay);
      built.push(c);
      if (c.bell && !bell) bell = c.bell;
    } else emptyBay(m, rng, out, bay);
  });
  const nv = buildNhaViet(m, rng, signs.boutique || 'Reva Maia’s Nhà Việt', (podW.x0 + podW.x1) / 2, (podW.z0 + podW.z1) / 2, out);
  const jamu = buildJamuBar(m, rng, signs.jamu || 'Jamu', (podE.x0 + podE.x1) / 2, (podE.z0 + podE.z1) / 2, out);
  return {
    group: out.group, colliders: out.colliders, interacts: out.interacts, tables: out.tables,
    light: nv.light, lights: [...built.map((c) => c.light), nv.light, jamu.light],
    bell: bell || { center: V(0, -100, 0), radius: 0.01, reach: 0, label: '', ring() {} },
    update(t, dt) {
      for (const c of built) c.update(t, dt);
      nv.update(t, dt);
    },
  };
}
