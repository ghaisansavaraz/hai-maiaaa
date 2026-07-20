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

function getRevealedPetalCount(progress) {
  if (progress <= BUD_SWELL_THRESHOLD) return 0;
  const bloomProgress = (progress - BUD_SWELL_THRESHOLD) / (1 - BUD_SWELL_THRESHOLD);
  return Math.min(TOTAL_PETALS, Math.floor(bloomProgress * TOTAL_PETALS));
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

function buildPetal(ring, ringIndex, petalIndex, isRuffled) {
  const angle = (360 / ring.count) * petalIndex + ring.angleOffset
    + (seededRandom(ringIndex * 97 + petalIndex) - 0.5) * 8; // small deterministic jitter
  const rad = (angle * Math.PI) / 180;
  const cx = ring.radius * Math.cos(rad);
  const cy = ring.radius * Math.sin(rad);
  const rot = angle + 90;
  const delay = (ringIndex * 6 + petalIndex) * 0.03;

  const shape = isRuffled
    ? `<path d="M0,-2 C-5,-9 -8,-19 -5,-27 C-2,-32 2,-32 5,-27 C8,-19 5,-9 0,-2 Z"
         transform="scale(${ring.rx / 8}, ${ring.ry / 30})" fill="url(#${ring.gradId})" opacity="0.9"/>`
    : `<ellipse rx="${ring.rx}" ry="${ring.ry}" fill="url(#${ring.gradId})" opacity="0.9"/>`;

  // Position/rotation lives on the outer group via an SVG attribute; the fade-in
  // scale animation lives on the inner group via CSS. Mixing both on one element
  // would let the CSS `transform` clobber the positioning attribute entirely.
  return `
    <g transform="translate(${cx.toFixed(2)},${cy.toFixed(2)}) rotate(${rot.toFixed(1)})">
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

function buildFlowerHead(revealedCount, progress) {
  if (revealedCount === 0) {
    // Bud: base at the origin (= stem top), pointing up. Swells from the base
    // (scale pivots at 0,0), so it grows out of the stem with no floating gap.
    const swell = 0.55 + Math.min(progress / BUD_SWELL_THRESHOLD, 1) * 0.45;
    return `
      <g class="vf-bud" transform="scale(${swell.toFixed(2)})">
        <path d="M-2,-1 Q-11,4 -7,13 Q-3,5 -2,-1 Z" fill="#7d9a68"/>
        <path d="M2,-1 Q11,4 7,13 Q3,5 2,-1 Z" fill="#7d9a68"/>
        <ellipse cx="0" cy="-15" rx="8.5" ry="17" fill="url(#vfBud)"/>
        <path d="M0,-31 Q-6,-18 0,-2 Q6,-18 0,-31 Z" fill="rgba(255,255,255,0.14)"/>
        <ellipse cx="-2.5" cy="-19" rx="4" ry="10" fill="rgba(255,255,255,0.2)"/>
      </g>
    `;
  }

  let drawn = 0;
  let petalsMarkup = '';
  let ruffledUsed = 0;
  RINGS.forEach((ring, ringIndex) => {
    for (let p = 0; p < ring.count; p++) {
      if (drawn >= revealedCount) return;
      const isRuffled = ringIndex === 0 && ruffledUsed < 2 && (p === 0 || p === 5);
      if (isRuffled) ruffledUsed++;
      petalsMarkup += buildPetal(ring, ringIndex, p, isRuffled);
      drawn++;
    }
  });

  // Center only emerges near full bloom, once the two innermost rings are underway.
  const petalsBeforeCenter = TOTAL_PETALS - RINGS[3].count - RINGS[4].count; // 24
  const centerMarkup = revealedCount > petalsBeforeCenter ? buildCenter() : '';

  // Small green calyx at the base (origin) visually roots the bloom onto the stem,
  // and the petal cluster is lifted above it so the stem runs into the flower.
  return `
    <path class="vf-calyx" d="M-4,-2 Q-9,6 -4,12 Q-2,4 0,0 Q2,4 4,12 Q9,6 4,-2 Z" fill="#6d8c5a"/>
    <g transform="translate(0,${-PETAL_LIFT})">
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

function buildVaseFlowerSVG() {
  const progress = getBloomProgress();
  const revealedCount = getRevealedPetalCount(progress);
  debugLog(`Vase flower: progress=${progress.toFixed(3)}, petals=${revealedCount}/${TOTAL_PETALS}`);

  return `
    <svg class="vf-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${buildDefs()}
      ${buildVase()}
      ${buildStemAndLeaf()}
      <g transform="translate(100,${ATTACH_Y})">
        ${buildFlowerHead(revealedCount, progress)}
      </g>
    </svg>
  `;
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
