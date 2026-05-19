// marygold-clock.js — Marygold Clock modal experience

let mgAudio          = null;
let mgOpen           = false;
let mgClockOrigStyle = '';

// Where the real Valentine clock sits in the tower SVG (SVG units, viewBox 600×700)
const CX     = 300;
const CLK_CY = 145;   // clock center Y
const CLK_R  = 76;    // clock radius  (~matches the 140px rendered size at full width)

const GOLD   = '#D4A820';
const GOLD_D = '#B8860B';
const GOLD_L = '#F0C030';
const COL_BG = '#C4AE7E';

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
  // Two rAF frames to let the modal fade in and SVG lay out before measuring
  requestAnimationFrame(() => requestAnimationFrame(positionRealClock));

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
  restoreRealClock();
  if (mgAudio) { mgAudio.pause(); mgAudio.currentTime = 0; }
}

// Lift the actual Valentine clock SVG out of its flow position and
// overlay it exactly on the tower's clock-face slot.
function positionRealClock() {
  const wrap    = document.getElementById('marygoldSvgWrap');
  const clockEl = document.getElementById('valentineAnalogClock');
  if (!wrap || !clockEl) return;

  const rect      = wrap.getBoundingClientRect();
  const scale     = rect.width / 600;          // SVG viewBox width = 600
  const clockSize = CLK_R * 2 * scale;         // rendered diameter in px
  const screenX   = rect.left + CX     * scale;
  const screenY   = rect.top  + CLK_CY * scale;

  mgClockOrigStyle = clockEl.getAttribute('style') || '';

  Object.assign(clockEl.style, {
    position:     'fixed',
    left:         `${(screenX - clockSize / 2).toFixed(1)}px`,
    top:          `${(screenY - clockSize / 2).toFixed(1)}px`,
    width:        `${clockSize.toFixed(1)}px`,
    height:       `${clockSize.toFixed(1)}px`,
    zIndex:       '100001',
    cursor:       'pointer',
    transition:   'none',
    flexShrink:   '0',
    filter:       'drop-shadow(0 0 16px rgba(212,168,32,0.55))',
  });
}

function restoreRealClock() {
  const clockEl = document.getElementById('valentineAnalogClock');
  if (!clockEl) return;
  if (mgClockOrigStyle) {
    clockEl.setAttribute('style', mgClockOrigStyle);
  } else {
    clockEl.removeAttribute('style');
  }
}

// ── SVG builder ───────────────────────────────────────────────────────────────

function col(x, y, w, h, fill = COL_BG) {
  return `<rect x="${CX - w/2 + x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="rgba(160,130,60,0.25)" stroke-width="0.8"/>`;
}

function ring(y, w, h) {
  return `<rect x="${CX - w/2}" y="${y}" width="${w}" height="${h}" rx="2" fill="${GOLD_D}"/>`;
}

function platform(cx, yTop) {
  const h = 28;
  return `
    <ellipse cx="${cx}" cy="${yTop}"   rx="28" ry="9"  fill="#B8BCBF"/>
    <rect    x="${cx-28}" y="${yTop}"  width="56" height="${h}" fill="#9A9EA2"/>
    <ellipse cx="${cx}" cy="${yTop+h}" rx="28" ry="9"  fill="#78797C"/>
    <line x1="${cx-28}" y1="${yTop+9}"  x2="${cx+28}" y2="${yTop+9}"  stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
    <line x1="${cx-28}" y1="${yTop+19}" x2="${cx+28}" y2="${yTop+19}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
  `;
}

function drum(cx, yTop) {
  const h = 24;
  return `
    <ellipse cx="${cx}" cy="${yTop}"   rx="24" ry="8"  fill="#26A69A"/>
    <rect    x="${cx-24}" y="${yTop}"  width="48" height="${h}" fill="#1A9880"/>
    <ellipse cx="${cx}" cy="${yTop+h}" rx="24" ry="8"  fill="#13796A"/>
    <line x1="${cx-24}" y1="${yTop+7}"  x2="${cx+24}" y2="${yTop+7}"  stroke="#E53935" stroke-width="3.5"/>
    <line x1="${cx-24}" y1="${yTop+17}" x2="${cx+24}" y2="${yTop+17}" stroke="#E53935" stroke-width="3.5"/>
  `;
}

// Gold cherub — winged, robed, NO face
function cherub(cx, by, instrument) {
  return `
    <g class="mg-figurine">
      <path d="M${cx},${by-30} C${cx-28},${by-46} ${cx-42},${by-22} ${cx-18},${by-16}" fill="${GOLD_D}" opacity="0.7"/>
      <path d="M${cx},${by-30} C${cx+28},${by-46} ${cx+42},${by-22} ${cx+18},${by-16}" fill="${GOLD_D}" opacity="0.7"/>
      <path d="M${cx-2},${by-30} C${cx-20},${by-43} ${cx-30},${by-24} ${cx-14},${by-19}" fill="none" stroke="${GOLD_L}" stroke-width="1.2" opacity="0.5"/>
      <path d="M${cx+2},${by-30} C${cx+20},${by-43} ${cx+30},${by-24} ${cx+14},${by-19}" fill="none" stroke="${GOLD_L}" stroke-width="1.2" opacity="0.5"/>
      <ellipse cx="${cx}" cy="${by-9}"  rx="15" ry="11" fill="url(#mgFigGold)"/>
      <ellipse cx="${cx}" cy="${by}"    rx="11" ry="4"  fill="rgba(0,0,0,0.14)"/>
      <line x1="${cx-8}" y1="${by}" x2="${cx-5}" y2="${by-18}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx}"   y1="${by}" x2="${cx}"   y2="${by-20}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${cx+8}" y1="${by}" x2="${cx+5}" y2="${by-18}" stroke="rgba(0,0,0,0.16)" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${by-28}" rx="11" ry="13" fill="url(#mgFigGold)"/>
      <ellipse cx="${cx-3}" cy="${by-32}" rx="4" ry="5" fill="rgba(255,240,140,0.25)"/>
      <rect x="${cx-4}" y="${by-43}" width="8" height="7" rx="3" fill="${GOLD}"/>
      <circle cx="${cx}" cy="${by-54}" r="13" fill="url(#mgFigGold)"/>
      <ellipse cx="${cx-3}" cy="${by-59}" rx="6" ry="5" fill="rgba(255,240,140,0.22)"/>
      <path d="M${cx-12},${by-60} C${cx-15},${by-71} ${cx-6},${by-72} ${cx-4},${by-65}"  stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx-4},${by-66}  C${cx-2},${by-73}  ${cx+4},${by-73}  ${cx+4},${by-66}" stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${cx+4},${by-66}  C${cx+6},${by-71}  ${cx+15},${by-71} ${cx+12},${by-60}" stroke="${GOLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
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
        <ellipse cx="${cx-24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,240,140,0.38)" transform="rotate(-25,${cx-24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="14" ry="5" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1" transform="rotate(25,${cx+24},${by-42})"/>
        <ellipse cx="${cx+24}" cy="${by-42}" rx="8"  ry="3" fill="rgba(255,240,140,0.38)" transform="rotate(25,${cx+24},${by-42})"/>
      `;
    case 'guitar':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-30}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+23}" cy="${by-26}" rx="5"  ry="7"  fill="${GOLD_D}"/>
        <circle  cx="${cx+23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.35)"/>
        <line x1="${cx+23}" y1="${by-39}" x2="${cx+21}" y2="${by-57}" stroke="${GOLD_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx+21}" y1="${by-43}" x2="${cx+24}" y2="${by-43}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-48}" x2="${cx+24}" y2="${by-48}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+21}" y1="${by-53}" x2="${cx+24}" y2="${by-53}" stroke="${GOLD_L}" stroke-width="0.9"/>
      `;
    case 'guitar-left':
      return `
        <line x1="${cx-4}" y1="${by-28}" x2="${cx-14}" y2="${by-30}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="10" ry="14" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx-23}" cy="${by-26}" rx="5"  ry="7"  fill="${GOLD_D}"/>
        <circle  cx="${cx-23}" cy="${by-26}" r="2.5" fill="rgba(0,0,0,0.35)"/>
        <line x1="${cx-23}" y1="${by-39}" x2="${cx-21}" y2="${by-57}" stroke="${GOLD_D}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="${cx-21}" y1="${by-43}" x2="${cx-24}" y2="${by-43}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-48}" x2="${cx-24}" y2="${by-48}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-21}" y1="${by-53}" x2="${cx-24}" y2="${by-53}" stroke="${GOLD_L}" stroke-width="0.9"/>
      `;
    case 'mandolin':
      return `
        <line x1="${cx+4}" y1="${by-28}" x2="${cx+14}" y2="${by-27}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="9" ry="12" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+22}" cy="${by-23}" rx="4" ry="6"  fill="${GOLD_D}"/>
        <circle  cx="${cx+22}" cy="${by-23}" r="2"  fill="rgba(0,0,0,0.35)"/>
        <line x1="${cx+22}" y1="${by-34}" x2="${cx+20}" y2="${by-51}" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx+20}" y1="${by-37}" x2="${cx+23}" y2="${by-37}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+20}" y1="${by-42}" x2="${cx+23}" y2="${by-42}" stroke="${GOLD_L}" stroke-width="0.9"/>
      `;
    case 'violin':
      return `
        <line x1="${cx+4}" y1="${by-29}" x2="${cx+15}" y2="${by-31}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <path d="M${cx+14},${by-18} C${cx+10},${by-21} ${cx+10},${by-28} ${cx+14},${by-30} C${cx+18},${by-27} ${cx+28},${by-27} ${cx+30},${by-30} C${cx+34},${by-28} ${cx+34},${by-21} ${cx+30},${by-18} C${cx+28},${by-16} ${cx+18},${by-16} ${cx+14},${by-18}" fill="url(#mgFigGold)" stroke="${GOLD_D}" stroke-width="0.8"/>
        <ellipse cx="${cx+19}" cy="${by-25}" rx="3" ry="4" fill="rgba(255,240,140,0.3)"/>
        <line x1="${cx+22}" y1="${by-30}" x2="${cx+20}" y2="${by-48}" stroke="${GOLD_D}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="${cx+30}" y1="${by-19}" x2="${cx+38}" y2="${by-49}" stroke="${GOLD_D}" stroke-width="1.8" stroke-linecap="round"/>
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
    { y: 290, lx: 82,  rx: 518 },
    { y: 420, lx: 72,  rx: 528 },
    { y: 548, lx: 82,  rx: 518 },
  ];
  const instruments = [
    ['cymbals',     'violin'],
    ['guitar-left', 'guitar'],
    ['guitar-left', 'mandolin'],
  ];
  const colW     = [52, 66, 80];
  const armFromL = colW.map(w => CX - w / 2);
  const armFromR = colW.map(w => CX + w / 2);

  let armsSVG = '', platformsSVG = '', figurinesSVG = '';

  arms.forEach(({ y, lx, rx }, i) => {
    const platformTop  = y - 14;
    const drumTop      = platformTop - 24;
    const figurineBase = drumTop;

    armsSVG += `
      <g class="mg-arm mg-arm-l" style="transform-origin:${armFromL[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="#A8ADB0" stroke-width="6" stroke-linecap="round"/>
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round"/>
      </g>`;
    armsSVG += `
      <g class="mg-arm mg-arm-r" style="transform-origin:${armFromR[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="#A8ADB0" stroke-width="6" stroke-linecap="round"/>
        <line x1="${armFromR[i]}" y1="${y}" x2="${rx}" y2="${y}" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round"/>
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
        <stop offset="0%"   stop-color="#FFE87A"/>
        <stop offset="55%"  stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="${GOLD_D}"/>
      </radialGradient>
      <linearGradient id="mgFigGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#FFE880"/>
        <stop offset="45%"  stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="#8B6200"/>
      </linearGradient>
      <filter id="mgGlow">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- ── Spinning gold disc at very top ── -->
    <g class="mg-disc">
      <ellipse cx="${CX}" cy="28" rx="115" ry="26" fill="${GOLD_D}" filter="url(#mgGlow)" opacity="0.6"/>
      <ellipse cx="${CX}" cy="24" rx="110" ry="22" fill="url(#mgGoldDisc)"/>
      <ellipse cx="${CX}" cy="20" rx="88"  ry="13" fill="none" stroke="rgba(255,240,130,0.5)" stroke-width="2"/>
      <ellipse cx="${CX}" cy="28" rx="110" ry="22" fill="none" stroke="${GOLD_D}" stroke-width="2"/>
    </g>

    <!-- Post from disc down to clock -->
    <rect x="${CX-9}" y="28" width="18" height="${CLK_CY - CLK_R - 28}" rx="4" fill="${GOLD_D}" opacity="0.85"/>

    <!-- Clock slot — column passes behind, gold bezel ring frames the real clock -->
    <!-- The Valentine clock SVG is positioned here by JS at z-index 100001  -->
    <circle cx="${CX}" cy="${CLK_CY}" r="${CLK_R + 10}" fill="${COL_BG}" stroke="${GOLD_D}" stroke-width="2"/>
    <circle cx="${CX}" cy="${CLK_CY}" r="${CLK_R + 5}"  fill="none" stroke="${GOLD}"   stroke-width="5"/>
    <circle cx="${CX}" cy="${CLK_CY}" r="${CLK_R + 1}"  fill="none" stroke="${GOLD_D}" stroke-width="2"/>

    <!-- Post from clock down to column -->
    <rect x="${CX-9}" y="${CLK_CY + CLK_R}" width="18" height="16" rx="3" fill="${GOLD_D}" opacity="0.8"/>

    <!-- ── Column below clock ── -->
    ${col(0, CLK_CY + CLK_R + 14,  50, 90)}
    ${ring(CLK_CY + CLK_R + 102,   60, 8)}
    ${col(0, CLK_CY + CLK_R + 110, 60, 118)}
    ${ring(CLK_CY + CLK_R + 226,   72, 8)}
    ${col(0, CLK_CY + CLK_R + 234, 74, 114)}
    ${ring(CLK_CY + CLK_R + 346,   84, 8)}
    ${col(0, CLK_CY + CLK_R + 354, 86,  70)}

    <!-- column highlight strip -->
    <rect x="${CX-4}" y="${CLK_CY + CLK_R + 14}" width="5" height="410" rx="2" fill="rgba(255,255,255,0.08)" pointer-events="none"/>

    <!-- silver base cylinder -->
    <ellipse cx="${CX}" cy="638" rx="56" ry="16" fill="#B0B4B8"/>
    <rect x="${CX-56}" y="638" width="112" height="44" rx="4" fill="#969A9E"/>
    <ellipse cx="${CX}" cy="682" rx="56" ry="16" fill="#74787C"/>
    <line x1="${CX-56}" y1="646" x2="${CX+56}" y2="646" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>

    <!-- ── Rotating arms + figurines ── -->
    <g id="mgArmsGroup">
      ${armsSVG}
      ${platformsSVG}
      ${figurinesSVG}
    </g>
  </svg>`;

  container.innerHTML = svg;
}
