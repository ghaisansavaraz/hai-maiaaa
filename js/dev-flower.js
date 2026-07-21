/* Hidden dev / test mode for the vase flower.
   Long-press (hold) the moon icon -> password gate (000) -> a panel that lists
   every bloom phase and the date it happens, and can preview each phase.
   Completely inert unless deliberately triggered; never shown to Maia. */

import { debugLog } from './config.js';
import {
  getBloomSchedule,
  getBloomStatus,
  renderVaseFlowerAt,
  renderVaseFlowerNow,
} from './vase-flower.js';

const DEV_PASSWORD = '000';
const LONG_PRESS_MS = 700;

let pressTimer = null;
let longPressFired = false;
let unlocked = false;

// ---- date formatting ----

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---- password modal ----

function openPasswordModal() {
  closeOverlay(); // ensure only one
  const overlay = document.createElement('div');
  overlay.className = 'dev-overlay';
  overlay.id = 'devOverlay';
  overlay.innerHTML = `
    <div class="dev-modal" role="dialog" aria-modal="true" aria-label="Developer access">
      <div class="dev-modal-title">Developer access</div>
      <input id="devPassInput" class="dev-pass-input" type="password" inputmode="numeric"
             autocomplete="off" placeholder="Passcode" aria-label="Passcode" />
      <div class="dev-error" id="devError"></div>
      <div class="dev-modal-actions">
        <button class="dev-btn dev-btn-ghost" id="devCancel">Cancel</button>
        <button class="dev-btn" id="devSubmit">Unlock</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#devPassInput');
  const err = overlay.querySelector('#devError');
  setTimeout(() => input && input.focus(), 60);

  const submit = () => {
    if (input.value === DEV_PASSWORD) {
      unlocked = true;
      openDevPanel();
    } else {
      err.textContent = 'Incorrect passcode';
      input.value = '';
      const modal = overlay.querySelector('.dev-modal');
      modal.classList.remove('dev-shake');
      void modal.offsetWidth; // restart animation
      modal.classList.add('dev-shake');
      input.focus();
    }
  };

  overlay.querySelector('#devSubmit').addEventListener('click', submit);
  overlay.querySelector('#devCancel').addEventListener('click', closeOverlay);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); }
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
}

// ---- dev panel ----

function openDevPanel() {
  closeOverlay();
  const status = getBloomStatus();
  const schedule = getBloomSchedule();

  const overlay = document.createElement('div');
  // Docked (non-blocking) so the flower stays visible on the left while you
  // preview phases in the panel on the right.
  overlay.className = 'dev-overlay dev-overlay-panel';
  overlay.id = 'devOverlay';

  // Mark the highest milestone the flower has already reached as "current".
  let currentOpenness = 0;
  schedule.forEach((ph) => { if (status.openness >= ph.openness) currentOpenness = ph.openness; });

  const rows = schedule.map((ph) => {
    const reached = status.now >= ph.date;
    const isCurrent = ph.openness === currentOpenness;
    return `
      <tr class="dev-row${reached ? ' reached' : ''}${isCurrent ? ' current' : ''}" data-openness="${ph.openness}">
        <td class="dev-phase">${ph.label}</td>
        <td class="dev-when">${fmtDate(ph.date)}</td>
        <td class="dev-preview"><button class="dev-mini" data-openness="${ph.openness}">preview</button></td>
      </tr>`;
  }).join('');

  overlay.innerHTML = `
    <div class="dev-panel" role="dialog" aria-modal="true" aria-label="Flower bloom schedule">
      <div class="dev-panel-head">
        <div class="dev-panel-title">🌱 Flower bloom schedule</div>
        <button class="dev-btn dev-btn-ghost" id="devClose">Close</button>
      </div>
      <div class="dev-status">
        <div><span>Today</span><b>${fmtDateTime(status.now)}</b></div>
        <div><span>Progress</span><b>${(status.progress * 100).toFixed(1)}%</b></div>
        <div><span>Now showing</span><b>${status.isBud ? 'Tight bud' : status.isFull ? 'Full bloom' : status.opennessPct + '% open'}</b></div>
        <div><span>Window</span><b>${status.startDate} → ${status.targetDate} (pace ${status.pace}×)</b></div>
      </div>
      <div class="dev-table-wrap">
        <table class="dev-table">
          <thead><tr><th>Phase</th><th>Date reached</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="dev-panel-foot">
        <span class="dev-hint">Preview is temporary — reloading or “Live” restores the real state.</span>
        <button class="dev-btn" id="devLive">Back to live</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const highlightPreview = (openness) => {
    overlay.querySelectorAll('.dev-row').forEach((r) =>
      r.classList.toggle('previewing', String(openness) === r.dataset.openness));
  };

  overlay.querySelectorAll('.dev-mini').forEach((btn) => {
    btn.addEventListener('click', () => {
      const openness = parseFloat(btn.dataset.openness);
      renderVaseFlowerAt(openness);
      highlightPreview(btn.dataset.openness);
    });
  });
  overlay.querySelector('#devLive').addEventListener('click', () => {
    renderVaseFlowerNow();
    highlightPreview(null);
  });
  overlay.querySelector('#devClose').addEventListener('click', () => {
    renderVaseFlowerNow(); // never leave a preview stuck on screen
    closeOverlay();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { renderVaseFlowerNow(); closeOverlay(); }
  });
  document.addEventListener('keydown', escToClose);
}

function escToClose(e) {
  if (e.key === 'Escape') {
    renderVaseFlowerNow();
    closeOverlay();
  }
}

function closeOverlay() {
  const existing = document.getElementById('devOverlay');
  if (existing) existing.remove();
  document.removeEventListener('keydown', escToClose);
}

// ---- long-press wiring on the moon ----

function startPress() {
  longPressFired = false;
  clearPress();
  pressTimer = window.setTimeout(() => {
    longPressFired = true;
    openPasswordModal();
    debugLog('Dev flower mode: long-press detected');
  }, LONG_PRESS_MS);
}

function clearPress() {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
}

export function initDevFlowerMode() {
  const moon = document.getElementById('moonIconContainer');
  if (!moon) {
    debugLog('Dev flower mode: moon icon not found, skipping');
    return;
  }

  moon.addEventListener('pointerdown', startPress);
  moon.addEventListener('pointerup', clearPress);
  moon.addEventListener('pointerleave', clearPress);
  moon.addEventListener('pointercancel', clearPress);

  // If a long-press just fired, swallow the click so it doesn't also toggle zen
  // mode. Capture phase runs before the zen handler bound in main.js.
  moon.addEventListener('click', (e) => {
    if (longPressFired) {
      e.stopPropagation();
      e.preventDefault();
      longPressFired = false;
    }
  }, true);

  // Keyboard fallback for the focused moon (accessible + testable): Shift+D.
  moon.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      openPasswordModal();
    }
  });

  debugLog('Dev flower mode initialized');
}
