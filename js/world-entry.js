/* The doorway into the meadow (world.html).
   From WORLD_ENTRY_DATE (her local midnight) the vase flower quietly becomes
   clickable: a few fireflies drift around the bloom, it glows a little on
   hover with a whispered hint, and a click fades the dashboard to night and
   walks her into the 3D meadow. Before that date nothing changes at all.
   The dev panel can open it early via the sessionStorage flag below. */

import { WORLD_ENTRY_DATE, WORLD_ENTRY_HINT, debugLog } from './config.js';

const DEV_FLAG = 'maiaaa_world_dev';
const VISITED_KEY = 'maiaaa_world_visited';
const MOTES = 24;
const INTRO_DELAY_MS = 1200;  // let the dashboard settle first
const INTRO_SHOW_MS = 8000;   // how long the whisper stays on its own

function localMidnight(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function isOpen() {
  try { if (sessionStorage.getItem(DEV_FLAG) === '1') return true; } catch { /* ignore */ }
  return Date.now() >= localMidnight(WORLD_ENTRY_DATE);
}

function hasVisited() {
  try { return localStorage.getItem(VISITED_KEY) === '1'; } catch { return false; }
}

export function enterMeadow() {
  if (document.querySelector('.world-fade')) return;
  const fade = document.createElement('div');
  fade.className = 'world-fade';
  document.body.appendChild(fade);
  void fade.offsetWidth; // start the transition from 0
  fade.classList.add('on');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => { window.location.href = 'world.html'; }, reduced ? 150 : 1300);
}

export function initWorldEntry() {
  const section = document.getElementById('vaseFlowerSection');
  if (!section || section.closest('.vf-door')) return;
  if (!isOpen()) {
    debugLog('World entry: closed until', WORLD_ENTRY_DATE);
    return;
  }

  // Wrap the section (its innerHTML is re-rendered by the flower and the dev
  // preview, so the motes live beside it, not inside it).
  const door = document.createElement('div');
  door.className = 'vf-door';
  if (!hasVisited()) door.classList.add('vf-door--calling');
  door.setAttribute('role', 'link');
  door.setAttribute('tabindex', '0');
  door.setAttribute('aria-label', 'Walk in');
  section.parentNode.insertBefore(door, section);
  door.appendChild(section);

  const motes = document.createElement('div');
  motes.className = 'vf-door-motes';
  motes.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < MOTES; i++) {
    const m = document.createElement('span');
    m.className = 'vf-mote';
    // scattered in a loose ring around the bloom (upper part of the vase art)
    const a = (i / MOTES) * Math.PI * 2 + Math.random() * 0.6;
    const r = 8 + Math.random() * 34;
    m.style.left = `${50 + Math.cos(a * 2.3) * r}%`;
    m.style.top = `${26 + Math.sin(a * 2.3) * r * 0.55}%`;
    const sz = 3 + Math.random() * 2.4;
    m.style.width = m.style.height = `${sz.toFixed(1)}px`;
    m.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s, ${(-Math.random() * 3).toFixed(2)}s`;
    m.style.animationDuration = `${(5 + Math.random() * 4).toFixed(2)}s, ${(2.2 + Math.random() * 1.8).toFixed(2)}s`;
    motes.appendChild(m);
  }
  door.appendChild(motes);

  const hint = document.createElement('div');
  hint.className = 'vf-door-hint';
  hint.textContent = WORLD_ENTRY_HINT;
  door.appendChild(hint);

  // on every visit the whisper appears by itself for a few seconds, glowing,
  // so she notices the flower is a door (hovering brings it back later)
  setTimeout(() => {
    door.classList.add('vf-door--intro');
    setTimeout(() => door.classList.remove('vf-door--intro'), INTRO_SHOW_MS);
  }, INTRO_DELAY_MS);

  door.addEventListener('click', enterMeadow);
  door.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterMeadow(); }
  });

  // coming back from the meadow via the browser's back button restores this
  // page from the bfcache with the fade still on; clear it
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.querySelectorAll('.world-fade').forEach((f) => f.remove());
  });

  debugLog('World entry: the flower is a doorway');
}
