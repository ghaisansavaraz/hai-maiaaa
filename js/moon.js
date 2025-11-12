/* Moon Phase - Jakarta (Asia/Jakarta, UTC+7) */
import { debugLog, debugError } from './config.js';

const SYNODIC_MONTH = 29.53058867; // days
// Reference new moon: 2000-01-06 18:14 UTC
const REF_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0, 0);

function getJakartaDate() {
  try {
    const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    return new Date(s);
  } catch {
    return new Date();
  }
}

function phaseFraction(date) {
  const t = date.getTime();
  const daysSince = (t - REF_NEW_MOON_UTC) / 86400000;
  let phase = (daysSince % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (phase < 0) phase += 1;
  return phase; // 0..1 (0 new, 0.5 full)
}

function illuminationFromPhase(phase) {
  // 0..1 using simple model
  return 0.5 * (1 - Math.cos(2 * Math.PI * phase));
}

function phaseName(phase) {
  const p = phase;
  if (p < 0.03 || p > 0.97) return 'New Moon';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Quarter';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p < 0.53) return 'Full Moon';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function buildMoonSVG(phase) {
  const illum = illuminationFromPhase(phase); // 0..1
  const waxing = phase < 0.5;
  // Geometry
  const size = 72;
  const r = size / 2;
  const cx = 50, cy = 50;
  // Ellipse width maps to illumination, min thickness for near-new
  const minRx = 4;
  const rx = Math.max(minRx, r * illum);
  // Shift ellipse toward lit limb
  const shift = (1 - illum) * (r * 0.6);
  const ellCx = waxing ? cx + shift : cx - shift;

  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="moon-svg" role="img" aria-label="Moon">
  <defs>
    <radialGradient id="moonBaseGrad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#fafaf7"/>
      <stop offset="35%" stop-color="#f2f2ee"/>
      <stop offset="65%" stop-color="#eaeae7"/>
      <stop offset="100%" stop-color="#e4e4e1"/>
    </radialGradient>
    <clipPath id="moonClip">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
    </clipPath>
  </defs>
  <!-- base -->
  <g filter="">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonBaseGrad)"/>
    <!-- dark glaze on shadowed side -->
    <ellipse cx="${waxing ? cx - r * 0.25 : cx + r * 0.25}" cy="${cy}" rx="${r * 0.95}" ry="${r * 0.95}"
      fill="rgba(14,14,20,0.78)" clip-path="url(#moonClip)"/>
    <!-- illuminated shape -->
    <ellipse cx="${ellCx}" cy="${cy}" rx="${rx}" ry="${r * 0.98}" fill="rgba(255,255,255,0.92)"
      clip-path="url(#moonClip)"/>
    <!-- limb highlight -->
    <ellipse cx="${ellCx}" cy="${cy}" rx="${rx}" ry="${r * 0.98}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"
      clip-path="url(#moonClip)"/>
    <!-- micro craters -->
    <g opacity="0.25" clip-path="url(#moonClip)">
      <circle cx="${cx - r*0.18}" cy="${cy - r*0.12}" r="2.2" fill="rgba(0,0,0,0.12)"/>
      <circle cx="${cx + r*0.10}" cy="${cy + r*0.08}" r="1.6" fill="rgba(0,0,0,0.1)"/>
      <circle cx="${cx - r*0.05}" cy="${cy + r*0.20}" r="1.9" fill="rgba(0,0,0,0.1)"/>
    </g>
  </g>
</svg>
`.trim();
}

export function updateMoonPhase() {
  try {
    const nowJakarta = getJakartaDate();
    const phase = phaseFraction(nowJakarta);
    const name = phaseName(phase);
    const svg = buildMoonSVG(phase);

    const moonContainer = document.getElementById('moonTopRight');
    if (moonContainer) {
      moonContainer.innerHTML = svg;
    }

    const nameSpan = document.getElementById('moonPhaseName');
    if (nameSpan) {
      // Crossfade text when it changes
      if (nameSpan.textContent !== name) {
        nameSpan.style.opacity = '0';
        setTimeout(() => {
          nameSpan.textContent = name;
          nameSpan.style.opacity = '1';
        }, 120);
      }
    }
    debugLog(`Moon phase updated: ${name} (phase=${phase.toFixed(3)})`);
  } catch (e) {
    debugError('Failed to update moon phase', e);
  }
}

export function initMoon() {
  updateMoonPhase();
  // Update every 15 minutes to keep in sync without excess work
  setInterval(updateMoonPhase, 15 * 60 * 1000);
}


