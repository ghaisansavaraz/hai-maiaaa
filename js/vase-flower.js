/* Vase Flower - a single flower that blooms petal-by-petal toward a private date.
   Purely decorative: no persistence, no interactivity, no text. Recomputed once
   per page load from wall-clock time against config.js's VASE_BLOOM_* constants. */

import {
  VASE_BLOOM_START_DATE,
  VASE_BLOOM_TARGET_DATE,
  VASE_BLOOM_PACE,
  debugLog
} from './config.js';

// 5 rings, outer to inner, 28 petals total - deliberately fuller than any
// garden flower (max ~18 across 3 rings) so it reads as its own, grander thing.
const RINGS = [
  { count: 10, radius: 42, rx: 14, ry: 26, angleOffset: 0,  gradId: 'vfRing0' },
  { count: 8,  radius: 33, rx: 11, ry: 21, angleOffset: 18, gradId: 'vfRing1' },
  { count: 6,  radius: 25, rx: 9,  ry: 16, angleOffset: 9,  gradId: 'vfRing2' },
  { count: 3,  radius: 15, rx: 6.5, ry: 12, angleOffset: 40, gradId: 'vfRing3' },
  { count: 1,  radius: 7,  rx: 5,  ry: 8,  angleOffset: 0,  gradId: 'vfRing4' },
];
const TOTAL_PETALS = RINGS.reduce((sum, r) => sum + r.count, 0); // 28
const BUD_SWELL_THRESHOLD = 0.08; // fraction of progress spent as a swelling bud before petals start

// Geometry (viewBox 0 0 200 300): the flower attaches to the top of the stem
// at ATTACH_Y; petals are drawn around a center lifted PETAL_LIFT above that,
// so the stem always visibly runs into the flower's base — no floating gap.
const ATTACH_Y = 108;   // stem top / bud base
const PETAL_LIFT = 23;  // petal cluster sits this far above the attach point
const VASE_MOUTH_Y = 176;

// White marble vase silhouette (baluster / meiping form), traced mouth-left →
// down the left → across the base → up the right → close across the mouth.
const VASE_BODY =
  'M86,176 C87,179 89,185 89,190 C57,197 57,209 57,215 ' +
  'C57,233 62,251 68,261 C72,269 76,273 80,279 C81,282 77,283 77,286 ' +
  'C77,289 88,290 100,290 C112,290 123,289 123,286 C123,283 119,282 120,279 ' +
  'C124,273 128,269 132,261 C138,251 143,233 143,215 ' +
  'C143,209 143,197 111,190 C111,185 113,179 114,176 Z';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getBloomProgress() {
  const start = new Date(VASE_BLOOM_START_DATE).getTime();
  const target = new Date(VASE_BLOOM_TARGET_DATE).getTime();
  if (!isFinite(start) || !isFinite(target) || target <= start) return 1;
  const raw = (Date.now() - start) / (target - start);
  return Math.min(Math.max(raw * VASE_BLOOM_PACE, 0), 1);
}

// Openness 0..1 = how far the flower has grown/opened. The whole flower is
// always present; openness continuously scales + unfurls it (no petals popping
// in). Linear with progress so the schedule maps cleanly to dates.
function getOpenness() {
  return getBloomProgress();
}

function easeOut(t) {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 2);
}

function buildDefs() {
  return `
    <defs>
      <linearGradient id="vfRing0" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#faf1ec"/><stop offset="100%" stop-color="#eccdbe"/>
      </linearGradient>
      <linearGradient id="vfRing1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f3ddd1"/><stop offset="100%" stop-color="#e2bda9"/>
      </linearGradient>
      <linearGradient id="vfRing2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ecccb9"/><stop offset="100%" stop-color="#d5a488"/>
      </linearGradient>
      <linearGradient id="vfRing3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e0b699"/><stop offset="100%" stop-color="#c68f6c"/>
      </linearGradient>
      <linearGradient id="vfRing4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4a37e"/><stop offset="100%" stop-color="#b47f5a"/>
      </linearGradient>
      <radialGradient id="vfCenter" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#e8c98a"/><stop offset="100%" stop-color="#b78d4d"/>
      </radialGradient>
      <linearGradient id="vfBud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8b79a"/><stop offset="100%" stop-color="#b98f68"/>
      </linearGradient>
      <!-- White marble: cool off-white with soft top-to-bottom shading -->
      <linearGradient id="vfMarble" x1="0.15" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stop-color="#fdfdfb"/>
        <stop offset="45%" stop-color="#f3f2ee"/>
        <stop offset="100%" stop-color="#e4e1d9"/>
      </linearGradient>
      <!-- Left highlight → right form-shadow, giving the marble volume -->
      <linearGradient id="vfMarbleShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
        <stop offset="30%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="72%" stop-color="rgba(90,84,74,0)"/>
        <stop offset="100%" stop-color="rgba(84,78,68,0.2)"/>
      </linearGradient>
      <clipPath id="vfVaseClip"><path d="${VASE_BODY}"/></clipPath>
    </defs>
  `;
}

function buildPetal(ring, ringIndex, petalIndex, isRuffled, radialFactor, petalScale) {
  const angle = (360 / ring.count) * petalIndex + ring.angleOffset
    + (seededRandom(ringIndex * 97 + petalIndex) - 0.5) * 8; // small deterministic jitter
  const rad = (angle * Math.PI) / 180;
  const rr = ring.radius * radialFactor;           // petals sit closer to center when closed
  const cx = rr * Math.cos(rad);
  const cy = rr * Math.sin(rad);
  const rot = angle + 90;
  const delay = (ringIndex * 6 + petalIndex) * 0.03;

  const shape = isRuffled
    ? `<path d="M0,-2 C-5,-9 -8,-19 -5,-27 C-2,-32 2,-32 5,-27 C8,-19 5,-9 0,-2 Z"
         transform="scale(${ring.rx / 8}, ${ring.ry / 30})" fill="url(#${ring.gradId})" opacity="0.9"/>`
    : `<ellipse rx="${ring.rx}" ry="${ring.ry}" fill="url(#${ring.gradId})" opacity="0.9"/>`;

  // Outer group: position + rotation + the growth scale (petals are smaller when
  // the flower is closed). Inner group keeps the CSS load-in fade only.
  return `
    <g transform="translate(${cx.toFixed(2)},${cy.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${petalScale.toFixed(3)})">
      <g class="vf-petal" style="animation-delay:${delay}s">
        ${shape}
        <ellipse rx="${ring.rx * 0.35}" ry="${ring.ry * 0.4}" fill="rgba(255,255,255,0.3)" transform="translate(0,${(-ring.ry * 0.28).toFixed(1)})"/>
      </g>
    </g>
  `;
}

function buildCenter() {
  let stamens = '';
  for (let i = 0; i < 10; i++) {
    const a = (360 / 10) * i + 4;
    const rad = (a * Math.PI) / 180;
    const x1 = Math.cos(rad) * 2, y1 = Math.sin(rad) * 2;
    const x2 = Math.cos(rad) * 7, y2 = Math.sin(rad) * 7;
    stamens += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#a8814a" stroke-width="0.6" stroke-linecap="round"/>`;
  }
  let pollen = '';
  for (let i = 0; i < 5; i++) {
    const a = (360 / 5) * i + 20;
    const rad = (a * Math.PI) / 180;
    const x = Math.cos(rad) * 4.5, y = Math.sin(rad) * 4.5;
    pollen += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.8" fill="#8a6a3a"/>`;
  }
  return `
    <g class="vf-center">
      ${stamens}
      ${pollen}
      <circle r="5.5" fill="url(#vfCenter)"/>
    </g>
  `;
}

function buildFlowerHead(openness) {
  const o = Math.min(1, Math.max(0, openness));
  const eo = easeOut(o);

  // The whole flower is always drawn; openness scales it up and unfurls the
  // petals outward, so it grows organically instead of gaining petals.
  const groupScale = 0.30 + 0.70 * eo;                 // small closed bud -> full size
  const liftNow = 5 + (PETAL_LIFT - 5) * eo;           // rises off the stem as it grows

  // A short green sheath at the base, tallest when closed (wrapping the bud),
  // shrinking as the flower opens — reads as a bud cracking open.
  const sheath = Math.max(0, 1 - o * 1.6);
  const sheathMarkup = sheath > 0.02
    ? `<g transform="translate(0,${(-liftNow * 0.5).toFixed(1)}) scale(${(0.7 + 0.6 * sheath).toFixed(2)})" style="opacity:${sheath.toFixed(2)}">
         <path d="M-3,2 Q-9,-8 -4,-20 Q-1,-8 -3,2 Z" fill="#7d9a68"/>
         <path d="M3,2 Q9,-8 4,-20 Q1,-8 3,2 Z" fill="#7d9a68"/>
         <path d="M0,4 Q-5,-10 0,-24 Q5,-10 0,4 Z" fill="#8aa876"/>
       </g>`
    : '';

  let petalsMarkup = '';
  let ruffledUsed = 0;
  RINGS.forEach((ring, ringIndex) => {
    // Outer rings (low index) open first; inner rings follow — a real bloom.
    const ringOpen = easeOut(o * 1.55 - ringIndex * 0.11);
    const radialFactor = 0.16 + 0.84 * ringOpen;   // petals travel out from center
    const petalScale = 0.5 + 0.5 * ringOpen;        // and grow to full size
    for (let p = 0; p < ring.count; p++) {
      const isRuffled = ringIndex === 0 && ruffledUsed < 2 && (p === 0 || p === 5);
      if (isRuffled) ruffledUsed++;
      petalsMarkup += buildPetal(ring, ringIndex, p, isRuffled, radialFactor, petalScale);
    }
  });

  // The golden center is hidden inside the closed bud, fading in as it opens.
  const centerOpacity = easeOut((o - 0.5) / 0.4);
  const centerMarkup = centerOpacity > 0.02
    ? `<g style="opacity:${centerOpacity.toFixed(2)}">${buildCenter()}</g>`
    : '';

  // Green calyx at the base (origin) roots the flower onto the stem; the petal
  // cluster is lifted above it and scaled, so the stem always runs into the base.
  return `
    <path class="vf-calyx" d="M-4,-2 Q-9,6 -4,12 Q-2,4 0,0 Q2,4 4,12 Q9,6 4,-2 Z" fill="#6d8c5a"/>
    ${sheathMarkup}
    <g transform="translate(0,${(-liftNow).toFixed(1)}) scale(${groupScale.toFixed(3)})">
      ${petalsMarkup}${centerMarkup}
    </g>
  `;
}

function buildStemAndLeaf() {
  // Stem rises from the vase mouth up to the flower attach point; single leaf.
  return `
    <path class="vf-stem" d="M100,${VASE_MOUTH_Y} C99,158 101,130 100,${ATTACH_Y}" fill="none" stroke="#5a7a4a" stroke-width="2.4" stroke-linecap="round"/>
    <path class="vf-leaf" d="M100,146 Q118,140 126,151 Q113,157 100,150 Z" fill="#6a8a5a"/>
    <path class="vf-leaf-vein" d="M101,149 Q112,148 123,151" fill="none" stroke="rgba(40,60,35,0.28)" stroke-width="0.8"/>
  `;
}

function buildVase() {
  return `
    <!-- Chinese white marble vase: opaque body, soft veining, rim & foot detail -->
    <path class="vf-vase" d="${VASE_BODY}" fill="url(#vfMarble)" stroke="rgba(150,144,134,0.5)" stroke-width="1"/>
    <g clip-path="url(#vfVaseClip)">
      <path d="M78,196 C86,214 74,236 88,262" stroke="rgba(148,150,158,0.16)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M83,214 C88,222 82,230 90,240" stroke="rgba(148,150,158,0.11)" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M121,190 C112,212 129,232 116,266" stroke="rgba(148,150,158,0.12)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M118,228 C123,236 116,244 122,254" stroke="rgba(148,150,158,0.09)" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M100,202 C96,224 104,246 99,272" stroke="rgba(148,150,158,0.08)" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="${VASE_BODY}" fill="url(#vfMarbleShade)"/>
    </g>
    <!-- Rolled lip + hollow mouth -->
    <ellipse cx="100" cy="176" rx="14" ry="3.4" fill="#eeece5"/>
    <ellipse cx="100" cy="176.4" rx="10.6" ry="2.3" fill="rgba(66,62,56,0.32)"/>
    <path d="M89,177 Q100,181 111,177" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
    <!-- Foot ring -->
    <path class="vf-foot" d="M80,282 Q100,287 120,282" fill="none" stroke="rgba(122,116,106,0.3)" stroke-width="1"/>
  `;
}

function buildVaseFlowerSVGCore(openness) {
  return `
    <svg class="vf-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${buildDefs()}
      ${buildVase()}
      ${buildStemAndLeaf()}
      <g transform="translate(100,${ATTACH_Y})">
        ${buildFlowerHead(openness)}
      </g>
    </svg>
  `;
}

function buildVaseFlowerSVG() {
  const openness = getOpenness();
  debugLog(`Vase flower: openness=${(openness * 100).toFixed(1)}%`);
  return buildVaseFlowerSVGCore(openness);
}

export function initVaseFlower() {
  const section = document.getElementById('vaseFlowerSection');
  if (!section) {
    debugLog('Vase flower section not found, skipping');
    return;
  }
  section.innerHTML = buildVaseFlowerSVG();
  debugLog('Vase flower initialized');
}

// ===== Dev / test helpers (used by js/dev-flower.js) =====

// Re-render the flower to today's real state.
export function renderVaseFlowerNow() {
  initVaseFlower();
}

// Force-render the flower at a specific openness (0..1), ignoring the date.
export function renderVaseFlowerAt(openness) {
  const section = document.getElementById('vaseFlowerSection');
  if (!section) return;
  const o = Math.max(0, Math.min(1, openness));
  section.innerHTML = buildVaseFlowerSVGCore(o);
}

// Current live state of the bloom.
export function getBloomStatus() {
  const openness = getOpenness();
  return {
    now: new Date(),
    openness,
    opennessPct: Math.round(openness * 100),
    isBud: openness < 0.06,
    isFull: openness >= 0.999,
    startDate: VASE_BLOOM_START_DATE,
    targetDate: VASE_BLOOM_TARGET_DATE,
    pace: VASE_BLOOM_PACE,
  };
}

// Full schedule: the date the flower reaches each openness milestone, from the
// SAME math the live flower uses (so the panel and the flower can't disagree).
export function getBloomSchedule() {
  const start = new Date(VASE_BLOOM_START_DATE).getTime();
  const target = new Date(VASE_BLOOM_TARGET_DATE).getTime();
  const span = target - start;
  const dateFor = (openness) => new Date(start + (openness / VASE_BLOOM_PACE) * span);

  const points = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  return points.map((op) => ({
    label: op === 0 ? 'Planted (tight bud)' : op === 1 ? 'Full bloom' : `${Math.round(op * 100)}% open`,
    openness: op,
    date: dateFor(op),
  }));
}
