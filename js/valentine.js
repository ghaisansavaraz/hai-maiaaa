/* Valentine Bloom Garden and Pressed Flower Album */

import { VALENTINE_STORAGE_KEY, debugLog, debugError } from './config.js';

// ===== FLOWER SPECIES =====

const FLOWER_TYPES = ['rose', 'tulip', 'daisy', 'peony', 'ranunculus'];

const FLOWER_COLORS = {
  rose: { primary: '#d4849b', secondary: '#b76e79', accent: '#8b4557', center: '#c9a84c' },
  tulip: { primary: '#e8a68c', secondary: '#d4846a', accent: '#b06a52', center: '#c9a84c' },
  daisy: { primary: '#f0e0e6', secondary: '#e8d0d8', accent: '#d4b8c2', center: '#d4b870' },
  peony: { primary: '#e8b8c8', secondary: '#d4a0b0', accent: '#c088a0', center: '#c9a84c' },
  ranunculus: { primary: '#e8c8d8', secondary: '#d8b0c0', accent: '#c898a8', center: '#b8a060' },
  orchid: { primary: '#d8b0e8', secondary: '#c090d8', accent: '#a870c0', center: '#e8d870' },
  simple_a: { primary: '#b8d8e8', secondary: '#a0c0d4', accent: '#88a8c0', center: '#c9c84c' },
  simple_b: { primary: '#e8d8b8', secondary: '#d4c0a0', accent: '#c0a888', center: '#c9b84c' }
};

const FLOWER_LABELS = {
  rose: 'Rosa',
  tulip: 'Tulipa',
  daisy: 'Bellis perennis',
  peony: 'Paeonia',
  ranunculus: 'Ranunculus',
  orchid: 'Orchidaceae',
  simple_a: 'Campanula',
  simple_b: 'Primula'
};

const FLOWER_NAMES = {
  rose: 'Rose',
  tulip: 'Tulip',
  daisy: 'Daisy',
  peony: 'Peony',
  ranunculus: 'Ranunculus',
  orchid: 'Orchid',
  simple_a: 'Bellflower',
  simple_b: 'Primrose'
};

const MAX_IMAGES_PER_NOTE = 2;

// Exclusive flowers from Gesan (pre-planted, always bloomed)
const EXCLUSIVE_FLOWERS = [
  {
    id: 'exclusive_orchid',
    text: 'Lovely love day beautiful Orchids to my lovely beautiful Maia',
    flowerType: 'orchid',
    bloomed: true,
    exclusive: true,
    images: [],
    createdAt: new Date(2026, 1, 14).getTime()
  },
  {
    id: 'exclusive_simple_a',
    text: 'To my good girl who takes her vitamins as she should',
    flowerType: 'simple_a',
    bloomed: true,
    exclusive: true,
    images: [],
    createdAt: new Date(2026, 1, 15).getTime()
  },
  {
    id: 'exclusive_simple_b',
    text: "Maia, I'm sorry if my words felt harsh to you. That was never how I meant them, I wouldn't treat my kind pretty Maia without kindness.",
    flowerType: 'simple_b',
    bloomed: true,
    exclusive: true,
    images: [],
    createdAt: new Date(2026, 1, 17).getTime()
  }
];

// ===== SVG FLOWER DEFINITIONS =====

function getStemSVG(type, variation) {
  const angle = (variation % 5 - 2) * 3;
  const height = 60 + (variation % 3) * 8;
  const leafSide = variation % 2 === 0 ? 1 : -1;
  const leafY = 30 + (variation % 4) * 5;

  let leaves = '';
  if (type === 'rose') {
    leaves = `<path d="M0,${leafY} Q${leafSide * 18},${ leafY - 12} ${leafSide * 14},${leafY - 22}" fill="none" stroke="#5a7a4a" stroke-width="0.8"/>
      <ellipse cx="${leafSide * 12}" cy="${leafY - 14}" rx="8" ry="4" transform="rotate(${leafSide * -30} ${leafSide * 12} ${leafY - 14})" fill="#6a8a5a" opacity="0.7"/>`;
  } else if (type === 'tulip') {
    leaves = `<path d="M-2,${leafY} Q${leafSide * 8},${leafY - 20} ${leafSide * 4},${leafY - 35}" fill="none" stroke="#5a7a4a" stroke-width="1"/>
      <path d="M${leafSide * 3},${leafY + 8} Q${-leafSide * 8},${leafY - 12} ${-leafSide * 4},${leafY - 28}" fill="none" stroke="#5a7a4a" stroke-width="0.8"/>`;
  } else if (type === 'daisy') {
    leaves = `<ellipse cx="${leafSide * 8}" cy="${leafY}" rx="6" ry="3" transform="rotate(${leafSide * -20} ${leafSide * 8} ${leafY})" fill="#6a8a5a" opacity="0.6"/>`;
  } else if (type === 'peony') {
    leaves = `<path d="M0,${leafY} Q${leafSide * 15},${leafY - 10} ${leafSide * 20},${leafY - 18}" fill="none" stroke="#5a7a4a" stroke-width="0.8"/>
      <path d="M${leafSide * 14},${leafY - 12} Q${leafSide * 22},${leafY - 20} ${leafSide * 18},${leafY - 26} Q${leafSide * 10},${leafY - 22} ${leafSide * 14},${leafY - 12}" fill="#5a7a4a" opacity="0.5"/>`;
  } else {
    leaves = `<path d="M0,${leafY} Q${leafSide * 12},${leafY - 8} ${leafSide * 16},${leafY - 16}" fill="none" stroke="#5a7a4a" stroke-width="0.7"/>
      <path d="M${leafSide * 10},${leafY - 8} L${leafSide * 16},${leafY - 16} L${leafSide * 14},${leafY - 10} L${leafSide * 18},${leafY - 20}" fill="none" stroke="#5a7a4a" stroke-width="0.5"/>`;
  }

  return `<g class="flower-stem" transform="rotate(${angle})">
    <line x1="0" y1="0" x2="0" y2="${height}" stroke="#5a7a4a" stroke-width="1.5" stroke-linecap="round"/>
    ${leaves}
  </g>`;
}

function getRoseFlowerSVG(colors, uniqueId = '') {
  return `<g class="flower-head">
    <defs>
      <radialGradient id="roseGrad${uniqueId}" cx="50%" cy="40%">
        <stop offset="0%" stop-color="${colors.secondary}"/>
        <stop offset="60%" stop-color="${colors.primary}"/>
        <stop offset="100%" stop-color="${colors.accent}"/>
      </radialGradient>
    </defs>
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-4" rx="18" ry="16" fill="url(#roseGrad${uniqueId})" opacity="0.5"/></g>
    <g transform="rotate(-25)"><g class="petal" style="--petal-delay:1"><ellipse cx="-8" cy="-2" rx="14" ry="12" fill="${colors.primary}" opacity="0.6"/></g></g>
    <g transform="rotate(25)"><g class="petal" style="--petal-delay:2"><ellipse cx="8" cy="-2" rx="14" ry="12" fill="${colors.primary}" opacity="0.6"/></g></g>
    <g transform="rotate(-15)"><g class="petal" style="--petal-delay:3"><ellipse cx="-4" cy="-6" rx="11" ry="10" fill="${colors.secondary}" opacity="0.7"/></g></g>
    <g transform="rotate(15)"><g class="petal" style="--petal-delay:4"><ellipse cx="4" cy="-6" rx="11" ry="10" fill="${colors.secondary}" opacity="0.7"/></g></g>
    <g class="petal" style="--petal-delay:5"><ellipse cx="0" cy="-5" rx="7" ry="7" fill="${colors.secondary}" opacity="0.8"/></g>
    <circle cx="0" cy="-4" r="4" fill="${colors.center}" opacity="0.6"/>
    <path d="M-6,-4 Q-4,-8 0,-6 Q4,-8 6,-4" fill="none" stroke="${colors.accent}" stroke-width="0.4" opacity="0.3"/>
  </g>`;
}

function getTulipFlowerSVG(colors) {
  return `<g class="flower-head">
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-10" rx="10" ry="18" fill="${colors.primary}" opacity="0.5"/></g>
    <g transform="rotate(-12)"><g class="petal" style="--petal-delay:1"><ellipse cx="-6" cy="-8" rx="8" ry="16" fill="${colors.primary}" opacity="0.6"/></g></g>
    <g transform="rotate(12)"><g class="petal" style="--petal-delay:2"><ellipse cx="6" cy="-8" rx="8" ry="16" fill="${colors.primary}" opacity="0.6"/></g></g>
    <g transform="rotate(-6)"><g class="petal" style="--petal-delay:3"><ellipse cx="-3" cy="-10" rx="6" ry="14" fill="${colors.secondary}" opacity="0.7"/></g></g>
    <g transform="rotate(6)"><g class="petal" style="--petal-delay:4"><ellipse cx="3" cy="-10" rx="6" ry="14" fill="${colors.secondary}" opacity="0.7"/></g></g>
    <g class="petal" style="--petal-delay:5"><ellipse cx="0" cy="-10" rx="4" ry="12" fill="${colors.secondary}" opacity="0.8"/></g>
    <circle cx="0" cy="-6" r="3" fill="${colors.center}" opacity="0.5"/>
  </g>`;
}

function getDaisyFlowerSVG(colors) {
  const petals = [];
  const r = 14;
  for (let i = 0; i < 14; i++) {
    const angleDeg = (i * 360) / 14;
    const angleRad = (angleDeg * Math.PI) / 180;
    const tx = Math.sin(angleRad) * r;
    const ty = -Math.cos(angleRad) * r;
    petals.push(`<g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) rotate(${angleDeg})"><g class="petal" style="--petal-delay:${i}"><ellipse cx="0" cy="0" rx="3.5" ry="10" fill="${colors.primary}" opacity="0.7"/></g></g>`);
  }
  return `<g class="flower-head">
    ${petals.join('\n    ')}
    <circle cx="0" cy="0" r="7" fill="${colors.center}"/>
    <circle cx="0" cy="0" r="5.5" fill="#c4a84c" opacity="0.8"/>
    <circle cx="-1.5" cy="-1" r="1" fill="#b89840" opacity="0.5"/>
    <circle cx="2" cy="1" r="0.8" fill="#b89840" opacity="0.4"/>
  </g>`;
}

function getPeonyFlowerSVG(colors) {
  return `<g class="flower-head">
    <g transform="rotate(-20)"><g class="petal" style="--petal-delay:0"><ellipse cx="-10" cy="-2" rx="14" ry="12" fill="${colors.primary}" opacity="0.4"/></g></g>
    <g transform="rotate(20)"><g class="petal" style="--petal-delay:1"><ellipse cx="10" cy="-2" rx="14" ry="12" fill="${colors.primary}" opacity="0.4"/></g></g>
    <g class="petal" style="--petal-delay:2"><ellipse cx="0" cy="-8" rx="15" ry="11" fill="${colors.primary}" opacity="0.45"/></g>
    <g transform="rotate(-10)"><g class="petal" style="--petal-delay:3"><ellipse cx="-6" cy="-4" rx="11" ry="10" fill="${colors.secondary}" opacity="0.55"/></g></g>
    <g transform="rotate(10)"><g class="petal" style="--petal-delay:4"><ellipse cx="6" cy="-4" rx="11" ry="10" fill="${colors.secondary}" opacity="0.55"/></g></g>
    <g transform="rotate(-5)"><g class="petal" style="--petal-delay:5"><ellipse cx="-3" cy="-6" rx="9" ry="8" fill="${colors.secondary}" opacity="0.65"/></g></g>
    <g transform="rotate(5)"><g class="petal" style="--petal-delay:6"><ellipse cx="3" cy="-6" rx="9" ry="8" fill="${colors.secondary}" opacity="0.65"/></g></g>
    <g class="petal" style="--petal-delay:7"><ellipse cx="0" cy="-5" rx="6" ry="6" fill="${colors.accent}" opacity="0.5"/></g>
    <circle cx="0" cy="-4" r="4" fill="${colors.center}" opacity="0.5"/>
  </g>`;
}

function getRanunculusFlowerSVG(colors) {
  const layers = [];
  let delayIdx = 0;
  for (let ring = 0; ring < 3; ring++) {
    const count = 8 - ring * 2;
    const r = 16 - ring * 4;
    const ry = r * 0.6;
    const opacity = 0.4 + ring * 0.15;
    for (let i = 0; i < count; i++) {
      const angleDeg = (i * 360) / count + ring * 15;
      const angleRad = (angleDeg * Math.PI) / 180;
      const tx = Math.sin(angleRad) * r;
      const ty = -Math.cos(angleRad) * r;
      const color = ring === 0 ? colors.primary : ring === 1 ? colors.secondary : colors.accent;
      layers.push(`<g transform="translate(${tx}, ${ty}) rotate(${angleDeg})"><g class="petal" style="--petal-delay:${delayIdx++}"><ellipse cx="0" cy="0" rx="4" ry="${ry}" fill="${color}" opacity="${opacity}"/></g></g>`);
    }
  }
  return `<g class="flower-head">
    ${layers.join('\n    ')}
    <circle cx="0" cy="0" r="4" fill="${colors.center}" opacity="0.6"/>
  </g>`;
}

function getOrchidFlowerSVG(colors) {
  return `<g class="flower-head">
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-8" rx="14" ry="18" fill="${colors.primary}" opacity="0.92"/></g>
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-9" rx="11" ry="15" fill="${colors.secondary}" opacity="0.5"/></g>
    <g class="petal" style="--petal-delay:1" transform="rotate(-35)"><ellipse cx="-6" cy="-6" rx="10" ry="14" fill="${colors.secondary}" opacity="0.9"/></g>
    <g class="petal" style="--petal-delay:1" transform="rotate(-35)"><ellipse cx="-6" cy="-7" rx="7" ry="11" fill="${colors.accent}" opacity="0.4"/></g>
    <g class="petal" style="--petal-delay:2" transform="rotate(35)"><ellipse cx="6" cy="-6" rx="10" ry="14" fill="${colors.secondary}" opacity="0.9"/></g>
    <g class="petal" style="--petal-delay:2" transform="rotate(35)"><ellipse cx="6" cy="-7" rx="7" ry="11" fill="${colors.accent}" opacity="0.4"/></g>
    <g class="petal" style="--petal-delay:3"><path d="M-8,-2 Q-10,-8 -6,-12 Q0,-10 6,-12 Q10,-8 8,-2 Q4,0 0,2 Q-4,0 -8,-2" fill="${colors.accent}" opacity="0.75"/></g>
    <g class="petal" style="--petal-delay:3"><path d="M-6,-3 Q-8,-7 -4,-10 Q0,-8 4,-10 Q8,-7 6,-3 Q3,-1 0,0 Q-3,-1 -6,-3" fill="${colors.primary}" opacity="0.5"/></g>
    <circle cx="0" cy="-4" r="3" fill="${colors.center}" opacity="0.95"/>
    <ellipse cx="0" cy="-3" rx="2" ry="4" fill="${colors.primary}" opacity="0.7"/>
    <ellipse cx="-1" cy="-4" rx="1" ry="2" fill="${colors.secondary}" opacity="0.6"/>
    <ellipse cx="1" cy="-4" rx="1" ry="2" fill="${colors.secondary}" opacity="0.6"/>
  </g>`;
}

function getSimpleAFlowerSVG(colors) {
  return `<g class="flower-head">
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-6" rx="8" ry="10" fill="${colors.primary}" opacity="0.7"/></g>
    <g class="petal" style="--petal-delay:0"><ellipse cx="0" cy="-7" rx="6" ry="8" fill="${colors.secondary}" opacity="0.4"/></g>
    <g class="petal" style="--petal-delay:1" transform="rotate(-25)"><ellipse cx="-4" cy="-5" rx="6" ry="8" fill="${colors.secondary}" opacity="0.75"/></g>
    <g class="petal" style="--petal-delay:1" transform="rotate(-25)"><ellipse cx="-4" cy="-6" rx="4" ry="6" fill="${colors.accent}" opacity="0.4"/></g>
    <g class="petal" style="--petal-delay:2" transform="rotate(25)"><ellipse cx="4" cy="-5" rx="6" ry="8" fill="${colors.secondary}" opacity="0.75"/></g>
    <g class="petal" style="--petal-delay:2" transform="rotate(25)"><ellipse cx="4" cy="-6" rx="4" ry="6" fill="${colors.accent}" opacity="0.4"/></g>
    <g class="petal" style="--petal-delay:3" transform="rotate(-50)"><ellipse cx="-2" cy="-4" rx="5" ry="7" fill="${colors.primary}" opacity="0.5"/></g>
    <g class="petal" style="--petal-delay:4" transform="rotate(50)"><ellipse cx="2" cy="-4" rx="5" ry="7" fill="${colors.primary}" opacity="0.5"/></g>
    <circle cx="0" cy="-4" r="3.5" fill="${colors.center}" opacity="0.7"/>
    <circle cx="0" cy="-4" r="2" fill="${colors.primary}" opacity="0.4"/>
  </g>`;
}

function getSimpleBFlowerSVG(colors) {
  const petals = [];
  const innerPetals = [];
  for (let i = 0; i < 5; i++) {
    const angleDeg = (i * 360) / 5;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r = 10;
    const tx = Math.sin(angleRad) * r;
    const ty = -Math.cos(angleRad) * r;
    petals.push(`<g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) rotate(${angleDeg})"><g class="petal" style="--petal-delay:${i}"><ellipse cx="0" cy="0" rx="4" ry="7" fill="${colors.primary}" opacity="0.75"/></g></g>`);
    petals.push(`<g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) rotate(${angleDeg})"><g class="petal" style="--petal-delay:${i}"><ellipse cx="0" cy="0" rx="3" ry="5" fill="${colors.secondary}" opacity="0.5"/></g></g>`);
    
    const innerAngleDeg = angleDeg + 36;
    const innerAngleRad = (innerAngleDeg * Math.PI) / 180;
    const innerR = 6;
    const innerTx = Math.sin(innerAngleRad) * innerR;
    const innerTy = -Math.cos(innerAngleRad) * innerR;
    innerPetals.push(`<g transform="translate(${innerTx.toFixed(2)}, ${innerTy.toFixed(2)}) rotate(${innerAngleDeg})"><g class="petal" style="--petal-delay:${i + 5}"><ellipse cx="0" cy="0" rx="2.5" ry="4" fill="${colors.accent}" opacity="0.6"/></g></g>`);
  }
  return `<g class="flower-head">
    ${petals.join('\n    ')}
    ${innerPetals.join('\n    ')}
    <circle cx="0" cy="0" r="4" fill="${colors.center}" opacity="0.8"/>
    <circle cx="0" cy="0" r="2.5" fill="${colors.primary}" opacity="0.5"/>
  </g>`;
}

function getFlowerSVG(type, variation = 0) {
  const colors = FLOWER_COLORS[type] || FLOWER_COLORS.rose;
  const uniqueId = `_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  let head;
  switch (type) {
    case 'tulip': head = getTulipFlowerSVG(colors); break;
    case 'daisy': head = getDaisyFlowerSVG(colors); break;
    case 'peony': head = getPeonyFlowerSVG(colors); break;
    case 'ranunculus': head = getRanunculusFlowerSVG(colors); break;
    case 'orchid': head = getOrchidFlowerSVG(colors); break;
    case 'simple_a': head = getSimpleAFlowerSVG(colors); break;
    case 'simple_b': head = getSimpleBFlowerSVG(colors); break;
    default: head = getRoseFlowerSVG(colors, uniqueId);
  }
  const stem = getStemSVG(type, variation);
  return `<svg viewBox="-35 -35 70 110" xmlns="http://www.w3.org/2000/svg" class="flower-svg flower-${type}" aria-hidden="true">
    ${stem}
    ${head}
  </svg>`;
}

function getBouquetSVG(type, variation = 0) {
  const colors = FLOWER_COLORS[type] || FLOWER_COLORS.rose;
  const uniqueId = `bq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  let flowers = '';
  
  switch (type) {
    case 'orchid':
      flowers = `
        <g transform="translate(-18, -8) scale(0.9) rotate(-8)">
          ${getOrchidFlowerSVG(colors)}
        </g>
        <g transform="translate(0, -2) scale(1)">
          ${getOrchidFlowerSVG(colors)}
        </g>
        <g transform="translate(20, -6) scale(0.95) rotate(12)">
          ${getOrchidFlowerSVG(colors)}
        </g>`;
      break;
    case 'simple_a':
      flowers = `
        <g transform="translate(-16, -6) scale(0.95) rotate(-10)">
          ${getSimpleAFlowerSVG(colors)}
        </g>
        <g transform="translate(0, -2) scale(1)">
          ${getSimpleAFlowerSVG(colors)}
        </g>
        <g transform="translate(18, -5) scale(0.9) rotate(15)">
          ${getSimpleAFlowerSVG(colors)}
        </g>`;
      break;
    case 'simple_b':
      flowers = `
        <g transform="translate(-17, -7) scale(0.9) rotate(-12)">
          ${getSimpleBFlowerSVG(colors)}
        </g>
        <g transform="translate(0, -3) scale(1)">
          ${getSimpleBFlowerSVG(colors)}
        </g>
        <g transform="translate(19, -6) scale(0.95) rotate(10)">
          ${getSimpleBFlowerSVG(colors)}
        </g>`;
      break;
    default:
      return getFlowerSVG(type, variation);
  }
  
  // Multiple stems fanning out for bouquet
  const stems = `
    <g class="bouquet-stems">
      <line x1="0" y1="10" x2="-5" y2="70" stroke="#5a7a4a" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="0" y1="10" x2="0" y2="72" stroke="#5a7a4a" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="0" y1="10" x2="6" y2="68" stroke="#5a7a4a" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="-10" cy="38" rx="6" ry="3" transform="rotate(-28 -10 38)" fill="#6a8a5a" opacity="0.6"/>
      <ellipse cx="12" cy="42" rx="5" ry="2.5" transform="rotate(25 12 42)" fill="#6a8a5a" opacity="0.55"/>
      <ellipse cx="-6" cy="50" rx="4" ry="2" transform="rotate(-35 -6 50)" fill="#6a8a5a" opacity="0.5"/>
      <ellipse cx="8" cy="52" rx="4.5" ry="2.2" transform="rotate(30 8 52)" fill="#6a8a5a" opacity="0.5"/>
    </g>`;

  // Paper backing positioned directly behind flower heads
  const paper = `
    <defs>
      <linearGradient id="paperGrad${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#faf6f0"/>
        <stop offset="50%" stop-color="#f5efe6"/>
        <stop offset="100%" stop-color="#ede5d8"/>
      </linearGradient>
    </defs>
    <g class="bouquet-paper">
      <path d="M-28,10 Q-30,-5 -22,-18 Q-14,-26 0,-28 Q14,-26 22,-18 Q30,-5 28,10 Q20,18 0,20 Q-20,18 -28,10 Z" 
        fill="url(#paperGrad${uniqueId})" stroke="rgba(210,195,175,0.35)" stroke-width="0.5" opacity="0.45"/>
      <path d="M-22,12 Q-24,16 -20,22 L0,26 L20,22 Q24,16 22,12" 
        fill="url(#paperGrad${uniqueId})" stroke="rgba(210,195,175,0.25)" stroke-width="0.3" opacity="0.35"/>
      <path d="M-18,24 Q0,30 18,24" fill="none" stroke="rgba(200,185,165,0.2)" stroke-width="0.25"/>
    </g>`;

  return `<svg viewBox="-38 -38 76 120" xmlns="http://www.w3.org/2000/svg" class="flower-svg bouquet-svg flower-${type}" aria-hidden="true">
    ${stems}
    ${paper}
    <g class="flower-head bouquet-head">
      ${flowers}
    </g>
  </svg>`;
}

function getBudSVG(type) {
  const colors = FLOWER_COLORS[type] || FLOWER_COLORS.rose;
  let bud;
  switch (type) {
    case 'tulip':
      bud = `<ellipse cx="0" cy="-8" rx="6" ry="12" fill="${colors.primary}"/>
        <ellipse cx="-2" cy="-8" rx="4" ry="10" fill="${colors.secondary}" opacity="0.7"/>
        <ellipse cx="2" cy="-8" rx="4" ry="10" fill="${colors.secondary}" opacity="0.7"/>`;
      break;
    case 'daisy':
      bud = `<ellipse cx="0" cy="-6" rx="5" ry="8" fill="#6a8a5a"/>
        <ellipse cx="0" cy="-9" rx="3" ry="4" fill="${colors.primary}" opacity="0.7"/>`;
      break;
    case 'peony':
      bud = `<ellipse cx="0" cy="-6" rx="7" ry="10" fill="${colors.primary}"/>
        <ellipse cx="-3" cy="-7" rx="5" ry="8" fill="${colors.secondary}" opacity="0.6"/>
        <ellipse cx="3" cy="-7" rx="5" ry="8" fill="${colors.secondary}" opacity="0.6"/>
        <path d="M-4,-2 Q0,-4 4,-2" fill="#6a8a5a" opacity="0.5"/>`;
      break;
    case 'ranunculus':
      bud = `<ellipse cx="0" cy="-6" rx="5" ry="9" fill="${colors.primary}"/>
        <ellipse cx="0" cy="-7" rx="3.5" ry="7" fill="${colors.secondary}" opacity="0.7"/>
        <ellipse cx="0" cy="-8" rx="2" ry="5" fill="${colors.accent}" opacity="0.6"/>`;
      break;
    case 'orchid':
      bud = `<ellipse cx="0" cy="-7" rx="6" ry="11" fill="${colors.primary}"/>
        <ellipse cx="0" cy="-8" rx="4" ry="9" fill="${colors.secondary}" opacity="0.7"/>
        <path d="M-3,-2 Q0,-4 3,-2" fill="${colors.accent}" opacity="0.6"/>`;
      break;
    case 'simple_a':
      bud = `<ellipse cx="0" cy="-6" rx="5" ry="8" fill="${colors.primary}"/>
        <ellipse cx="0" cy="-7" rx="3" ry="6" fill="${colors.secondary}" opacity="0.7"/>`;
      break;
    case 'simple_b':
      bud = `<ellipse cx="0" cy="-5" rx="5" ry="7" fill="${colors.primary}"/>
        <circle cx="0" cy="-6" r="3" fill="${colors.secondary}" opacity="0.7"/>`;
      break;
    default: // rose
      bud = `<ellipse cx="0" cy="-6" rx="6" ry="10" fill="${colors.primary}"/>
        <ellipse cx="-2" cy="-7" rx="4" ry="8" fill="${colors.secondary}" opacity="0.7"/>
        <ellipse cx="2" cy="-7" rx="4" ry="8" fill="${colors.secondary}" opacity="0.7"/>
        <path d="M-3,-1 Q0,-3 3,-1" fill="#6a8a5a" opacity="0.5"/>`;
  }
  return `<svg viewBox="-15 -22 30 44" xmlns="http://www.w3.org/2000/svg" class="bud-svg bud-${type}" aria-hidden="true">
    <line x1="0" y1="0" x2="0" y2="18" stroke="#5a7a4a" stroke-width="1.5" stroke-linecap="round"/>
    ${bud}
  </svg>`;
}

function getPressedFlowerSVG(type, variation = 0) {
  const colors = FLOWER_COLORS[type] || FLOWER_COLORS.rose;
  // Pressed flowers are flatter, more muted
  const muted = {
    primary: colors.primary + 'aa',
    secondary: colors.secondary + '88',
    accent: colors.accent + '66',
    center: colors.center + '88'
  };
  let head;
  switch (type) {
    case 'tulip':
      head = `<ellipse cx="0" cy="-10" rx="12" ry="16" fill="${muted.primary}"/>
        <ellipse cx="-4" cy="-10" rx="8" ry="14" fill="${muted.secondary}"/>
        <ellipse cx="4" cy="-10" rx="8" ry="14" fill="${muted.secondary}"/>`;
      break;
    case 'daisy': {
      const petals = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * 360) / 12;
        petals.push(`<ellipse cx="0" cy="-12" rx="3" ry="9" fill="${muted.primary}" transform="rotate(${a})"/>`);
      }
      head = petals.join('') + `<circle cx="0" cy="0" r="6" fill="${muted.center}"/>`;
      break;
    }
    case 'peony':
      head = `<ellipse cx="-6" cy="-2" rx="14" ry="10" fill="${muted.primary}" transform="rotate(-15)"/>
        <ellipse cx="6" cy="-2" rx="14" ry="10" fill="${muted.primary}" transform="rotate(15)"/>
        <ellipse cx="0" cy="-4" rx="10" ry="8" fill="${muted.secondary}"/>
        <ellipse cx="0" cy="-3" rx="6" ry="5" fill="${muted.accent}"/>
        <circle cx="0" cy="-2" r="3" fill="${muted.center}"/>`;
      break;
    case 'ranunculus': {
      const layers = [];
      for (let ring = 0; ring < 3; ring++) {
        const count = 7 - ring * 2;
        const r = 14 - ring * 3;
        for (let i = 0; i < count; i++) {
          const a = (i * 360) / count + ring * 20;
          const c = ring === 0 ? muted.primary : ring === 1 ? muted.secondary : muted.accent;
          layers.push(`<ellipse cx="0" cy="${-r}" rx="4" ry="${r * 0.5}" fill="${c}" transform="rotate(${a})"/>`);
        }
      }
      head = layers.join('') + `<circle cx="0" cy="0" r="3" fill="${muted.center}"/>`;
      break;
    }
    case 'orchid':
      head = `<ellipse cx="0" cy="-8" rx="14" ry="18" fill="${muted.primary}" opacity="0.6"/>
        <ellipse cx="-6" cy="-6" rx="10" ry="14" fill="${muted.secondary}" transform="rotate(-35)"/>
        <ellipse cx="6" cy="-6" rx="10" ry="14" fill="${muted.secondary}" transform="rotate(35)"/>
        <path d="M-8,-2 Q-10,-8 -6,-12 Q0,-10 6,-12 Q10,-8 8,-2 Q4,0 0,2 Q-4,0 -8,-2" fill="${muted.accent}" opacity="0.5"/>
        <circle cx="0" cy="-4" r="3" fill="${muted.center}"/>`;
      break;
    case 'simple_a':
      head = `<ellipse cx="0" cy="-6" rx="8" ry="10" fill="${muted.primary}" opacity="0.6"/>
        <ellipse cx="-4" cy="-5" rx="6" ry="8" fill="${muted.secondary}" transform="rotate(-25)"/>
        <ellipse cx="4" cy="-5" rx="6" ry="8" fill="${muted.secondary}" transform="rotate(25)"/>
        <circle cx="0" cy="-4" r="3" fill="${muted.center}"/>`;
      break;
    case 'simple_b': {
      const petals = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 360) / 5;
        petals.push(`<ellipse cx="0" cy="-10" rx="4" ry="7" fill="${muted.primary}" transform="rotate(${a})"/>`);
      }
      head = petals.join('') + `<circle cx="0" cy="0" r="4" fill="${muted.center}"/>`;
      break;
    }
    default: // rose
      head = `<ellipse cx="0" cy="-2" rx="16" ry="14" fill="${muted.primary}"/>
        <ellipse cx="-4" cy="-3" rx="10" ry="10" fill="${muted.secondary}" transform="rotate(-20)"/>
        <ellipse cx="4" cy="-3" rx="10" ry="10" fill="${muted.secondary}" transform="rotate(20)"/>
        <ellipse cx="0" cy="-4" rx="6" ry="6" fill="${muted.accent}"/>
        <circle cx="0" cy="-3" r="3" fill="${muted.center}"/>
        <path d="M-5,-3 Q0,-7 5,-3" fill="none" stroke="${muted.accent}" stroke-width="0.3"/>`;
  }

  const angle = (variation % 5 - 2) * 4;
  const stemLen = 50 + (variation % 3) * 6;
  const leafSide = variation % 2 === 0 ? 1 : -1;
  const leafY = 20 + (variation % 4) * 5;

  return `<svg viewBox="-25 -22 50 90" xmlns="http://www.w3.org/2000/svg" class="pressed-flower-svg pressed-${type}" aria-hidden="true">
    <g transform="rotate(${angle})" opacity="0.85">
      <line x1="0" y1="2" x2="0" y2="${stemLen}" stroke="#7a9a6a" stroke-width="1" opacity="0.6"/>
      <ellipse cx="${leafSide * 10}" cy="${leafY}" rx="7" ry="3.5" transform="rotate(${leafSide * -25} ${leafSide * 10} ${leafY})" fill="#7a9a6a" opacity="0.35"/>
      ${head}
    </g>
  </svg>`;
}

// ===== STATE =====

let valentineData = { notes: [] };
let currentValentineView = 'garden'; // 'garden' or 'album'
let currentAlbumPage = 0;
let firstVisit = true;

// ===== STORAGE =====

function loadValentineData() {
  try {
    const stored = localStorage.getItem(VALENTINE_STORAGE_KEY);
    if (stored) {
      valentineData = JSON.parse(stored);
      firstVisit = false;
      debugLog('Valentine data loaded:', valentineData.notes.length, 'notes');
    } else {
      valentineData = { notes: [] };
      firstVisit = true;
      debugLog('Valentine data initialized');
    }
  } catch (error) {
    debugError('Error loading Valentine data:', error);
    valentineData = { notes: [] };
  }
  if (!Array.isArray(valentineData.notes)) valentineData.notes = [];
  if (!Array.isArray(valentineData.flowerDeck) || valentineData.flowerDeckIndex == null) {
    valentineData.flowerDeck = null;
    valentineData.flowerDeckIndex = FLOWER_TYPES.length;
  }
  
  // Ensure exclusive flowers are present and always at the top in order
  const exclusiveIds = new Set(EXCLUSIVE_FLOWERS.map(f => f.id));
  const userNotes = valentineData.notes.filter(n => !exclusiveIds.has(n.id));
  const exclusiveOrdered = EXCLUSIVE_FLOWERS.map(ef => {
    const existing = valentineData.notes.find(n => n.id === ef.id);
    return existing ? { ...ef, ...existing, exclusive: true, bloomed: true } : ef;
  });
  valentineData.notes = [...exclusiveOrdered, ...userNotes];

  valentineData.notes.forEach(n => {
    if (!Array.isArray(n.images)) n.images = [];
  });
}

function saveValentineData() {
  try {
    localStorage.setItem(VALENTINE_STORAGE_KEY, JSON.stringify(valentineData));
    debugLog('Valentine data saved');
  } catch (error) {
    debugError('Error saving Valentine data:', error);
  }
}

function generateId() {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNextFlowerType() {
  if (!valentineData.flowerDeck || valentineData.flowerDeckIndex >= FLOWER_TYPES.length) {
    valentineData.flowerDeck = shuffleArray([...FLOWER_TYPES]);
    valentineData.flowerDeckIndex = 0;
  }
  const type = valentineData.flowerDeck[valentineData.flowerDeckIndex];
  valentineData.flowerDeckIndex++;
  return type;
}

// ===== NOTE CRUD =====

function addNote(text, images = []) {
  if (!text || !text.trim()) return null;
  const note = {
    id: generateId(),
    text: text.trim(),
    createdAt: Date.now(),
    flowerType: getNextFlowerType(),
    bloomed: false,
    images: (images || []).slice(0, MAX_IMAGES_PER_NOTE)
  };
  valentineData.notes.push(note);
  firstVisit = false;
  saveValentineData();
  debugLog('Note added:', note.id, note.flowerType);
  return note;
}

function addImagesToNote(noteId, newImages) {
  const note = valentineData.notes.find(n => n.id === noteId);
  if (!note) return false;
  if (!Array.isArray(note.images)) note.images = [];
  const toAdd = newImages.slice(0, MAX_IMAGES_PER_NOTE - note.images.length);
  note.images.push(...toAdd);
  saveValentineData();
  return true;
}

function removeImageFromNote(noteId, index) {
  const note = valentineData.notes.find(n => n.id === noteId);
  if (!note || !Array.isArray(note.images)) return false;
  note.images.splice(index, 1);
  saveValentineData();
  return true;
}

function resizeImageAsBase64(file, maxW = 400, maxH = 400, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const r = Math.min(maxW / w, maxH / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function deleteNote(id) {
  const idx = valentineData.notes.findIndex(n => n.id === id);
  if (idx === -1) return false;
  // Prevent deletion of exclusive flowers
  if (valentineData.notes[idx].exclusive) {
    debugLog('Cannot delete exclusive flower:', id);
    return false;
  }
  valentineData.notes.splice(idx, 1);
  saveValentineData();
  debugLog('Note deleted:', id);
  return true;
}

function toggleBloom(id) {
  const note = valentineData.notes.find(n => n.id === id);
  if (!note) return;
  note.bloomed = !note.bloomed;
  saveValentineData();
}

// ===== FORMAT DATE =====

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ===== ESCAPE HTML =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== FLOWER IMAGES =====

function renderFlowerImages(note, forGarden = true) {
  const imgs = note.images || [];
  const canAdd = imgs.length < MAX_IMAGES_PER_NOTE;
  const smallClass = forGarden ? 'flower-thumb' : 'specimen-thumb';
  const classes = ['flower-images-attached'];
  if (imgs.length === 0) classes.push('no-images');
  else if (imgs.length === 1) classes.push('single-image');
  let html = `<div class="${classes.join(' ')}">`;
  imgs.forEach((src, i) => {
    html += `<img class="${smallClass} flower-image-clickable" src="${src}" alt="Photo ${i + 1}" data-note-id="${note.id}" data-img-index="${i}" />`;
  });
  if (canAdd) {
    html += `<label class="flower-add-photo-btn" title="Add photo"><input type="file" accept="image/*" class="flower-add-photo-input" data-note-id="${note.id}" multiple/><span>+</span></label>`;
  }
  html += '</div>';
  return html;
}

function openFlowerDetailModal(noteId) {
  const note = valentineData.notes.find(n => n.id === noteId);
  if (!note) return;

  const modal = document.getElementById('flowerImageModal');
  const flowerEl = document.getElementById('flowerModalFlower');
  const noteEl = document.getElementById('flowerModalNote');
  const dateEl = document.getElementById('flowerModalDate');
  const imagesEl = document.getElementById('flowerModalImages');
  if (!modal || !flowerEl || !noteEl || !dateEl || !imagesEl) return;

  const flowerLabel = FLOWER_LABELS[note.flowerType] || note.flowerType;
  const flowerName = FLOWER_NAMES[note.flowerType] || note.flowerType;
  const dateStr = note.exclusive ? formatDate(note.createdAt) : 'Planted ' + formatDate(note.createdAt);

  flowerEl.innerHTML = note.exclusive ? getBouquetSVG(note.flowerType, 0) : getFlowerSVG(note.flowerType, 0);
  noteEl.textContent = note.text;
  dateEl.textContent = note.exclusive ? dateStr : dateStr;

  imagesEl.innerHTML = '';
  const imgs = note.images || [];
  imgs.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'flower-modal-image-wrap';
    wrap.innerHTML = `<img src="${src}" alt="Photo ${i + 1}" /><button type="button" class="flower-modal-remove-img" data-note-id="${note.id}" data-img-index="${i}" aria-label="Remove photo">&times;</button>`;
    imagesEl.appendChild(wrap);
  });
  imagesEl.classList.remove('modal-images-one', 'modal-images-two', 'modal-images-none');
  if (imgs.length === 0) imagesEl.classList.add('modal-images-none');
  else if (imgs.length === 1) imagesEl.classList.add('modal-images-one');
  else if (imgs.length === 2) imagesEl.classList.add('modal-images-two');

  const contentEl = modal.querySelector('.flower-modal-content');
  if (contentEl) {
    contentEl.classList.toggle('modal-has-images', imgs.length > 0);
  }

  modal.classList.add('active');
  modal.dataset.openNoteId = noteId;
  modal.focus();

  imagesEl.querySelectorAll('.flower-modal-remove-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.noteId;
      const idx = parseInt(btn.dataset.imgIndex, 10);
      removeImageFromNote(id, idx);
      openFlowerDetailModal(id);
      if ((valentineData.notes.find(n => n.id === id)?.images || []).length === 0) {
        closeImageFullscreen();
      }
      renderGarden();
      renderAlbum();
    });
  });
}

function closeImageFullscreen() {
  const modal = document.getElementById('flowerImageModal');
  if (!modal) return;
  modal.classList.remove('active');
  delete modal.dataset.openNoteId;
}

// ===== GARDEN RENDER =====

function renderGarden() {
  const canvas = document.getElementById('gardenCanvas');
  if (!canvas) return;

  if (valentineData.notes.length === 0) {
    canvas.innerHTML = `<div class="garden-empty-state" role="status">
      <svg viewBox="0 0 60 80" width="80" height="100" aria-hidden="true" class="empty-seedling">
        <line x1="30" y1="40" x2="30" y2="75" stroke="#7a9a6a" stroke-width="1.5" opacity="0.5"/>
        <ellipse cx="30" cy="38" rx="8" ry="12" fill="#8aaa7a" opacity="0.4"/>
        <ellipse cx="24" cy="50" rx="6" ry="3" transform="rotate(-30 24 50)" fill="#7a9a6a" opacity="0.3"/>
      </svg>
      <p class="empty-text">${firstVisit ? 'Plant your first love note' : 'Your garden is empty'}</p>
      ${firstVisit ? '<p class="empty-hint">Click the + button to begin</p>' : ''}
    </div>`;
    return;
  }

  canvas.innerHTML = '';
  const notesByDate = [...valentineData.notes].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  notesByDate.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = `flower-card ${note.bloomed ? 'bloomed' : 'seed'}`;
    if (note.exclusive) {
      card.classList.add('exclusive-flower');
    }
    card.setAttribute('data-note-id', note.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', note.bloomed
      ? `Bloomed ${note.flowerType}: ${note.text}. Click to close.`
      : `${note.flowerType} bud. Click to bloom.`);

    // Organic scatter: randomized position offset
    const offsetX = ((index * 37 + 13) % 20) - 10;
    const offsetY = ((index * 23 + 7) % 14) - 7;
    const rotate = ((index * 17 + 3) % 10) - 5;
    card.style.setProperty('--scatter-x', `${offsetX}px`);
    card.style.setProperty('--scatter-y', `${offsetY}px`);
    card.style.setProperty('--scatter-r', `${rotate}deg`);

    if (note.bloomed) {
      const flowerLabel = FLOWER_LABELS[note.flowerType] || note.flowerType;
      const flowerName = FLOWER_NAMES[note.flowerType] || note.flowerType.charAt(0).toUpperCase() + note.flowerType.slice(1).replace('_', ' ');
      const datePrefix = note.exclusive ? '' : 'Planted ';
      const dateClass = note.exclusive ? 'flower-date given-date' : 'flower-date';

      if (note.exclusive) {
        const speciesInfo = `<div class="flower-species"><span class="flower-species-latin">${flowerLabel}</span><span class="flower-species-common">${flowerName}</span></div>`;
        const imagesHtml = renderFlowerImages(note, true);
        card.innerHTML = `
          <div class="flower-bloom-container bouquet-container">
            ${getBouquetSVG(note.flowerType, index)}
            ${imagesHtml}
            <div class="flower-letter-exclusive flower-note-clickable" data-note-id="${note.id}">
              <p class="flower-letter-glow">${escapeHtml(note.text)}</p>
            </div>
          </div>
          ${speciesInfo}
          <div class="exclusive-label">From Gesan</div>
          <div class="${dateClass}">${formatDate(note.createdAt)}</div>`;
      } else {
        const deleteBtn = `<button class="flower-delete-btn" data-note-id="${note.id}" aria-label="Delete note" title="Delete note">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M7 7v4M9 7v4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>`;
        const imagesHtml = renderFlowerImages(note, true);
        card.innerHTML = `
          <div class="flower-bloom-container">
            ${getFlowerSVG(note.flowerType, index)}
            ${imagesHtml}
            <div class="flower-letter flower-note-clickable" data-note-id="${note.id}">
              <p class="flower-letter-text">${escapeHtml(note.text)}</p>
            </div>
          </div>
          <div class="${dateClass}">${datePrefix} ${formatDate(note.createdAt)}</div>
          ${deleteBtn}`;
      }
    } else {
      card.innerHTML = `
        <div class="flower-bud-container">
          ${getBudSVG(note.flowerType)}
        </div>
        <div class="flower-date">Planted ${formatDate(note.createdAt)}</div>`;
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.flower-delete-btn')) return;
      if (e.target.closest('.flower-images-attached')) return;
      if (note.bloomed && (e.target.closest('.flower-note-clickable') || e.target.closest('.flower-bloom-container'))) {
        openFlowerDetailModal(note.id);
      } else if (!note.bloomed && !note.exclusive) {
        handleBloom(note.id, card);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.target.closest('.flower-delete-btn')) return;
        if (!note.exclusive) {
          handleBloom(note.id, card);
        }
      }
    });

    canvas.appendChild(card);
  });

  canvas.querySelectorAll('.flower-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.noteId;
      if (confirm('Remove this note from the garden?')) {
        deleteNote(id);
        renderGarden();
        renderAlbum();
      }
    });
  });

  canvas.querySelectorAll('.flower-image-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = el.dataset.noteId;
      if (noteId) openFlowerDetailModal(noteId);
    });
  });

  canvas.querySelectorAll('.flower-add-photo-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      e.stopPropagation();
      const noteId = input.dataset.noteId;
      const files = Array.from(input.files || []);
      const note = valentineData.notes.find(n => n.id === noteId);
      if (!note || !files.length) return;
      const remaining = MAX_IMAGES_PER_NOTE - (note.images || []).length;
      const toProcess = files.slice(0, remaining);
      const base64List = [];
      for (const file of toProcess) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await resizeImageAsBase64(file);
        if (base64) base64List.push(base64);
      }
      if (base64List.length) {
        addImagesToNote(noteId, base64List);
        renderGarden();
        renderAlbum();
      }
      input.value = '';
    });
  });
}

function handleBloom(noteId, cardElement) {
  const note = valentineData.notes.find(n => n.id === noteId);
  if (!note) return;

  if (!note.bloomed) {
    // Watering animation then bloom
    cardElement.classList.add('watering');
    cardElement.setAttribute('aria-label', 'Watering...');
    setTimeout(() => {
      cardElement.classList.remove('watering');
      note.bloomed = true;
      saveValentineData();
      renderGarden();
    }, 700);
  } else {
    // Re-bloom: close then allow re-open
    note.bloomed = false;
    saveValentineData();
    renderGarden();
  }
}

// ===== ALBUM RENDER =====

const SPECIMENS_PER_SPREAD = 2;

function getAlbumPageCount() {
  const total = valentineData.notes.length;
  if (total === 0) return 0;
  return Math.ceil(total / SPECIMENS_PER_SPREAD);
}

function renderAlbum() {
  const albumContainer = document.getElementById('albumBook');
  if (!albumContainer) return;

  const total = valentineData.notes.length;

  if (total === 0) {
    albumContainer.innerHTML = `<div class="album-empty-state" role="status">
      <p class="empty-text">Add a note to start your album</p>
    </div>`;
    updateAlbumNav();
    return;
  }

  const pageCount = getAlbumPageCount();
  if (currentAlbumPage >= pageCount) currentAlbumPage = pageCount - 1;
  if (currentAlbumPage < 0) currentAlbumPage = 0;

  const startIdx = currentAlbumPage * SPECIMENS_PER_SPREAD;
  const pageNotes = valentineData.notes.slice(startIdx, startIdx + SPECIMENS_PER_SPREAD);

  let leftPage = '<div class="album-page album-page-left"><div class="page-number">' + (currentAlbumPage * 2 + 1) + '</div>';
  let rightPage = '<div class="album-page album-page-right"><div class="page-number">' + (currentAlbumPage * 2 + 2) + '</div>';

  if (pageNotes[0]) {
    leftPage += renderSpecimen(pageNotes[0], startIdx);
  } else {
    leftPage += '<div class="specimen-placeholder"></div>';
  }
  leftPage += '</div>';

  if (pageNotes[1]) {
    rightPage += renderSpecimen(pageNotes[1], startIdx + 1);
  } else {
    rightPage += '<div class="specimen-placeholder"></div>';
  }
  rightPage += '</div>';

  albumContainer.innerHTML = `<div class="album-spine"></div><div class="album-spread">${leftPage}${rightPage}</div>`;

  albumContainer.querySelectorAll('.specimen-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.noteId;
      if (confirm('Remove this specimen?')) {
        deleteNote(id);
        renderGarden();
        renderAlbum();
      }
    });
  });

  albumContainer.querySelectorAll('.flower-image-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = el.dataset.noteId;
      if (noteId) openFlowerDetailModal(noteId);
    });
  });

  albumContainer.querySelectorAll('.pressed-specimen').forEach(spec => {
    spec.addEventListener('click', (e) => {
      if (e.target.closest('.specimen-delete-btn') || e.target.closest('.flower-add-photo-btn') || e.target.closest('.flower-add-photo-input')) return;
      const noteId = spec.dataset.noteId;
      if (noteId) openFlowerDetailModal(noteId);
    });
  });

  albumContainer.querySelectorAll('.flower-add-photo-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      e.stopPropagation();
      const noteId = input.dataset.noteId;
      const files = Array.from(input.files || []);
      const note = valentineData.notes.find(n => n.id === noteId);
      if (!note || !files.length) return;
      const remaining = MAX_IMAGES_PER_NOTE - (note.images || []).length;
      const toProcess = files.slice(0, remaining);
      const base64List = [];
      for (const file of toProcess) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await resizeImageAsBase64(file);
        if (base64) base64List.push(base64);
      }
      if (base64List.length) {
        addImagesToNote(noteId, base64List);
        renderGarden();
        renderAlbum();
      }
      input.value = '';
    });
  });

  updateAlbumNav();
}

function renderSpecimen(note, variation) {
  const flowerLabel = FLOWER_LABELS[note.flowerType] || note.flowerType;
  const flowerName = FLOWER_NAMES[note.flowerType] || note.flowerType;
  const datePrefix = note.exclusive ? '' : 'Planted ';
  const deleteBtn = note.exclusive ? '' : `<button class="specimen-delete-btn" data-note-id="${note.id}" aria-label="Delete specimen" title="Delete specimen">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M7 7v4M9 7v4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>`;
  const exclusiveFrom = note.exclusive ? '<span class="specimen-from">From Gesan</span>' : '';
  const imagesHtml = renderFlowerImages(note, false);
  return `<div class="pressed-specimen${note.exclusive ? ' exclusive-specimen' : ''}" data-note-id="${note.id}" role="article" aria-label="${flowerLabel}: ${escapeHtml(note.text)}">
    <div class="specimen-flower">
      ${getPressedFlowerSVG(note.flowerType, variation)}
    </div>
    ${imagesHtml}
    <div class="specimen-label">
      <span class="specimen-species">${flowerLabel}</span>
      <span class="specimen-common">${flowerName}</span>
      ${exclusiveFrom}
      <span class="specimen-date">${note.exclusive ? formatDate(note.createdAt) : datePrefix + formatDate(note.createdAt)}</span>
    </div>
    <p class="specimen-note flower-note-clickable" data-note-id="${note.id}">${escapeHtml(note.text)}</p>
    ${deleteBtn}
  </div>`;
}

function updateAlbumNav() {
  const prevBtn = document.getElementById('albumPrev');
  const nextBtn = document.getElementById('albumNext');
  const pageInfo = document.getElementById('albumPageInfo');
  const pageCount = getAlbumPageCount();

  if (prevBtn) {
    prevBtn.disabled = currentAlbumPage <= 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentAlbumPage >= pageCount - 1 || pageCount === 0;
  }
  if (pageInfo) {
    pageInfo.textContent = pageCount > 0 ? `${currentAlbumPage + 1} / ${pageCount}` : '';
  }
}

// ===== VIEW TOGGLE =====

function switchValentineView(view) {
  if (view === currentValentineView) return;
  currentValentineView = view;

  const gardenEl = document.getElementById('valentineGarden');
  const albumEl = document.getElementById('valentineAlbum');
  const gardenTab = document.getElementById('viewTabGarden');
  const albumTab = document.getElementById('viewTabAlbum');

  if (view === 'garden') {
    gardenEl?.classList.add('active');
    albumEl?.classList.remove('active');
    gardenTab?.classList.add('active');
    gardenTab?.setAttribute('aria-selected', 'true');
    albumTab?.classList.remove('active');
    albumTab?.setAttribute('aria-selected', 'false');
    renderGarden();
  } else {
    gardenEl?.classList.remove('active');
    albumEl?.classList.add('active');
    gardenTab?.classList.remove('active');
    gardenTab?.setAttribute('aria-selected', 'false');
    albumTab?.classList.add('active');
    albumTab?.setAttribute('aria-selected', 'true');
    renderAlbum();
  }

  debugLog('Valentine view switched to:', view);
}

// ===== ADD FORM =====

let pendingFormImages = [];

function toggleAddForm(show) {
  const form = document.getElementById('valentineAddForm');
  const btn = document.getElementById('valentineAddBtn');
  if (!form || !btn) return;

  const shouldShow = show !== null && show !== undefined ? show : !form.classList.contains('active');

  if (shouldShow) {
    form.classList.add('active');
    btn.classList.add('hidden');
    const input = form.querySelector('.valentine-note-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    pendingFormImages = [];
    const imgInput = document.getElementById('valentineImageInput');
    if (imgInput) imgInput.value = '';
    renderFormImagePreview();
  } else {
    form.classList.remove('active');
    btn.classList.remove('hidden');
  }
}

function renderFormImagePreview() {
  const container = document.getElementById('valentineImagePreview');
  if (!container) return;
  container.innerHTML = '';
  pendingFormImages.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'flower-image-preview-item';
    wrap.innerHTML = `<img src="${src}" alt="Preview ${i + 1}"/><button type="button" class="flower-image-remove" data-index="${i}" aria-label="Remove photo">×</button>`;
    container.appendChild(wrap);
  });
}

async function handleFormImageSelect(e) {
  const input = e.target;
  const files = Array.from(input.files || []);
  const remaining = MAX_IMAGES_PER_NOTE - pendingFormImages.length;
  const toProcess = files.slice(0, remaining);
  for (const file of toProcess) {
    if (!file.type.startsWith('image/')) continue;
    const base64 = await resizeImageAsBase64(file);
    if (base64) {
      pendingFormImages.push(base64);
      if (pendingFormImages.length >= MAX_IMAGES_PER_NOTE) break;
    }
  }
  input.value = '';
  renderFormImagePreview();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('valentineNoteInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  addNote(text, pendingFormImages);
  input.value = '';
  pendingFormImages = [];
  toggleAddForm(false);
  renderGarden();
  renderAlbum();
}

// ===== CLOCK =====

function updateValentineClock() {
  const el = document.getElementById('valentineClockTime');
  if (!el) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s}`;
}

// ===== INIT =====

export function initValentineGarden() {
  loadValentineData();

  // View toggle tabs
  const gardenTab = document.getElementById('viewTabGarden');
  const albumTab = document.getElementById('viewTabAlbum');

  if (gardenTab) {
    gardenTab.addEventListener('click', () => switchValentineView('garden'));
  }
  if (albumTab) {
    albumTab.addEventListener('click', () => switchValentineView('album'));
  }

  // Keyboard nav for tabs
  [gardenTab, albumTab].forEach(tab => {
    if (!tab) return;
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        switchValentineView(currentValentineView === 'garden' ? 'album' : 'garden');
      }
    });
  });

  // Add button and form
  const addBtn = document.getElementById('valentineAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => toggleAddForm(true));
  }

  const form = document.getElementById('valentineAddFormInner');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  const imgInput = document.getElementById('valentineImageInput');
  if (imgInput) {
    imgInput.addEventListener('change', handleFormImageSelect);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.flower-image-remove')) {
      const btn = e.target.closest('.flower-image-remove');
      const idx = parseInt(btn.dataset.index, 10);
      if (!isNaN(idx)) {
        pendingFormImages.splice(idx, 1);
        renderFormImagePreview();
      }
    }
  });

  const modal = document.getElementById('flowerImageModal');
  if (modal) {
    const closeBtn = modal.querySelector('.flower-image-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeImageFullscreen);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeImageFullscreen();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeImageFullscreen();
    });
  }

  const cancelBtn = document.querySelector('.valentine-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => toggleAddForm(false));
  }

  // Handle Enter in input (submit)
  const noteInput = document.getElementById('valentineNoteInput');
  if (noteInput) {
    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
      }
      if (e.key === 'Escape') {
        toggleAddForm(false);
      }
    });
  }

  // Album nav
  const prevBtn = document.getElementById('albumPrev');
  const nextBtn = document.getElementById('albumNext');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentAlbumPage > 0) {
        currentAlbumPage--;
        renderAlbum();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentAlbumPage < getAlbumPageCount() - 1) {
        currentAlbumPage++;
        renderAlbum();
      }
    });
  }

  // Clock
  updateValentineClock();
  setInterval(updateValentineClock, 1000);

  // Initial render
  renderGarden();
  renderAlbum();

  debugLog('Valentine garden initialized');
}
