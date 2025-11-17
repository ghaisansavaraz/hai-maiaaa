/* Classic Starfield - procedural stars + shooting star (no positional movement) */
import { debugLog } from './config.js';

let lastCount = 0;

export function initStarfield() {
  try {
    const container = document.getElementById('starsContainer');
    const effects = document.querySelector('.stars-effects');
    if (!container) {
      debugLog('starsContainer missing; skipping init');
      return;
    }

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Night visibility
    if (document.body.classList.contains('dark-theme') || document.body.classList.contains('night-theme')) {
      document.body.classList.add('show-stars');
      ensureStars(container);
    } else {
      document.body.classList.remove('show-stars');
      container.innerHTML = '';
    }

    // Shooting star
    if (effects && !reduceMotion) {
      const trigger = () => spawnShootingStar(effects);
      setTimeout(trigger, 800);
      setInterval(() => trigger(), Math.floor(Math.random() * 15000) + 20000);
      window.spawnShootingStar = trigger;
    }

    // Regenerate on resize
    let rAF = 0;
    window.addEventListener('resize', () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => ensureStars(container));
    });

    debugLog('Classic starfield initialized');
  } catch (e) {
    console.error(e);
  }
}

function ensureStars(container) {
  const area = Math.max(1, window.innerWidth * window.innerHeight);
  const target = clampInt(area / 6000, 140, 420);
  if (container.childElementCount === target && lastCount === target) return;

  container.innerHTML = '';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (let i = 0; i < target; i++) {
    const d = document.createElement('div');
    d.className = 'sf-star';
    // Position
    d.style.left = Math.random() * 100 + 'vw';
    d.style.top = Math.random() * 100 + 'vh';
    // Size/opacity
    const sz = +(Math.random() * 1.6 + 0.6).toFixed(2);
    const op = +(Math.random() * 0.4 + 0.6).toFixed(2);
    d.style.setProperty('--sz', sz + 'px');
    d.style.setProperty('--op', op.toString());
    // Twinkle timing (disabled if prefers-reduced-motion)
    if (!reduceMotion) {
      const tw = +(Math.random() * 2.5 + 2.5).toFixed(2) + 's';
      const td = +(Math.random() * 3.5).toFixed(2) + 's';
      d.style.setProperty('--tw', tw);
      d.style.setProperty('--td', td);
    } else {
      d.style.animation = 'none';
      d.style.opacity = op.toString();
    }
    // Aggressive blinks (~10%)
    if (Math.random() < 0.10) d.classList.add('sf-agg');
    // Rare bright beacons (~3%)
    if (Math.random() < 0.03) {
      d.classList.add('sf-beacon');
      if (!reduceMotion) {
        const bk = +(Math.random() * 10 + 14).toFixed(2) + 's';
        const bd = +(Math.random() * 10).toFixed(2) + 's';
        d.style.setProperty('--bk', bk);
        d.style.setProperty('--bd', bd);
      }
    }
    container.appendChild(d);
  }
  lastCount = target;
}

function clampInt(x, min, max) {
  const v = Math.floor(x);
  return v < min ? min : v > max ? max : v;
}

function spawnShootingStar(container) {
  const star = document.createElement('div');
  star.className = 'shooting-star';
  const dur = (Math.random() * 0.4 + 1.2).toFixed(2) + 's';
  star.style.setProperty('--ss-dur', dur);

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
}


