/* Lightweight Starfield - static CSS layers + shooting star only */
import { debugLog } from './config.js';

export function initStarfield() {
  try {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const back = document.querySelector('.stars-layer-back');
    const mid = document.querySelector('.stars-layer-mid');
    const front = document.querySelector('.stars-layer-front');
    const effects = document.querySelector('.stars-effects');
    if (!back || !mid || !front) {
      debugLog('Starfield layers missing; skipping init');
      return;
    }
    // Show stars only at night
    if (document.body.classList.contains('dark-theme') || document.body.classList.contains('night-theme')) {
      document.body.classList.add('show-stars');
    } else {
      document.body.classList.remove('show-stars');
    }
    // Initial and periodic shooting stars
    if (effects && !reduceMotion) {
      const trigger = () => spawnShootingStar(effects);
      setTimeout(trigger, 800);
      setInterval(() => {
        trigger();
      }, Math.floor(Math.random() * 15000) + 20000);
      window.spawnShootingStar = trigger;
    }
    debugLog('Lightweight starfield initialized');
  } catch (e) {
    console.error(e);
  }
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


