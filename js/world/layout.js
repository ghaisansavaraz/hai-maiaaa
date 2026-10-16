/* World layout: one source of truth for where everything is and how high the
   ground is. Every other module (terrain mesh, grass, trees, player collision)
   reads from here so they can never disagree.

   Coordinates are meters. +y is up. She spawns in the south (+z) and walks
   north (-z) toward the hill and the moon. */

import { fbm2, smoothstep, lerp } from './util.js';

export const WATER_Y = 0;
export const LAKE = { cx: -26, cz: 0, rx: 22, rz: 16 };
export const HILL = { x: 0, z: -92, top: 13, flat: 6.5, radius: 46 };
export const BOUNDS = { rx: 98, rz: 120 };
export const SPAWN = { x: 0, z: 101 };
export const EYE_HEIGHT = 1.62;

// Victorian glass greenhouse (door on the west wall, facing the path).
export const GREENHOUSE = { x: 31, z: 12, hw: 2.4, hd: 3.4, wallH: 2.5, roofH: 3.7, doorW: 1.25 };
// Little wooden dock reaching into the lake from the south shore, bench at its end.
export const DOCK = { x: -24, zLand: 22, zEnd: 6.5, hw: 1.15, deckY: 0.44 };
export const BENCH = { x: -24, z: 8.2 };
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

const MAIN_PATH = [
  [0, 112], [0, 101], [1, 90], [3, 76], [0, 62], [-5, 48], [-8, 34], [-2, 24], [10, 16],
  [20, 9], [24, -4], [18, -20], [9, -34], [4, -48], [8, -60], [-3, -71], [2, -82], [0, -92],
];
const DOCK_PATH = [[-8, 34], [-15, 28], [-21, 23.5], [-24, 21.5], [-24, 20]];
const GREENHOUSE_PATH = [[20, 9], [24, 11.2], [28.4, 12]];

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

/* ---------------- regions ---------------- */

/** Normalized ellipse distance from the lake center (1 = rough shoreline). */
export function lakeDist(x, z) {
  return Math.hypot((x - LAKE.cx) / LAKE.rx, (z - LAKE.cz) / LAKE.rz);
}

/** Normalized ellipse distance from the world center (1 = walkable edge). */
export function boundsDist(x, z) {
  return Math.hypot(x / BOUNDS.rx, z / BOUNDS.rz);
}

/** 1 inside the autumn grove at the entrance, fading to 0 in the meadow. */
export function autumnAt(x, z) {
  return smoothstep(50, 66, z) * (1 - smoothstep(58, 80, Math.abs(x)));
}

/** Box SDF of the greenhouse footprint (negative inside). */
export function greenhouseSdf(x, z, pad = 0) {
  return Math.max(Math.abs(x - GREENHOUSE.x) - GREENHOUSE.hw - pad, Math.abs(z - GREENHOUSE.z) - GREENHOUSE.hd - pad);
}

export function onDock(x, z) {
  return Math.abs(x - DOCK.x) <= DOCK.hw && z <= DOCK.zLand && z >= DOCK.zEnd - 0.2;
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
  const ld = lakeDist(x, z);
  const basin = 1 - smoothstep(0.62, 1.12, ld);
  h = lerp(h, -2.6 + ld * 0.7, basin);
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

  /** Where feet stand: terrain, or the dock deck when on the dock. */
  walkHeight(x, z) {
    const h = this.sample(x, z);
    return onDock(x, z) ? Math.max(h, DOCK.deckY) : h;
  }
}
