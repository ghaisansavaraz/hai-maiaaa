/* "WORLD'S BEST REVA" mug — a quiet decorative object below the vase. */

import { debugLog } from './config.js';

function buildMugSVG() {
  return `
    <svg class="mug-svg" viewBox="0 0 250 284" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="World's Best Reva mug">
      <defs>
        <linearGradient id="mugBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#eeeae3"/>
          <stop offset="16%" stop-color="#ffffff"/>
          <stop offset="62%" stop-color="#fbfaf7"/>
          <stop offset="100%" stop-color="#e6e2d9"/>
        </linearGradient>
        <linearGradient id="mugInside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c7c2b9"/>
          <stop offset="100%" stop-color="#e2ded6"/>
        </linearGradient>
      </defs>

      <!-- Handle: a clear protruding ceramic loop attached at the vertical
           middle of the body. Only a thin sliver overlaps the body's edge
           (for a seamless join) — the rest of the loop is fully visible
           sticking out to the side, not hidden behind the mug. -->
      <path class="mug-body" d="M60,90
            C28,93 15,115 15,155
            C15,195 28,217 60,220
            L60,207
            C44,204 33,187 33,155
            C33,123 44,106 60,103 Z"
            fill="url(#mugBody)" stroke="rgba(150,144,134,0.4)" stroke-width="1.2"/>

      <!-- Body: straight-sided cylinder (minimal taper) with a soft curved
           bottom edge (not a flat cutoff) -->
      <path class="mug-body" d="M52,58 L55,231
            Q58,250 130,251 Q202,250 205,231 L208,58 Z"
            fill="url(#mugBody)" stroke="rgba(150,144,134,0.4)" stroke-width="1.2"/>

      <!-- Rim + hollow opening -->
      <ellipse class="mug-rim" cx="130" cy="58" rx="78" ry="16.5" fill="#ffffff" stroke="rgba(150,144,134,0.35)" stroke-width="1.2"/>
      <ellipse cx="130" cy="58" rx="66" ry="12.5" fill="url(#mugInside)"/>
      <ellipse cx="130" cy="56" rx="66" ry="11" fill="#f3f1ec"/>
      <ellipse cx="130" cy="59" rx="58" ry="10" fill="url(#mugInside)"/>

      <!-- Text: tight line spacing, bold, centered on the body -->
      <g font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="800"
         fill="#161616" text-anchor="middle" letter-spacing="0">
        <text x="133" y="132" font-size="24">WORLD'S</text>
        <text x="133" y="162" font-size="24">BEST</text>
        <text x="133" y="192" font-size="24">REVA</text>
      </g>
    </svg>
  `;
}

export function initMug() {
  const section = document.getElementById('mugSection');
  if (!section) {
    debugLog('Mug section not found, skipping');
    return;
  }
  section.innerHTML = buildMugSVG();
  debugLog('Mug initialized');
}
