// marygold-clock.js — Marygold Clock modal experience

let mgAudio = null;
let mgOpen = false;
let mgRafId = null;

export function initMaryGoldClock() {
  const clock = document.getElementById('valentineAnalogClock');
  if (!clock) return;
  clock.style.cursor = 'pointer';
  clock.setAttribute('title', 'Tap to summon the Marygold Clock ✨');
  clock.addEventListener('click', toggleMG);

  const modal = document.getElementById('marygoldModal');
  if (!modal) return;
  modal.addEventListener('click', e => { if (e.target === modal) closeMG(); });
  modal.querySelector('.mg-close')?.addEventListener('click', closeMG);
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
  tickClock();
}

function closeMG() {
  mgOpen = false;
  document.getElementById('marygoldModal')?.classList.remove('open');
  if (mgRafId) { cancelAnimationFrame(mgRafId); mgRafId = null; }
  if (mgAudio) { mgAudio.pause(); mgAudio.currentTime = 0; }
}

function tickClock() {
  function step() {
    if (!mgOpen) return;
    const now = new Date();
    const h = now.getHours() % 12, m = now.getMinutes(),
          s = now.getSeconds() + now.getMilliseconds() / 1000;
    const sDeg = s / 60 * 360;
    const mDeg = m / 60 * 360 + s / 60 * 6;
    const hDeg = h / 12 * 360 + m / 60 * 30;
    document.getElementById('mgH')?.setAttribute('transform', `rotate(${hDeg},300,310)`);
    document.getElementById('mgM')?.setAttribute('transform', `rotate(${mDeg},300,310)`);
    document.getElementById('mgS')?.setAttribute('transform', `rotate(${sDeg},300,310)`);
    mgRafId = requestAnimationFrame(step);
  }
  step();
}

// ── SVG builder ──────────────────────────────────────────────────────────────

const CX = 300;

function col(x, y, w, h, fill) {
  return `<rect x="${CX - w / 2 + x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}"/>`;
}

function ring(y, w, h) {
  return `<rect x="${CX - w / 2}" y="${y}" width="${w}" height="${h}" rx="2" fill="#6B5A38"/>`;
}

// Chrome platform at an arm tip
function platform(cx, yTop) {
  const h = 28;
  return `
    <ellipse cx="${cx}" cy="${yTop}" rx="28" ry="9" fill="#B0B4B8"/>
    <rect x="${cx - 28}" y="${yTop}" width="56" height="${h}" fill="#909498"/>
    <ellipse cx="${cx}" cy="${yTop + h}" rx="28" ry="9" fill="#707478"/>
    <line x1="${cx - 28}" y1="${yTop + 8}" x2="${cx + 28}" y2="${yTop + 8}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  `;
}

// Teal drum that sits on top of chrome platform
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

const GOLD = '#D4A820';
const GOLD_D = '#B8860B';
const GOLD_L = '#F0C030';

// Gold cherub body (seated, facing forward)
function cherub(cx, by, instrument) {
  // by = baseline y (top of drum = feet of cherub)
  const bx = cx;
  return `
    <g class="mg-figurine">
      <!-- legs -->
      <ellipse cx="${bx - 8}" cy="${by - 8}" rx="7" ry="11" fill="${GOLD_D}" transform="rotate(-15,${bx-8},${by-8})"/>
      <ellipse cx="${bx + 8}" cy="${by - 8}" rx="7" ry="11" fill="${GOLD_D}" transform="rotate(15,${bx+8},${by-8})"/>
      <!-- torso -->
      <ellipse cx="${bx}" cy="${by - 26}" rx="13" ry="16" fill="${GOLD}"/>
      <!-- head -->
      <circle cx="${bx}" cy="${by - 48}" r="13" fill="${GOLD}"/>
      <!-- face -->
      <circle cx="${bx - 5}" cy="${by - 50}" r="2" fill="${GOLD_D}"/>
      <circle cx="${bx + 5}" cy="${by - 50}" r="2" fill="${GOLD_D}"/>
      <path d="M${bx-4},${by-43} Q${bx},${by-40} ${bx+4},${by-43}" stroke="${GOLD_D}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- hat brim -->
      <ellipse cx="${bx}" cy="${by - 60}" rx="14" ry="4.5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/>
      <!-- hat crown -->
      <rect x="${bx - 9}" y="${by - 75}" width="18" height="16" rx="2" fill="${GOLD}"/>
      <ellipse cx="${bx}" cy="${by - 75}" rx="9" ry="3" fill="${GOLD_D}"/>
      ${instrumentSVG(bx, by, instrument)}
    </g>`;
}

function instrumentSVG(cx, by, type) {
  switch (type) {
    case 'cymbals':
      return `
        <line x1="${cx}" y1="${by-30}" x2="${cx-22}" y2="${by-42}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${by-30}" x2="${cx+22}" y2="${by-42}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${cx-22}" cy="${by-44}" rx="14" ry="5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5" transform="rotate(-20,${cx-22},${by-44})"/>
        <ellipse cx="${cx+22}" cy="${by-44}" rx="14" ry="5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5" transform="rotate(20,${cx+22},${by-44})"/>
      `;
    case 'guitar':
      return `
        <path d="M${cx+7},${by-28} L${cx+16},${by-28}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${cx+22}" cy="${by-24}" rx="10" ry="13" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+22}" cy="${by-24}" rx="4.5" ry="6" fill="${GOLD_D}"/>
        <line x1="${cx+22}" y1="${by-36}" x2="${cx+21}" y2="${by-54}" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx+20}" y1="${by-36}" x2="${cx+20}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+22}" y1="${by-36}" x2="${cx+22}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx+24}" y1="${by-36}" x2="${cx+24}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
      `;
    case 'guitar-left':
      return `
        <path d="M${cx-7},${by-28} L${cx-16},${by-28}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${cx-22}" cy="${by-24}" rx="10" ry="13" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx-22}" cy="${by-24}" rx="4.5" ry="6" fill="${GOLD_D}"/>
        <line x1="${cx-22}" y1="${by-36}" x2="${cx-21}" y2="${by-54}" stroke="${GOLD_D}" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx-20}" y1="${by-36}" x2="${cx-20}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-22}" y1="${by-36}" x2="${cx-22}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
        <line x1="${cx-24}" y1="${by-36}" x2="${cx-24}" y2="${by-30}" stroke="${GOLD_L}" stroke-width="0.9"/>
      `;
    case 'mandolin':
      return `
        <path d="M${cx+7},${by-28} L${cx+15},${by-26}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${cx+21}" cy="${by-22}" rx="8" ry="11" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/>
        <ellipse cx="${cx+21}" cy="${by-22}" rx="3.5" ry="5" fill="${GOLD_D}"/>
        <line x1="${cx+21}" y1="${by-32}" x2="${cx+20}" y2="${by-48}" stroke="${GOLD_D}" stroke-width="2.5" stroke-linecap="round"/>
      `;
    case 'violin':
      return `
        <path d="M${cx+7},${by-28} L${cx+16},${by-30}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="${cx+20}" cy="${by-28}" rx="7" ry="15" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/>
        <line x1="${cx+20}" y1="${by-42}" x2="${cx+19}" y2="${by-56}" stroke="${GOLD_D}" stroke-width="2" stroke-linecap="round"/>
        <line x1="${cx+28}" y1="${by-20}" x2="${cx+34}" y2="${by-48}" stroke="${GOLD_D}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M${cx+28},${by-20} Q${cx+32},${by-33} ${cx+34},${by-48}" stroke="${GOLD_L}" stroke-width="1" fill="none"/>
      `;
    default:
      return `
        <path d="M${cx-8},${by-28} Q${cx-18},${by-40} ${cx-14},${by-52}" stroke="${GOLD}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M${cx+8},${by-28} Q${cx+18},${by-40} ${cx+14},${by-52}" stroke="${GOLD}" stroke-width="5" fill="none" stroke-linecap="round"/>
      `;
  }
}

// Clock ticks inside the decorative medallion on the column
function clockFace(cx, cy, r) {
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    const x1 = cx + (r - 6) * Math.cos(a), y1 = cy + (r - 6) * Math.sin(a);
    const x2 = cx + r * Math.cos(a),       y2 = cy + r * Math.sin(a);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.7)" stroke-width="${i%3===0?2.5:1.2}" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="${cx}" cy="${cy}" r="${r+4}" fill="none" stroke="${GOLD}" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="${r+2}" fill="none" stroke="${GOLD_D}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(10,5,20,0.72)"/>
    ${ticks}
    <g id="mgH"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r*0.52}" stroke="rgba(255,220,150,0.95)" stroke-width="3.5" stroke-linecap="round"/></g>
    <g id="mgM"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r*0.72}" stroke="rgba(255,220,150,0.88)" stroke-width="2.5" stroke-linecap="round"/></g>
    <g id="mgS"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r*0.85}" stroke="rgba(255,180,180,0.9)" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="4" fill="${GOLD}"/></g>
  `;
}

// Floating musical note
function note(x, y, shape, delay, dur) {
  return `<text x="${x}" y="${y}" class="mg-note" style="animation-delay:${delay}s;animation-duration:${dur}s" font-size="22" fill="${GOLD}" opacity="0.85">${shape}</text>`;
}

function buildSVG() {
  const container = document.getElementById('marygoldSvgWrap');
  if (!container) return;

  // Arm endpoints
  const arms = [
    { y: 158, lx: 82,  rx: 518 },
    { y: 283, lx: 72,  rx: 528 },
    { y: 415, lx: 82,  rx: 518 },
  ];
  const instruments = [
    ['cymbals', 'violin'],
    ['guitar-left', 'guitar'],
    ['guitar-left', 'mandolin'],
  ];

  // Column edges at each arm level
  const colW = [36, 52, 64];
  const armFromL = [CX - colW[0]/2, CX - colW[1]/2, CX - colW[2]/2];
  const armFromR = [CX + colW[0]/2, CX + colW[1]/2, CX + colW[2]/2];

  let armsSVG = '';
  let platformsSVG = '';
  let figurinesSVG = '';

  arms.forEach(({ y, lx, rx }, i) => {
    const chromePlatH = 28, drumH = 24;
    const platformTop = y - 14; // platform center at arm y
    const drumTop = platformTop - drumH;
    const figurineBase = drumTop; // figurine feet at drum top

    // Left arm group (scaleX from right → left)
    armsSVG += `
      <g class="mg-arm mg-arm-l" style="transform-origin:${armFromL[i]}px ${y}px; animation-delay:${0.2 + i*0.15}s">
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="#A0A4A8" stroke-width="6" stroke-linecap="round"/>
        <line x1="${armFromL[i]}" y1="${y}" x2="${lx}" y2="${y}" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-linecap="round"/>
      </g>`;
    // Right arm group
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

  // Musical notes
  const noteShapes = ['♩','♪','♫','♬'];
  let notesSVG = '';
  for (let i = 0; i < 12; i++) {
    const x = 60 + Math.random() * 480;
    const y = 520 + Math.random() * 80;
    const shape = noteShapes[i % 4];
    notesSVG += note(x, y, shape, (Math.random() * 3).toFixed(1), (3 + Math.random() * 2).toFixed(1));
  }

  const svg = `
  <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" class="mg-svg" role="img" aria-label="Marygold Clock">
    <defs>
      <radialGradient id="mgGold" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#FFE066"/>
        <stop offset="55%" stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="${GOLD_D}"/>
      </radialGradient>
      <radialGradient id="mgGoldDisc" cx="38%" cy="28%" r="68%">
        <stop offset="0%" stop-color="#FFE47A"/>
        <stop offset="60%" stop-color="#C8980A"/>
        <stop offset="100%" stop-color="#9A700A"/>
      </radialGradient>
      <filter id="mgGlow">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="mgGlowSm">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- ── Gold disc (top) ── -->
    <g class="mg-disc">
      <ellipse cx="${CX}" cy="68" rx="115" ry="26" fill="${GOLD_D}" filter="url(#mgGlow)"/>
      <ellipse cx="${CX}" cy="64" rx="110" ry="22" fill="url(#mgGoldDisc)"/>
      <ellipse cx="${CX}" cy="60" rx="88"  ry="13" fill="none" stroke="rgba(255,240,140,0.5)" stroke-width="2"/>
      <!-- rim detail rings -->
      <ellipse cx="${CX}" cy="68" rx="110" ry="22" fill="none" stroke="${GOLD_D}" stroke-width="2"/>
      <ellipse cx="${CX}" cy="68" rx="100" ry="18" fill="none" stroke="rgba(255,220,80,0.4)" stroke-width="1"/>
    </g>
    <!-- disc post -->
    <rect x="${CX-10}" y="68" width="20" height="28" rx="3" fill="#A88020"/>

    <!-- ── Column sections ── -->
    <!-- top -->
    ${col(0, 96, 36, 95, '#C4AE7E')}
    ${ring(189, 46, 8)}
    <!-- mid (clock medallion level) -->
    ${col(0, 197, 52, 140, '#C4AE7E')}
    ${ring(335, 62, 8)}
    <!-- lower -->
    ${col(0, 343, 68, 120, '#C4AE7E')}
    ${ring(461, 76, 8)}
    <!-- base -->
    ${col(0, 469, 84, 78, '#B8A26E')}

    <!-- silver base cylinder -->
    <ellipse cx="${CX}" cy="547" rx="54" ry="16" fill="#A0A4A8"/>
    <rect x="${CX-54}" y="547" width="108" height="44" rx="4" fill="#909498"/>
    <ellipse cx="${CX}" cy="591" rx="54" ry="16" fill="#707478"/>
    <line x1="${CX-54}" y1="555" x2="${CX+54}" y2="555" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>

    <!-- column highlight strip -->
    <rect x="${CX-5}" y="96" width="6" height="545" rx="2" fill="rgba(255,255,255,0.1)" pointer-events="none"/>

    <!-- ── Clock medallion on mid column ── -->
    ${clockFace(CX, 310, 42)}

    <!-- ── Arms ── -->
    ${armsSVG}

    <!-- ── Platforms ── -->
    ${platformsSVG}

    <!-- ── Figurines ── -->
    ${figurinesSVG}

    <!-- ── Musical notes ── -->
    <g class="mg-notes">${notesSVG}</g>
  </svg>`;

  container.innerHTML = svg;
}
