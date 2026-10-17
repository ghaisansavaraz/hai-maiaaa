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

// The glass house: a cruciform Javanese-modern conservatory. A central square
// hall (local x, z within ±half) under a two-tier glass summit, with lower glass
// wings left and right. Grand entrance in the middle of the south face. At the
// back of the hall a raised dais (her desk) reached by twin flights that rise
// from the centre outward along its face; the powder room sits under the dais,
// its arched door between the feet of the two flights.
export const GREENHOUSE = {
  x: 40, z: 12, half: 6, hw: 6, hd: 6,
  wing: { w: 7, hd: 4.5 },          // each wing: x from half to half + w, z within ±hd
  wallH: 5.2, tier1: 8.2, summit: 10.8, wingWall: 3.6, wingRidge: 5.0, doorW: 2.6,
  dais: { y: 2.4, z0: -6, z1: -2.4, hw: 5.9 },
  flight: { x0: 1.3, x1: 5.0, z0: -2.4, z1: -1.0 }, // each flight spans |x| x0…x1 in front of the dais
  powder: { hw: 3.0, doorHW: 0.75 },
};
// The pier: a teak boardwalk along the south shore, an arrival gate on the
// pier's axis, a central spine out over the water with two symmetrical pods
// (Nhà Việt west, the jamu bar east), and the pendopo at the end.
export const PIER = {
  x: -24, deckY: 1.05,
  boardwalk: { ld: 1.04, hw: 2.0, th0: Math.PI / 2 - 0.78, th1: Math.PI / 2 + 0.78 },
  gate: { z: 22.3 },
  cart: { th: 1.13 }, // the es puter gelato cart, on the boardwalk east of the gate
  spine: { hw: 2.0, z0: -2.0, z1: 21.0 },
  podW: { x0: -37, x1: -26, z0: 4.5, z1: 14.5 },
  podE: { x0: -22, x1: -11, z0: 4.5, z1: 14.5 },
  pendopo: { z: -7.4, half: 5.4, roof: 4.2 }, // half = deck, roof = the pavilion itself
};
// summary box of the whole pier, for code that only needs rough bounds
export const DOCK = {
  x: PIER.x, zLand: PIER.gate.z, zEnd: PIER.pendopo.z - PIER.pendopo.half, hw: PIER.spine.hw, deckY: PIER.deckY,
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
export const DOCK_PATH = [[-8, 34], [-14, 30.4], [-20, 27.4], [-24, 25.6], [-24, 24.2]];
export const GREENHOUSE_PATH = [[20, 9], [25, 14.8], [32, 19.6], [40, 21.2]]; // to the grand south door

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

/** SDF of the greenhouse footprint: central hall + two wings (negative inside). */
export function greenhouseSdf(x, z, pad = 0) {
  const G = GREENHOUSE;
  const lx = x - G.x, lz = z - G.z;
  const hall = Math.max(Math.abs(lx) - G.half, Math.abs(lz) - G.half);
  const wings = Math.max(Math.abs(lx) - (G.half + G.wing.w), Math.abs(lz) - G.wing.hd);
  return Math.min(hall, wings) - pad;
}

const box = (x, z, x0, x1, z0, z1) => {
  const dx = Math.max(x0 - x, x - x1), dz = Math.max(z0 - z, z - z1);
  return dx > 0 && dz > 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
};
/** Point on the boardwalk's centre curve at angle th (around the lake centre). */
export function boardwalkAt(th, k = PIER.boardwalk.ld) {
  return { x: LAKE.cx + Math.cos(th) * LAKE.rx * k, z: LAKE.cz + Math.sin(th) * LAKE.rz * k };
}
function boardwalkDist(x, z) {
  const B = PIER.boardwalk;
  const ex = (x - LAKE.cx) / LAKE.rx, ez = (z - LAKE.cz) / LAKE.rz;
  const ld = Math.hypot(ex, ez);
  const th = Math.atan2(ez, ex);
  const radial = Math.abs(ld - B.ld) * LAKE.rz - B.hw;
  const ang = Math.max(B.th0 - th, th - B.th1) * LAKE.rx * B.ld;
  return Math.max(radial, ang);
}
/** Signed distance to the pier deck footprint (negative = on the deck). */
export function pierDist(x, z) {
  const { spine, podW, podE, pendopo } = PIER;
  return Math.min(
    box(x, z, PIER.x - spine.hw, PIER.x + spine.hw, spine.z0, spine.z1),
    box(x, z, podW.x0, podW.x1, podW.z0, podW.z1),
    box(x, z, podE.x0, podE.x1, podE.z0, podE.z1),
    box(x, z, PIER.x - pendopo.half, PIER.x + pendopo.half, pendopo.z - pendopo.half, pendopo.z + pendopo.half),
    boardwalkDist(x, z),
  );
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
  // the shore under the boardwalk sits just below its planks
  const bwd = boardwalkDist(x, z);
  if (bwd < 5) h = lerp(h, Math.min(h, PIER.deckY - 0.14), 1 - smoothstep(0.4, 5, bwd));
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
  if (Math.abs(lx) < G.half && Math.abs(lz) < G.half) {
    const y0 = GREENHOUSE_FLOOR_Y, D = G.dais, F = G.flight;
    const ax = Math.abs(lx);
    if (lz >= F.z0 && lz <= F.z1 && ax >= F.x0) {
      // the twin flights rise from the centre outward, then a small landing at the top
      if (ax <= F.x1) return y0 + D.y * (ax - F.x0) / (F.x1 - F.x0);
      if (ax <= D.hw) return y0 + D.y;
    }
    if (lz < D.z1 && ax <= D.hw) return feetY > y0 + 1.2 ? y0 + D.y : null;
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
