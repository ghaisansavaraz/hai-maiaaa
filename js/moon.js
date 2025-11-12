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
  // Geometry - larger and more detailed
  const size = 120;
  const r = size / 2;
  const cx = 50, cy = 50;
  // Ellipse width maps to illumination, min thickness for near-new
  const minRx = 3;
  const rx = Math.max(minRx, r * illum);
  // Shift ellipse toward lit limb
  const shift = (1 - illum) * (r * 0.6);
  const ellCx = waxing ? cx + shift : cx - shift;

  // Crater positions (more realistic distribution)
  const craters = [
    { x: cx - r*0.28, y: cy - r*0.18, r: 3.8, opacity: 0.16 },
    { x: cx + r*0.15, y: cy + r*0.12, r: 2.6, opacity: 0.14 },
    { x: cx - r*0.08, y: cy + r*0.28, r: 3.2, opacity: 0.15 },
    { x: cx + r*0.32, y: cy - r*0.24, r: 2.2, opacity: 0.12 },
    { x: cx - r*0.18, y: cy + r*0.08, r: 1.8, opacity: 0.11 },
    { x: cx + r*0.22, y: cy + r*0.22, r: 2.4, opacity: 0.13 },
    { x: cx - r*0.35, y: cy + r*0.15, r: 3.0, opacity: 0.14 },
    { x: cx + r*0.08, y: cy - r*0.32, r: 2.0, opacity: 0.12 },
    { x: cx - r*0.12, y: cy - r*0.38, r: 2.8, opacity: 0.13 },
  ];

  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="moon-svg" role="img" aria-label="Moon phase: ${phaseName(phase)}">
  <defs>
    <!-- Enhanced base gradient with more depth -->
    <radialGradient id="moonBaseGrad" cx="48%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#fcfcfa"/>
      <stop offset="30%" stop-color="#f4f4f0"/>
      <stop offset="60%" stop-color="#ecece8"/>
      <stop offset="85%" stop-color="#e2e2de"/>
      <stop offset="100%" stop-color="#d8d8d4"/>
    </radialGradient>
    <!-- Subtle texture overlay -->
    <radialGradient id="moonTexture" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.06)"/>
    </radialGradient>
    <!-- Shadow gradient for terminator -->
    <radialGradient id="moonShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(12,12,18,0.65)"/>
      <stop offset="70%" stop-color="rgba(12,12,18,0.82)"/>
      <stop offset="100%" stop-color="rgba(8,8,12,0.92)"/>
    </radialGradient>
    <clipPath id="moonClip">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
    </clipPath>
    <!-- Filter for subtle outer glow -->
    <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" result="blur"/>
      <feComposite in="blur" in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>
  
  <!-- Outer glow -->
  <circle cx="${cx}" cy="${cy}" r="${r + 1.5}" fill="rgba(255,255,255,0.08)" opacity="0.7"/>
  
  <!-- Base sphere with gradient -->
  <g filter="url(#moonGlow)">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonBaseGrad)"/>
    
    <!-- Texture overlay for surface detail -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonTexture)" opacity="0.3" clip-path="url(#moonClip)"/>
    
    <!-- Dark shadow on terminator side -->
    <ellipse cx="${waxing ? cx - r * 0.3 : cx + r * 0.3}" cy="${cy}" rx="${r * 0.96}" ry="${r * 0.96}"
      fill="url(#moonShadow)" clip-path="url(#moonClip)"/>
    
    <!-- Illuminated portion (lit side) -->
    <ellipse cx="${ellCx}" cy="${cy}" rx="${rx}" ry="${r * 0.98}" 
      fill="rgba(255,255,255,0.94)" clip-path="url(#moonClip)"/>
    
    <!-- Bright limb highlight on lit edge -->
    <ellipse cx="${ellCx}" cy="${cy}" rx="${Math.max(1, rx * 0.92)}" ry="${r * 0.96}" 
      fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.2" clip-path="url(#moonClip)"/>
    
    <!-- Craters with depth -->
    <g clip-path="url(#moonClip)">
      ${craters.map(c => `
        <!-- Crater at ${c.x.toFixed(1)}, ${c.y.toFixed(1)} -->
        <circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="rgba(0,0,0,${c.opacity * 0.9})"/>
        <circle cx="${c.x - c.r*0.15}" cy="${c.y - c.r*0.15}" r="${c.r * 0.7}" fill="rgba(0,0,0,${c.opacity * 1.2})"/>
        <circle cx="${c.x + c.r*0.25}" cy="${c.y + c.r*0.25}" r="${c.r * 0.3}" fill="rgba(255,255,255,${c.opacity * 0.4})"/>
      `).join('')}
    </g>
    
    <!-- Subtle surface noise (maria/highlands) -->
    <g clip-path="url(#moonClip)" opacity="0.12">
      <ellipse cx="${cx - r*0.22}" cy="${cy - r*0.10}" rx="${r*0.18}" ry="${r*0.14}" fill="rgba(0,0,0,0.15)"/>
      <ellipse cx="${cx + r*0.18}" cy="${cy + r*0.16}" rx="${r*0.22}" ry="${r*0.16}" fill="rgba(0,0,0,0.12)"/>
      <ellipse cx="${cx - r*0.05}" cy="${cy + r*0.32}" rx="${r*0.14}" ry="${r*0.12}" fill="rgba(0,0,0,0.14)"/>
    </g>
    
    <!-- Final subtle limb darkening -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>
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
      debugLog(`Moon SVG updated in container`);
    } else {
      debugError('Moon container #moonTopRight not found');
    }

    const nameSpan = document.getElementById('moonPhaseName');
    if (nameSpan) {
      debugLog(`Setting phase name: "${name}" (was: "${nameSpan.textContent}")`);
      // Crossfade text when it changes
      if (nameSpan.textContent !== name) {
        nameSpan.style.opacity = '0';
        setTimeout(() => {
          nameSpan.textContent = name;
          nameSpan.style.opacity = '1';
          debugLog(`Phase name updated to: "${name}"`);
        }, 120);
      } else {
        // First load - set immediately
        nameSpan.textContent = name;
        nameSpan.style.opacity = '1';
      }
    } else {
      debugError('Phase name span #moonPhaseName not found');
    }
    debugLog(`Moon phase updated: ${name} (phase=${phase.toFixed(3)}, illumination=${(illuminationFromPhase(phase)*100).toFixed(1)}%)`);
  } catch (e) {
    debugError('Failed to update moon phase', e);
  }
}

export function initMoon() {
  updateMoonPhase();
  // Update every 15 minutes to keep in sync without excess work
  setInterval(updateMoonPhase, 15 * 60 * 1000);
}


