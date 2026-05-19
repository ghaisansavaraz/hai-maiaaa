// marygold-clock.js — Marygold Clock modal experience

let mgAudio = null;
let mgOpen = false;

export function initMaryGoldClock() {
  const clock = document.getElementById('valentineAnalogClock');
  if (!clock) return;
  clock.style.cursor = 'pointer';
  clock.setAttribute('title', 'Tap to summon the Marygold Clock ✨');
  clock.addEventListener('click', toggleMG);

  const modal = document.getElementById('marygoldModal');
  if (!modal) return;
  modal.addEventListener('click', e => { if (e.target === modal) closeMG(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mgOpen) closeMG(); });
}

function toggleMG() { mgOpen ? closeMG() : openMG(); }

function openMG() {
  mgOpen = true;
  buildSVG();
  document.getElementById('marygoldModal')?.classList.add('open');

  if (!mgAudio) {
    mgAudio = new Audio('assets/Marygold Clock/Plaza Senayan Marygold.mp3');
    mgAudio.volume = 0.75;
  }
  mgAudio.currentTime = 0;
  mgAudio.play().catch(() => {});
}

function closeMG() {
  mgOpen = false;
  document.getElementById('marygoldModal')?.classList.remove('open');
  if (mgAudio) { mgAudio.pause(); mgAudio.currentTime = 0; }
}

// ── SVG builder ──────────────────────────────────────────────────────────────

const CX = 300;

function col(x, y, w, h, fill) {
  return `<rect x="${CX - w / 2 + x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}"/>`;
}

function ring(y, w, h) {
  return `<rect x="${CX - w / 2}" y="${y}" width="${w}" height="${h}" rx="2" fill="#6B5A38"/>`;
}

function platform(cx, yTop) {
  const h = 28;
  return `
    <ellipse cx="${cx}" cy="${yTop}" rx="28" ry="9" fill="#B0B4B8"/>
    <rect x="${cx - 28}" y="${yTop}" width="56" height="${h}" fill="#909498"/>
    <ellipse cx="${cx}" cy="${yTop + h}" rx="28" ry="9" fill="#707478"/>
    <line x1="${cx - 28}" y1="${yTop + 8}" x2="${cx + 28}" y2="${yTop + 8}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  `;
}

function drum(cx, yTop) {
  const h = 24;
  return `
    <ellipse cx="${cx}" cy="${yTop}" rx="24" ry="8" fill="#26A69A"/>
    <rect x="${cx - 24}" y="${yTop}" width="48" height="${h}" fill="#1A9880"/>
    <ellipse cx="${cx}" cy="${yTop + h}" rx="24" ry="8" fill="#13796A"/>
    <line x1="${cx - 24}" y1="${yTop + 7}" x2="${cx + 24}" y2="${yTop + 7}" stroke="#E53935" stroke-width="3.5"/>
    <line x1="${cx - 24}" y1="${yTop + 17}" x2="${cx + 24}" y2="${yTop + 17}" stroke="#E53935" stroke-width="3.5"/>
  `;
}

const GOLD   = '#D4A820';
const GOLD_D = '#B8860B';
const GOLD_L = '#F0C030';

// Realistic gold cherub — winged, robed, metallic gradient fills
function cherub(cx, by, instrument) {
  return `
    <g class="mg-figurine">
      <!-- Wings (rendered behind body) -->
      <path d="M${cx},${by-30} C${cx-30},${by-46} ${cx-42},${by-22} ${cx-18},${by-16}" fill="url(#mgFigGold)" opacity="0.72"/>
      <path d="M${cx},${by-30} C${cx+30},${by-46} ${cx+42},${by-22} ${cx+18},${by-16}" fill="url(#mgFigGold)" opacity="0.72"/>
      <path d="M${cx-2},${by-30} C${cx-22},${by-43} ${cx-30},${by-24} ${cx-14},${by-19}" fill="none" stroke="rgba(255,248,150,0.45)" stroke-width="1.5"/>
      <path d="M${cx+2},${by-30} C${cx+22},${by-43} ${cx+30},${by-24} ${cx+14},${by-19}" fill="none" stroke="rgba(255,248,150,0.45)" stroke-width="1.5"/>
      <!-- Lower robe / lap (seated) -->
      <ellipse cx="${cx}" cy="${by-9}" rx="15" ry="11" fill="${GOLD_D}"/>
      <ellipse cx="${cx}" cy="${by}" rx="11" ry="4" fill="rgba(0,0,0,0.14)"/>
      <!-- Robe drapery folds -->
      <line x1="${cx-8}" y1="${by}" x2="${cx-5}" y2="${by-19}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx}"   y1="${by}" x2="${cx}"   y2="${by-20}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx+8}" y1="${by}" x2="${cx+5}" y2="${by-19}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Torso -->
      <ellipse cx="${cx}" cy="${by-28}" rx="11" ry="13" fill="url(#mgFigGold)"/>
      <ellipse cx="${cx-3}" cy="${by-32}" rx="4" ry="5" fill="rgba(255,248,190,0.28)"/>
      <!-- Neck -->
      <rect x="${cx-4}" y="${by-43}" width="8" height="7" rx="3" fill="${GOLD}"/>
      <!-- Head -->
      <circle cx="${cx}" cy="${by-54}" r="13" fill="url(#mgFigGold)"/>
      <ellipse cx="${cx-3}" cy="${by-59}" rx="6" ry="5" fill="rgba(255,248,190,0.28)"/>
      <!-- Brows -->
      <path d="M${cx-7},${by-58} Q${cx-4},${by-60} ${cx-1},${by-58}" stroke="${GOLD_D}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M${cx+7},${by-58} Q${cx+4},${by-60} ${cx+1},${by-58}" stroke="${GOLD_D}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- Eyes -->
      <ellipse cx="${cx-5}" cy="${by-56}" rx="2.8" ry="2.2" fill="${GOLD_D}"/>
      <ellipse cx="${cx+5}" cy="${by-56}" rx="2.8" ry="2.2" fill="${GOLD_D}"/>
      <circle cx="${cx-4.2}" cy="${by-57}" r="0.9" fill="rgba(255,255,255,0.55)"/>
      <circle cx="${cx+5.8}" cy="${by-57}" r="0.9" fill="rgba(255,255,255,0.55)"/>
      <!-- Nose -->
      <ellipse cx="${cx}" cy="${by-51}" rx="1.8" ry="1.2" fill="${GOLD_D}" opacity="0.65"/>
      <!-- Smile -->
      <path d="M${cx-3.5},${by-47} Q${cx},${by-44} ${cx+3.5},${by-47}" stroke="${GOLD_D}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <!-- Cheek blush -->
      <ellipse cx="${cx-7}" cy="${by-49}" rx="3.5" ry="2" fill="rgba(210,110,70,0.18)"/>
      <ellipse cx="${cx+7}" cy="${by-49}" rx="3.5" ry="2" fill="rgba(210,110,70,0.18)"/>
      <!-- Curly hair -->
      <path d="M${cx-12},${by-60} C${cx-15},${by-71} ${cx-6},${by-72} ${cx-4},${by-65}" stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx-4},${by-66} C${cx-2},${by-73} ${cx+4},${by-73} ${cx+4},${by-66}" stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx+4},${by-66} C${cx+6},${by-71} ${cx+15},${by-71} ${cx+12},${by-60}" stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      ${instrumentSVG(cx, by, instrument)}
    </g>`;
}

function instrumentSVG(cx, by, type) {
  switch (type) {
    case 'cymbals':
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-22}" y2="${by-40}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+22}" y2="${by-40}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx-24}" cy="${by-42}" rx="14" ry="5" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx-24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,248,130,0.38)" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx-24}" cy="${by-42}" rx="14" ry="5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.8" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="14" ry="5" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1" transform="rotate(25,${cx+24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,248,130,0.38)" transform="rotate(25,${cx+24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="14" ry="5" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.8" transform="rotate(25,${cx+24},${by-42})"/>
      `;
    case 'guitar':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-30}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="5"  ry="7"  fill="${GOLD_D}"/>
        <ellipse cx="${cx+21}" cy="${by-29}" rx="4"  ry="5"  fill="rgba(255,248,110,0.32)"/>
        <circle  cx="${cx+23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.38)"/>
        <line x1="${cx+23}" y1="${by-39}" x2="${cx+21}" y2="${by-57}" stroke="${GOLD_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx+21}" y1="${by-43}" x2="${cx+24}" y2="${by-43}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-48}" x2="${cx+24}" y2="${by-48}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-53}" x2="${cx+24}" y2="${by-53}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+22}" y1="${by-39}" x2="${cx+21}" y2="${by-57}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
        <line x1="${cx+24}" y1="${by-39}" x2="${cx+22}" y2="${by-57}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
      `;
    case 'guitar-left':
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-14}" y2="${by-30}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="5"  ry="7"  fill="${GOLD_D}"/>
        <ellipse cx="${cx-21}" cy="${by-29}" rx="4"  ry="5"  fill="rgba(255,248,110,0.32)"/>
        <circle  cx="${cx-23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.38)"/>
        <line x1="${cx-23}" y1="${by-39}" x2="${cx-21}" y2="${by-57}" stroke="${GOLD_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx-21}" y1="${by-43}" x2="${cx-24}" y2="${by-43}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-48}" x2="${cx-24}" y2="${by-48}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-53}" x2="${cx-24}" y2="${by-53}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-22}" y1="${by-39}" x2="${cx-21}" y2="${by-57}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
        <line x1="${cx-24}" y1="${by-39}" x2="${cx-22}" y2="${by-57}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
      `;
    case 'mandolin':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-27}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="9" ry="12" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="4" ry="6"  fill="${GOLD_D}"/>
        <circle  cx="${cx+22}" cy="${by-23}" r="2"  fill="rgba(0,0,0,0.38)"/>
        <ellipse cx="${cx+20}" cy="${by-26}" rx="3" ry="4"  fill="rgba(255,248,110,0.32)"/>
        <line x1="${cx+22}" y1="${by-34}" x2="${cx+20}" y2="${by-51}" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx+20}" y1="${by-37}" x2="${cx+23}" y2="${by-37}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+20}" y1="${by-42}" x2="${cx+23}" y2="${by-42}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-34}" x2="${cx+20}" y2="${by-51}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
        <line x1="${cx+23}" y1="${by-34}" x2="${cx+21}" y2="${by-51}" stroke="${GOLD_L}" stroke-width="0.7" opacity="0.65"/>
      `;
    case 'violin':
      return `
        <line x1="${cx+4}" y1="${by-29}" x2="${cx+15}" y2="${by-31}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <!-- Violin body — hourglass -->
        <path d="M${cx+14},${by-18} C${cx+10},${by-21} ${cx+10},${by-28} ${cx+14},${by-30} C${cx+18},${by-27} ${cx+28},${by-27} ${cx+30},${by-30} C${cx+34},${by-28} ${cx+34},${by-21} ${cx+30},${by-18} C${cx+28},${by-16} ${cx+18},${by-16} ${cx+14},${by-18}" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="0.8"/>
        <ellipse cx="${cx+19}" cy="${by-25}" rx="3" ry="4" fill="rgba(255,248,120,0.3)"/>
        <!-- f-holes -->
        <path d="M${cx+18},${by-24} L${cx+17},${by-21}" stroke="${GOLD_D}" stroke-width="0.9"/>
        <path d="M${cx+26},${by-24} L${cx+27},${by-21}" stroke="${GOLD_D}" stroke-width="0.9"/>
        <!-- Neck -->
        <line x1="${cx+22}" y1="${by-30}" x2="${cx+20}" y2="${by-48}" stroke="${GOLD_D}" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Bow -->
        <line x1="${cx+30}" y1="${by-19}" x2="${cx+38}" y2="${by-49}" stroke="${GOLD_D}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M${cx+30},${by-19} Q${cx+35},${by-34} ${cx+38},${by-49}" stroke="rgba(255,248,150,0.65)" stroke-width="0.8" fill="none"/>
      `;
    default:
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-18}" y2="${by-40}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+18}" y2="${by-40}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
      `;
  }
}

function buildSVG() {
  const container = document.getElementById('marygoldSvgWrap');
  if (!container) return;

  const arms = [
    { y: 158, lx: 82,  rx: 518 },
    { y: 283, lx: 72,  rx: 528 },
    { y: 415, lx: 82,  rx: 518 },
  ];
  const instruments = [
    ['cymbals',     'violin'],
    ['guitar-left', 'guitar'],
    ['guitar-left', 'mandolin'],
  ];

  const colW    = [36, 52, 64];
  const armFromL = colW.map(w => CX - w / 2);
  const armFromR = colW.map(w => CX + w / 2);

  let armsSVG = '', platformsSVG = '', figurinesSVG = '';

  arms.forEach(({ y, lx, rx }, i) => {
    const platformTop  = y - 14;
    const drumTop      = platformTop - 24;
    const figurineBase = drumTop;

    armsSVG += `
      <g class="mg-arm mg-arm-l" style="transform-origin:${armFromL[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="#A0A4A8" stroke-width="6" stroke-linecap="round"/>
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-linecap="round"/>
      </g>`;
    armsSVG += `
      <g class="mg-arm mg-arm-r" style="transform-origin:${armFromR[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="#A0A4A8" stroke-width="6" stroke-linecap="round"/>
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-linecap="round"/>
      </g>`;

    [lx, rx].forEach((cx, side) => {
      const delay = 0.5 + i*0.18 + side*0.1;
      platformsSVG += `
        <g class="mg-platform" style="animation-delay:${delay}s">
          ${platform(cx, platformTop)}
          ${drum(cx, drumTop)}
        </g>`;
      figurinesSVG += `
        <g class="mg-cherub" style="animation-delay:${delay + 0.2}s">
          ${cherub(cx, figurineBase, instruments[i][side])}
        </g>`;
    });
  });

  const svg = `
  <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" class="mg-svg" role="img" aria-label="Marygold Clock">
    <defs>
      <radialGradient id="mgGoldDisc" cx="38%" cy="28%" r="68%">
        <stop offset="0%"   stop-color="#FFE47A"/>
        <stop offset="60%"  stop-color="#C8980A"/>
        <stop offset="100%" stop-color="#9A700A"/>
      </radialGradient>
      <linearGradient id="mgFigGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#FFE47A"/>
        <stop offset="45%"  stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="#8B6914"/>
      </linearGradient>
      <filter id="mgGlow">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- ── Gold disc (top) ── -->
    <g class="mg-disc">
      <ellipse cx="${CX}" cy="68" rx="115" ry="26" fill="${GOLD_D}" filter="url(#mgGlow)"/>
      <ellipse cx="${CX}" cy="64" rx="110" ry="22" fill="url(#mgGoldDisc)"/>
      <ellipse cx="${CX}" cy="60" rx="88"  ry="13" fill="none" stroke="rgba(255,240,140,0.5)" stroke-width="2"/>
      <ellipse cx="${CX}" cy="68" rx="110" ry="22" fill="none" stroke="${GOLD_D}" stroke-width="2"/>
      <ellipse cx="${CX}" cy="68" rx="100" ry="18" fill="none" stroke="rgba(255,220,80,0.4)" stroke-width="1"/>
    </g>
    <rect x="${CX-10}" y="68" width="20" height="28" rx="3" fill="#A88020"/>

    <!-- ── Column ── -->
    ${col(0,  96,  36,  95, '#C4AE7E')}
    ${ring(189, 46, 8)}
    ${col(0, 197,  52, 140, '#C4AE7E')}
    ${ring(335, 62, 8)}
    ${col(0, 343,  68, 120, '#C4AE7E')}
    ${ring(461, 76, 8)}
    ${col(0, 469,  84,  78, '#B8A26E')}

    <!-- silver base cylinder -->
    <ellipse cx="${CX}" cy="547" rx="54" ry="16" fill="#A0A4A8"/>
    <rect x="${CX-54}" y="547" width="108" height="44" rx="4" fill="#909498"/>
    <ellipse cx="${CX}" cy="591" rx="54" ry="16" fill="#707478"/>
    <line x1="${CX-54}" y1="555" x2="${CX+54}" y2="555" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>

    <!-- column highlight -->
    <rect x="${CX-5}" y="96" width="6" height="495" rx="2" fill="rgba(255,255,255,0.1)" pointer-events="none"/>

    <!-- ── Rotating carousel group ── -->
    <g id="mgArmsGroup">
      ${armsSVG}
      ${platformsSVG}
      ${figurinesSVG}
    </g>
  </svg>`;

  container.innerHTML = svg;
}
