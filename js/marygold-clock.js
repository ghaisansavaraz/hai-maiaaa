// marygold-clock.js — Marygold Clock modal experience

let mgAudio = null;
let mgOpen = false;

export function initMaryGoldClock() {
  const clock = document.getElementById('valentineAnalogClock');
  if (!clock) return;
  clock.style.cursor = 'pointer';
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
    mgAudio = new Audio('assets/Marygold Clock/Plaza Senayan Marygold Clock Song.mp3');
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

// Valentine clock palette — mirrors the analog clock's exact colours
const PINK   = 'rgba(232,160,191,0.95)';
const PINK_D = 'rgba(175,105,140,0.88)';
const PINK_L = 'rgba(255,215,230,0.92)';
const DARK   = 'rgba(22,8,18,0.88)';
const RIM    = 'rgba(232,160,191,0.55)';

function col(x, y, w, h) {
  return `<rect x="${CX - w / 2 + x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${DARK}" stroke="${RIM}" stroke-width="0.8"/>`;
}

function ring(y, w, h) {
  return `<rect x="${CX - w / 2}" y="${y}" width="${w}" height="${h}" rx="2" fill="${RIM}"/>`;
}

function platform(cx, yTop) {
  const h = 26;
  return `
    <ellipse cx="${cx}" cy="${yTop}" rx="27" ry="8" fill="${DARK}" stroke="${RIM}" stroke-width="1.2"/>
    <rect x="${cx-27}" y="${yTop}" width="54" height="${h}" fill="${DARK}" stroke="${RIM}" stroke-width="1"/>
    <ellipse cx="${cx}" cy="${yTop+h}" rx="27" ry="8" fill="${DARK}" stroke="${RIM}" stroke-width="1"/>
    <line x1="${cx-27}" y1="${yTop+8}" x2="${cx+27}" y2="${yTop+8}" stroke="${PINK}" stroke-width="0.8" opacity="0.4"/>
  `;
}

function drum(cx, yTop) {
  const h = 22;
  return `
    <ellipse cx="${cx}" cy="${yTop}" rx="22" ry="7" fill="${DARK}" stroke="${RIM}" stroke-width="1.2"/>
    <rect x="${cx-22}" y="${yTop}" width="44" height="${h}" fill="${DARK}" stroke="${RIM}" stroke-width="0.8"/>
    <ellipse cx="${cx}" cy="${yTop+h}" rx="22" ry="7" fill="${DARK}" stroke="${RIM}" stroke-width="1"/>
    <line x1="${cx-22}" y1="${yTop+7}"  x2="${cx+22}" y2="${yTop+7}"  stroke="${PINK}" stroke-width="2.5" opacity="0.7"/>
    <line x1="${cx-22}" y1="${yTop+15}" x2="${cx+22}" y2="${yTop+15}" stroke="${PINK}" stroke-width="2.5" opacity="0.7"/>
  `;
}

// Winged, robed figurine — no face
function cherub(cx, by, instrument) {
  return `
    <g class="mg-figurine">
      <!-- Wings -->
      <path d="M${cx},${by-30} C${cx-28},${by-46} ${cx-42},${by-22} ${cx-18},${by-16}" fill="${PINK_D}" opacity="0.6"/>
      <path d="M${cx},${by-30} C${cx+28},${by-46} ${cx+42},${by-22} ${cx+18},${by-16}" fill="${PINK_D}" opacity="0.6"/>
      <path d="M${cx-2},${by-30} C${cx-20},${by-43} ${cx-30},${by-24} ${cx-14},${by-19}" fill="none" stroke="${PINK_L}" stroke-width="1.2" opacity="0.5"/>
      <path d="M${cx+2},${by-30} C${cx+20},${by-43} ${cx+30},${by-24} ${cx+14},${by-19}" fill="none" stroke="${PINK_L}" stroke-width="1.2" opacity="0.5"/>
      <!-- Robe / lap -->
      <ellipse cx="${cx}" cy="${by-9}" rx="15" ry="11" fill="url(#mgFigPink)"/>
      <ellipse cx="${cx}" cy="${by}"   rx="11" ry="4"  fill="rgba(0,0,0,0.14)"/>
      <line x1="${cx-8}" y1="${by}"   x2="${cx-5}" y2="${by-18}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx}"   y1="${by}"   x2="${cx}"   y2="${by-20}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx+8}" y1="${by}"   x2="${cx+5}" y2="${by-18}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Torso -->
      <ellipse cx="${cx}" cy="${by-28}" rx="11" ry="13" fill="url(#mgFigPink)"/>
      <ellipse cx="${cx-3}" cy="${by-32}" rx="4" ry="5" fill="rgba(255,215,230,0.22)"/>
      <!-- Neck -->
      <rect x="${cx-4}" y="${by-43}" width="8" height="7" rx="3" fill="${PINK}"/>
      <!-- Head — smooth, no features -->
      <circle cx="${cx}" cy="${by-54}" r="13" fill="url(#mgFigPink)"/>
      <ellipse cx="${cx-3}" cy="${by-59}" rx="6" ry="5" fill="rgba(255,215,230,0.22)"/>
      <!-- Hair only (no face beneath) -->
      <path d="M${cx-12},${by-60} C${cx-15},${by-71} ${cx-6},${by-72} ${cx-4},${by-65}" stroke="${PINK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx-4},${by-66} C${cx-2},${by-73} ${cx+4},${by-73} ${cx+4},${by-66}" stroke="${PINK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx+4},${by-66} C${cx+6},${by-71} ${cx+15},${by-71} ${cx+12},${by-60}" stroke="${PINK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      ${instrumentSVG(cx, by, instrument)}
    </g>`;
}

function instrumentSVG(cx, by, type) {
  switch (type) {
    case 'cymbals':
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-22}" y2="${by-40}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+22}" y2="${by-40}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx-24}" cy="${by-42}" rx="14" ry="5" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="1" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx-24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,215,230,0.35)" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="14" ry="5" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="1" transform="rotate(25,${cx+24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,215,230,0.35)" transform="rotate(25,${cx+24},${by-42})"/>
      `;
    case 'guitar':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-30}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="5"  ry="7"  fill="${PINK_D}"/>
        <circle  cx="${cx+23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.3)"/>
        <line x1="${cx+23}" y1="${by-39}" x2="${cx+21}" y2="${by-57}" stroke="${PINK_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx+21}" y1="${by-43}" x2="${cx+24}" y2="${by-43}" stroke="${PINK_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-48}" x2="${cx+24}" y2="${by-48}" stroke="${PINK_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-53}" x2="${cx+24}" y2="${by-53}" stroke="${PINK_L}" stroke-width="0.9"/>
      `;
    case 'guitar-left':
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-14}" y2="${by-30}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="1.2"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="5"  ry="7"  fill="${PINK_D}"/>
        <circle  cx="${cx-23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.3)"/>
        <line x1="${cx-23}" y1="${by-39}" x2="${cx-21}" y2="${by-57}" stroke="${PINK_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx-21}" y1="${by-43}" x2="${cx-24}" y2="${by-43}" stroke="${PINK_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-48}" x2="${cx-24}" y2="${by-48}" stroke="${PINK_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-53}" x2="${cx-24}" y2="${by-53}" stroke="${PINK_L}" stroke-width="0.9"/>
      `;
    case 'mandolin':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-27}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="9" ry="12" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="4" ry="6"  fill="${PINK_D}"/>
        <circle  cx="${cx+22}" cy="${by-23}" r="2"  fill="rgba(0,0,0,0.3)"/>
        <line x1="${cx+22}" y1="${by-34}" x2="${cx+20}" y2="${by-51}" stroke="${PINK_D}" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx+20}" y1="${by-37}" x2="${cx+23}" y2="${by-37}" stroke="${PINK_L}" stroke-width="0.9"/>
        <line x1="${cx+20}" y1="${by-42}" x2="${cx+23}" y2="${by-42}" stroke="${PINK_L}" stroke-width="0.9"/>
      `;
    case 'violin':
      return `
        <line x1="${cx+4}" y1="${by-29}" x2="${cx+15}" y2="${by-31}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${cx+14},${by-18} C${cx+10},${by-21} ${cx+10},${by-28} ${cx+14},${by-30} C${cx+18},${by-27} ${cx+28},${by-27} ${cx+30},${by-30} C${cx+34},${by-28} ${cx+34},${by-21} ${cx+30},${by-18} C${cx+28},${by-16} ${cx+18},${by-16} ${cx+14},${by-18}" fill="url(#mgFigPink)" stroke="${PINK_D}" stroke-width="0.8"/>
        <ellipse cx="${cx+19}" cy="${by-25}" rx="3" ry="4" fill="rgba(255,215,230,0.28)"/>
        <line x1="${cx+22}" y1="${by-30}" x2="${cx+20}" y2="${by-48}" stroke="${PINK_D}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="${cx+30}" y1="${by-19}" x2="${cx+38}" y2="${by-49}" stroke="${PINK_D}" stroke-width="1.8" stroke-linecap="round"/>
      `;
    default:
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-18}" y2="${by-40}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+18}" y2="${by-40}" stroke="${PINK}" stroke-width="4" stroke-linecap="round"/>
      `;
  }
}

// Small diamond ornament — mirrors the Valentine clock's quarter marks
function diamond(cx, cy, size) {
  return `<polygon points="${cx},${cy-size} ${cx+size*0.5},${cy} ${cx},${cy+size} ${cx-size*0.5},${cy}" fill="${RIM}" opacity="0.8"/>`;
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
    const drumTop      = platformTop - 22;
    const figurineBase = drumTop;

    // Arm lines — pink tinted like clock hands
    armsSVG += `
      <g class="mg-arm mg-arm-l" style="transform-origin:${armFromL[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="${PINK_D}" stroke-width="5" stroke-linecap="round"/>
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="${PINK_L}" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/>
      </g>`;
    armsSVG += `
      <g class="mg-arm mg-arm-r" style="transform-origin:${armFromR[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="${PINK_D}" stroke-width="5" stroke-linecap="round"/>
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="${PINK_L}" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/>
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

  // Diamond ornaments on column at arm-junction rings — mirrors clock ornaments
  const colDiamonds = arms.map(({ y }) => diamond(CX, y, 7)).join('');

  const svg = `
  <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" class="mg-svg" role="img" aria-label="Marygold Clock">
    <defs>
      <radialGradient id="mgDiscGrad" cx="38%" cy="28%" r="68%">
        <stop offset="0%"   stop-color="rgba(255,215,230,0.95)"/>
        <stop offset="55%"  stop-color="rgba(232,160,191,0.85)"/>
        <stop offset="100%" stop-color="rgba(140,70,110,0.7)"/>
      </radialGradient>
      <linearGradient id="mgFigPink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="rgba(255,215,230,0.95)"/>
        <stop offset="50%"  stop-color="rgba(232,160,191,0.9)"/>
        <stop offset="100%" stop-color="rgba(140,70,110,0.82)"/>
      </linearGradient>
      <filter id="mgGlow">
        <feGaussianBlur stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="mgGlowSm">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- ── Disc (top) — rose-pink like clock face rim ── -->
    <g class="mg-disc">
      <ellipse cx="${CX}" cy="68" rx="112" ry="25" fill="${PINK_D}" filter="url(#mgGlow)" opacity="0.55"/>
      <ellipse cx="${CX}" cy="64" rx="108" ry="21" fill="url(#mgDiscGrad)"/>
      <ellipse cx="${CX}" cy="60" rx="86"  ry="12" fill="none" stroke="${PINK_L}" stroke-width="1.5" opacity="0.5"/>
      <ellipse cx="${CX}" cy="68" rx="108" ry="21" fill="none" stroke="${RIM}"    stroke-width="2"/>
      <ellipse cx="${CX}" cy="68" rx="97"  ry="17" fill="none" stroke="${PINK}"   stroke-width="0.8" opacity="0.4"/>
    </g>
    <rect x="${CX-9}" y="68" width="18" height="26" rx="3" fill="${PINK_D}" opacity="0.7"/>

    <!-- ── Column ── -->
    ${col(0,  96, 36,  95)}
    ${ring(189, 48, 7)}
    ${col(0, 197, 52, 140)}
    ${ring(335, 63, 7)}
    ${col(0, 343, 68, 120)}
    ${ring(461, 77, 7)}
    ${col(0, 469, 84,  78)}

    <!-- column inner highlight -->
    <rect x="${CX-4}" y="96" width="5" height="451" rx="2" fill="rgba(255,215,230,0.07)" pointer-events="none"/>

    <!-- base cylinder -->
    <ellipse cx="${CX}" cy="547" rx="52" ry="15" fill="${DARK}" stroke="${RIM}" stroke-width="1.2"/>
    <rect x="${CX-52}" y="547" width="104" height="42" rx="3" fill="${DARK}" stroke="${RIM}" stroke-width="1"/>
    <ellipse cx="${CX}" cy="589" rx="52" ry="15" fill="${DARK}" stroke="${RIM}" stroke-width="1"/>
    <line x1="${CX-52}" y1="555" x2="${CX+52}" y2="555" stroke="${PINK}" stroke-width="1" opacity="0.3"/>

    <!-- Diamond ornaments at ring junctions — same as clock quarter marks -->
    ${colDiamonds}

    <!-- ── Rotating arms group ── -->
    <g id="mgArmsGroup">
      ${armsSVG}
      ${platformsSVG}
      ${figurinesSVG}
    </g>
  </svg>`;

  container.innerHTML = svg;
}
