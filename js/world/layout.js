/* World layout: one source of truth for where everything is and how high the
   ground is. Every other module (terrain mesh, grass, trees, player collision)
   reads from here so they can never disagree.

   Coordinates are meters. +y is up. She spawns in the south (+z) and walks
   north (-z) toward the hill and the moon. */

import { fbm2, smoothstep, lerp } from './util.js';

export const WATER_Y = 0;
export const LAKE = { cx: -32, cz: -2, rx: 34, rz: 24 };
export const HILL = { x: 0, z: -92, top: 13, flat: 6.5, radius: 46 };
export const BOUNDS = { rx: 98, rz: 120 };
export const SPAWN = { x: 0, z: 101 };
export const EYE_HEIGHT = 1.62;

// The glass house: a Javanese-modern luxury conservatory. A long glass hall
// (local x ±hw, z ±hd), entrance in the middle of the south wall. At the far
// (north) end an elevated floor (mezzanine) where her desk is, reached by a
// central marble staircase straight ahead of the door; a powder room under it.
export const GREENHOUSE = {
  x: 33, z: 12, hw: 6, hd: 9, wallH: 4.6, roofH: 7.8, doorW: 2.2,
  mezzY: 2.5,        // height of the elevated floor
  mezzZ: -4,         // local z of its front edge (it spans -hd … mezzZ)
  stairHW: 1.35,     // half width of the staircase (centred on x = 0)
  stairZ: 0.4,       // local z where the stairs start at the bottom
  powder: { x0: 1.4, door0: 3.0, door1: 4.1 }, // powder room: x0 … hw under the mezzanine
};
// The pier on the south shore: a wide promenade (gelato, Nhà Việt, jamu bar),
// a walk out over the water and a modern pendopo at the end (bench + letter).
export const PIER = {
  x: -24, deckY: 1.1,
  prom: { x0: -33, x1: -15, z0: 10, z1: 23.5 },
  walk: { hw: 1.8, z0: -3.0, z1: 10 },
  pendopo: { z: -7.2, half: 4.2 },
};
// summary box of the whole pier, for code that only needs rough bounds
export const DOCK = {
  x: PIER.x, zLand: PIER.prom.z1, zEnd: PIER.pendopo.z - PIER.pendopo.half, hw: PIER.walk.hw, deckY: PIER.deckY,
};
export const BENCH = { x: -24, z: PIER.pendopo.z + 0.7 };
// beside the main path, shortly after the autumn grove, so she meets it early
export const BUNNY_HOME = { x: -2.2, z: 48, r: 5 };

// Moon direction (unit vector toward the moon): north, slightly west, ~15° up,
// low enough that its glitter path stretches across the lake from the dock.
export const MOON_DIR = (() => {
  const v = [-0.22, 0.26, -0.94];
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
})();

/* ---------------- paths ---------------- */

export const MAIN_PATH = [
  [0, 112], [0, 101], [1, 90], [3, 76], [0, 62], [-5, 48], [-8, 34], [-2, 24], [10, 16],
  [20, 9], [24, -4], [18, -20], [9, -34], [4, -48], [8, -60], [-3, -71], [2, -82], [0, -92],
];
export const DOCK_PATH = [[-8, 34], [-14, 30.6], [-20, 27.6], [-24, 25.8], [-24, 23.9]];
export const GREENHOUSE_PATH = [[20, 9], [23.4, 15.2], [28.2, 21.4], [33, 23.0]]; // to the south door

// The river: flows in from the western hills, through the lake, and out east,
// so the hill (north) can only be reached over the stone bridge.
export const RIVER_W = 3.4; // half width of the water
export const RIVER_IN = [[-108, -14], [-96, -8], [-84, -12], [-74, -7], [-64, -4]];
export const RIVER_OUT = [
  [-6, -14], [4, -20], [12, -23], [20, -26], [30, -24], [42, -31], [55, -27], [68, -35], [82, -30], [96, -37], [110, -34],
];

function catmullRom(points, step) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i];
    const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(segLen / step));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1].slice());
  return out;
}

const mainSamples = catmullRom(MAIN_PATH, 0.6);
const branchSamples = [...catmullRom(DOCK_PATH, 0.6), ...catmullRom(GREENHOUSE_PATH, 0.6)];

// cumulative arc length of the main path (for placing lanterns along it)
const mainLen = [0];
for (let i = 1; i < mainSamples.length; i++) {
  const a = mainSamples[i - 1], b = mainSamples[i];
  mainLen.push(mainLen[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
}
export const MAIN_PATH_LENGTH = mainLen[mainLen.length - 1];

/** Point + unit tangent at arc-length fraction f (0 = entrance, 1 = hilltop). */
export function mainPathAt(f) {
  const target = f * MAIN_PATH_LENGTH;
  let i = 1;
  while (i < mainLen.length - 1 && mainLen[i] < target) i++;
  const a = mainSamples[i - 1], b = mainSamples[i];
  const seg = mainLen[i] - mainLen[i - 1] || 1;
  const t = (target - mainLen[i - 1]) / seg;
  const tx = b[0] - a[0], tz = b[1] - a[1];
  const tl = Math.hypot(tx, tz) || 1;
  return { x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), tx: tx / tl, tz: tz / tl };
}

// Spatial grid of path samples -> fast distance queries.
const CELL = 6;
const grid = new Map();
function addSamples(samples, halfWidth) {
  for (const [x, z] of samples) {
    const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(x, z, halfWidth);
  }
}
addSamples(mainSamples, 1.25);
addSamples(branchSamples, 0.95);

/** Signed distance to the nearest path edge (negative = on the path). 99 if far away. */
export function pathEdgeDist(x, z) {
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  let best = 99;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const list = grid.get(`${cx + dx},${cz + dz}`);
      if (!list) continue;
      for (let i = 0; i < list.length; i += 3) {
        const d = Math.hypot(x - list[i], z - list[i + 1]) - list[i + 2];
        if (d < best) best = d;
      }
    }
  }
  return best;
}

export const riverSamples = [...catmullRom(RIVER_IN, 1.0), ...catmullRom(RIVER_OUT, 1.0)];
const RCELL = 8;
const rgrid = new Map();
for (const [x, z] of riverSamples) {
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const key = `${Math.floor(x / RCELL) + dx},${Math.floor(z / RCELL) + dz}`;
      if (!rgrid.has(key)) rgrid.set(key, []);
      rgrid.get(key).push(x, z);
    }
  }
}
/** Distance (m) to the river's centre line; 99 when far. */
export function riverDist(x, z) {
  const list = rgrid.get(`${Math.floor(x / RCELL)},${Math.floor(z / RCELL)}`);
  if (!list) return 99;
  let best = 99 * 99;
  for (let i = 0; i < list.length; i += 2) {
    const d = (x - list[i]) ** 2 + (z - list[i + 1]) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* ---------------- regions ---------------- */

/** Pure lake ellipse distance from the lake centre (≈0.93 = shoreline). */
export function lakeEllipse(x, z) {
  return Math.hypot((x - LAKE.cx) / LAKE.rx, (z - LAKE.cz) / LAKE.rz);
}

/** "How close to water", in lake-ellipse units, for the lake AND the river
    (≈0.93 at any shoreline, growing away from it). Used for exclusions. */
export function lakeDist(x, z) {
  const ld = lakeEllipse(x, z);
  const rd = riverDist(x, z);
  return rd > 40 ? ld : Math.min(ld, 0.93 + (rd - RIVER_W) / 12);
}

/** Normalized ellipse distance from the world center (1 = walkable edge). */
export function boundsDist(x, z) {
  return Math.hypot(x / BOUNDS.rx, z / BOUNDS.rz);
}

/** 1 inside the autumn grove at the entrance, fading to 0 in the meadow. */
export function autumnAt(x, z) {
  return smoothstep(50, 66, z) * (1 - smoothstep(58, 80, Math.abs(x)));
}

/** SDF of the greenhouse footprint (negative inside). */
export function greenhouseSdf(x, z, pad = 0) {
  const G = GREENHOUSE;
  return Math.max(Math.abs(x - G.x) - G.hw, Math.abs(z - G.z) - G.hd) - pad;
}

const box = (x, z, x0, x1, z0, z1) => {
  const dx = Math.max(x0 - x, x - x1), dz = Math.max(z0 - z, z - z1);
  return dx > 0 && dz > 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
};
/** Signed distance to the pier deck footprint (negative = on the deck). */
export function pierDist(x, z) {
  const { prom, walk, pendopo } = PIER;
  const p = box(x, z, prom.x0, prom.x1, prom.z0, prom.z1);
  const w = box(x, z, PIER.x - walk.hw, PIER.x + walk.hw, walk.z0 - 0.1, walk.z1 + 0.1);
  const g = box(x, z, PIER.x - pendopo.half, PIER.x + pendopo.half, pendopo.z - pendopo.half, pendopo.z + pendopo.half);
  return Math.min(p, w, g);
}

export function onDock(x, z) {
  return pierDist(x, z) <= 0;
}

export function hillDist(x, z) {
  return Math.hypot(x - HILL.x, z - HILL.z);
}

/* ---------------- height ---------------- */

function baseHeight(x, z) {
  let h = 1.45 + fbm2(x * 0.017, z * 0.017, 4) * 2.0 + fbm2(x * 0.07 + 40, z * 0.07 - 12, 2) * 0.28;
  h += HILL.top * (1 - smoothstep(HILL.flat, HILL.radius, hillDist(x, z)));
  // ridges past the walkable edge, hidden in fog + treeline
  const bd = boundsDist(x, z);
  h += smoothstep(0.98, 1.5, bd) * (16 + fbm2(x * 0.03, z * 0.03, 3) * 9);
  return h;
}

const GREENHOUSE_BASE = baseHeight(GREENHOUSE.x, GREENHOUSE.z) + 0.05;
export const GREENHOUSE_FLOOR_Y = GREENHOUSE_BASE;
export const HILLTOP_Y = baseHeight(HILL.x, HILL.z);

/** Analytic terrain height (used to build the heightfield). */
export function terrainHeight(x, z) {
  let h = baseHeight(x, z);
  const ld = lakeEllipse(x, z);
  const basin = 1 - smoothstep(0.62, 1.12, ld);
  h = lerp(h, -2.6 + ld * 0.7, basin);
  // the river channel: a rounded bed with soft banks
  const rd = riverDist(x, z);
  if (rd < RIVER_W * 2.6) {
    const k = 1 - smoothstep(RIVER_W * 0.9, RIVER_W * 2.4, rd);
    h = lerp(h, Math.min(h, -1.5 + (rd / RIVER_W) ** 2 * 1.35), k);
  }
  const pe = pathEdgeDist(x, z);
  h -= 0.1 * (1 - smoothstep(-0.3, 1.2, pe));
  const gd = greenhouseSdf(x, z);
  h = lerp(h, GREENHOUSE_BASE, 1 - smoothstep(0.6, 4.5, gd));
  // flatten the hilltop plaza
  const hd = hillDist(x, z);
  h = lerp(h, HILLTOP_Y, 1 - smoothstep(5.5, 8, hd));
  return h;
}

/** Precomputed height grid with bilinear sampling. The terrain mesh uses the
    same grid, so the player, grass and props sit exactly on the visible ground. */
export class Heightfield {
  constructor(size = 440, segments = 330) {
    this.size = size;
    this.seg = segments;
    this.step = size / segments;
    this.half = size / 2;
    const n = segments + 1;
    this.data = new Float32Array(n * n);
    for (let j = 0; j < n; j++) {
      const z = -this.half + j * this.step;
      for (let i = 0; i < n; i++) {
        const x = -this.half + i * this.step;
        this.data[j * n + i] = terrainHeight(x, z);
      }
    }
  }

  sample(x, z) {
    const n = this.seg + 1;
    const fx = Math.min(Math.max((x + this.half) / this.step, 0), this.seg - 0.0001);
    const fz = Math.min(Math.max((z + this.half) / this.step, 0), this.seg - 0.0001);
    const i = Math.floor(fx), j = Math.floor(fz);
    const tx = fx - i, tz = fz - j;
    const d = this.data;
    const a = d[j * n + i], b = d[j * n + i + 1];
    const c = d[(j + 1) * n + i], e = d[(j + 1) * n + i + 1];
    // match the plane's triangulation for exactness
    if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
    return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
  }

  /** Where feet stand: terrain, or a deck/bridge/floor above it. feetY (her
      current feet height) picks the level where floors overlap. */
  walkHeight(x, z, feetY = Infinity) {
    const h = this.sample(x, z);
    const d = deckHeight(x, z, feetY);
    return d === null ? h : Math.max(h, d);
  }
}

/* ---------------- the stone bridge ---------------- */

// where the main path crosses the river
export const BRIDGE = (() => {
  let best = null, bd = 1e9;
  for (let i = 1; i < mainSamples.length; i++) {
    const [x, z] = mainSamples[i];
    const d = riverDist(x, z);
    if (d < bd) { bd = d; best = i; }
  }
  const a = mainSamples[Math.max(best - 4, 0)], b = mainSamples[Math.min(best + 4, mainSamples.length - 1)];
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  const [x, z] = mainSamples[best];
  const len = 17, hw = 1.75, rise = 1.25;
  const ux = dx / l, uz = dz / l;
  const yA = terrainHeight(x - ux * len / 2, z - uz * len / 2);
  const yB = terrainHeight(x + ux * len / 2, z + uz * len / 2);
  return { x, z, ux, uz, len, hw, rise, yA, yB };
})();

/** Bridge-local coordinates: s along the span (-len/2…len/2), l across. */
export function bridgeLocal(x, z) {
  const B = BRIDGE;
  const rx = x - B.x, rz = z - B.z;
  return { s: rx * B.ux + rz * B.uz, l: -rx * B.uz + rz * B.ux };
}
export function bridgeDeckY(s) {
  const B = BRIDGE;
  const t = (s + B.len / 2) / B.len;
  return lerp(B.yA, B.yB, t) + B.rise * (1 - (2 * s / B.len) ** 2);
}

/** Height of anything built to walk on at (x, z), or null for bare ground.
    Pier deck, the arched bridge, and the greenhouse stairs / upper floor. */
export function deckHeight(x, z, feetY = Infinity) {
  if (pierDist(x, z) <= 0) return PIER.deckY;
  const { s, l } = bridgeLocal(x, z);
  if (Math.abs(s) <= BRIDGE.len / 2 && Math.abs(l) <= BRIDGE.hw) return bridgeDeckY(s);
  const G = GREENHOUSE;
  const lx = x - G.x, lz = z - G.z;
  if (Math.abs(lx) < G.hw && Math.abs(lz) < G.hd) {
    const y0 = GREENHOUSE_FLOOR_Y;
    if (Math.abs(lx) <= G.stairHW + 0.05 && lz >= G.mezzZ && lz <= G.stairZ) {
      return y0 + G.mezzY * (G.stairZ - lz) / (G.stairZ - G.mezzZ);
    }
    if (lz < G.mezzZ) return feetY > y0 + 1.2 ? y0 + G.mezzY : null;
  }
  return null;
}

/** What she's walking on, for footstep sounds. */
export function surfaceAt(x, z) {
  if (pierDist(x, z) <= 0) return 'wood';
  const { s, l } = bridgeLocal(x, z);
  if (Math.abs(s) <= BRIDGE.len / 2 && Math.abs(l) <= BRIDGE.hw) return 'path';
  if (greenhouseSdf(x, z) < 0) return 'path';
  return null;
}
