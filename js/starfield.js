/* Procedural Starfield - seeded, parallax, twinkle */
import { STARFIELD_CONFIG, debugLog } from './config.js';

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededFromEnv() {
  const d = new Date();
  const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const w = Math.floor(window.innerWidth);
  const h = Math.floor(window.innerHeight);
  return (day * 73856093) ^ (w * 19349663) ^ (h * 83492791);
}

function pick(rand, min, max) {
  return min + (max - min) * rand();
}

function createStarsInLayer(layerEl, count, rand, sizePx, opacity, twinkleSec, opts = {}) {
  const aggressiveFraction = opts.aggressiveFraction || 0;
  const beaconCount = opts.beaconCount || 0;
  const staticFraction = opts.staticFraction || 0;
  const frag = document.createDocumentFragment();
  // Rare bright beacons first
  for (let b = 0; b < beaconCount; b++) {
    const star = document.createElement('div');
    star.className = 'sf-star sf-beacon';
    const x = (rand() * 100).toFixed(3) + '%';
    const y = (rand() * 100).toFixed(3) + '%';
    const sz = pick(rand, Math.max(sizePx.min, 1.8), sizePx.max * 1.6);
    const o = pick(rand, Math.max(opacity.min, 0.8), opacity.max);
    const period = pick(rand, STARFIELD_CONFIG.beacon.periodSec.min, STARFIELD_CONFIG.beacon.periodSec.max);
    const delay = (-pick(rand, 0, period)).toFixed(2) + 's';
    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--sz', sz.toFixed(2) + 'px');
    star.style.setProperty('--o', o.toFixed(2));
    star.style.setProperty('--bk', period.toFixed(2) + 's');
    star.style.setProperty('--bd', delay);
    frag.appendChild(star);
  }
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'sf-star';
    const x = (rand() * 100).toFixed(3) + '%';
    const y = (rand() * 100).toFixed(3) + '%';
    const sz = pick(rand, sizePx.min, sizePx.max);
    // bias a few larger in front layers via CSS count choice; here uniform
    const o = pick(rand, opacity.min, opacity.max);
    const tw = pick(rand, twinkleSec.min, twinkleSec.max);
    const td = (-pick(rand, 0, tw)).toFixed(2) + 's'; // negative for de-sync
    if (rand() < aggressiveFraction) {
      star.classList.add('sf-agg');
    }
    if (rand() < staticFraction) {
      star.classList.add('sf-static');
    }
    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--sz', sz.toFixed(2) + 'px');
    star.style.setProperty('--o', o.toFixed(2));
    star.style.setProperty('--tw', tw.toFixed(2) + 's');
    star.style.setProperty('--td', td);
    frag.appendChild(star);
  }
  layerEl.appendChild(frag);
}

// CSS-driven parallax: set amplitudes and durations via custom properties
function applyCssParallax(layers, reduceMotion) {
  if (reduceMotion) return;
  const set = (el, dx, dy, dur) => {
    if (!el) return;
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);
    el.style.setProperty('--sf-dur', `${dur}s`);
  };
  set(layers.back, STARFIELD_CONFIG.amplitudePx.back, STARFIELD_CONFIG.amplitudePx.back, 90);
  set(layers.mid, STARFIELD_CONFIG.amplitudePx.mid, STARFIELD_CONFIG.amplitudePx.mid, 70);
  set(layers.front, STARFIELD_CONFIG.amplitudePx.front, STARFIELD_CONFIG.amplitudePx.front, 50);
  if (layers.sparkle) set(layers.sparkle, STARFIELD_CONFIG.amplitudePx.sparkle, STARFIELD_CONFIG.amplitudePx.sparkle, 40);
}

export function initStarfield() {
  try {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const back = document.querySelector('.stars-layer-back');
    const mid = document.querySelector('.stars-layer-mid');
    const front = document.querySelector('.stars-layer-front');
    const sparkle = document.querySelector('.stars-layer-sparkle');
    const effects = document.querySelector('.stars-effects');
    if (!back || !mid || !front) {
      debugLog('Starfield layers missing; skipping init');
      return;
    }
    if (STARFIELD_CONFIG.hideLegacy) {
      document.body.classList.add('proc-stars');
    }
    // Ensure star layers are visible
    document.body.classList.add('show-stars');
    // Seeded RNG
    const rand = mulberry32(seededFromEnv());
    // Densities (can lower on small screens)
    const scale = Math.min(1, Math.max(0.6, window.innerWidth / 1440));
    const dens = STARFIELD_CONFIG.densities;
    createStarsInLayer(back, Math.floor(dens.back * scale), rand, STARFIELD_CONFIG.sizePx, STARFIELD_CONFIG.opacity, STARFIELD_CONFIG.twinkleSec, { aggressiveFraction: STARFIELD_CONFIG.aggressiveFraction.back, beaconCount: STARFIELD_CONFIG.beacon.perLayer, staticFraction: 0.7 });
    createStarsInLayer(mid, Math.floor(dens.mid * scale), rand, STARFIELD_CONFIG.sizePx, STARFIELD_CONFIG.opacity, STARFIELD_CONFIG.twinkleSec, { aggressiveFraction: STARFIELD_CONFIG.aggressiveFraction.mid, beaconCount: STARFIELD_CONFIG.beacon.perLayer, staticFraction: 0.5 });
    createStarsInLayer(front, Math.floor(dens.front * scale), rand, STARFIELD_CONFIG.sizePx, STARFIELD_CONFIG.opacity, STARFIELD_CONFIG.twinkleSec, { aggressiveFraction: STARFIELD_CONFIG.aggressiveFraction.front, beaconCount: STARFIELD_CONFIG.beacon.perLayer, staticFraction: 0.3 });
    if (sparkle) {
      createStarsInLayer(sparkle, Math.floor(dens.sparkle * scale), rand, { min: STARFIELD_CONFIG.sizePx.max, max: STARFIELD_CONFIG.sizePx.max * 1.6 }, { min: 0.85, max: 1.0 }, { min: 1.6, max: 3.0 }, { aggressiveFraction: STARFIELD_CONFIG.aggressiveFraction.sparkle, beaconCount: Math.max(1, STARFIELD_CONFIG.beacon.perLayer - 1), staticFraction: 0.1 });
    }
    // Parallax drift (CSS-based for efficiency)
    applyCssParallax({ back, mid, front, sparkle }, reduceMotion);
    // Milky Way slow rotation
    const mw = document.querySelector('.milky-way');
    if (mw && !reduceMotion) {
      let a = 0;
      const turnPerSec = STARFIELD_CONFIG.drift.turnPerSec;
      const tick = () => {
        a += turnPerSec / 60;
        mw.style.transform = `rotate(${a}turn)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    // Trigger one shooting star on load (if effects layer exists)
    if (effects && !reduceMotion) {
      setTimeout(() => spawnShootingStar(effects), 800);
      // expose manual trigger for debugging
      window.spawnShootingStar = () => spawnShootingStar(effects);
    }
    debugLog('Starfield initialized');
  } catch (e) {
    console.error(e);
  }
}

// Create a fast shooting star from top-right to bottom-left with an end flash
function spawnShootingStar(container) {
  try {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    // Duration randomization for variety
    const dur = (Math.random() * 0.4 + 1.2).toFixed(2) + 's';
    star.style.setProperty('--ss-dur', dur);
    // Build internals: head, trail, aura
    const head = document.createElement('div');
    head.className = 'shooting-head';
    const trail = document.createElement('div');
    trail.className = 'shooting-trail';
    const aura = document.createElement('div');
    aura.className = 'shooting-aura';
    star.appendChild(trail);
    star.appendChild(head);
    star.appendChild(aura);
    container.appendChild(star);
    const cleanup = () => {
      star.removeEventListener('animationend', cleanup);
      if (star.parentNode) star.parentNode.removeChild(star);
    };
    star.addEventListener('animationend', cleanup);
  } catch (e) {
    console.error('spawnShootingStar failed', e);
  }
}


