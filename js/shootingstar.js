/* Shooting Star System - Triggers on boot and periodically */

import { debugLog } from './config.js';

function isShootingStarDarkMode() {
  return !document.body.classList.contains('light-theme');
}

// Trigger shooting star (original: top-right → bottom-left)
export function triggerShootingStar() {
  const shootingStar = document.getElementById('shootingStar');
  if (!shootingStar) {
    debugLog('Shooting star element not found');
    return;
  }
  if (!isShootingStarDarkMode()) {
    debugLog('Skipping shooting star (day mode)');
    return;
  }
  shootingStar.classList.remove('active');
  void shootingStar.offsetWidth;
  shootingStar.classList.add('active');
  debugLog('✨ Shooting star triggered!');
  setTimeout(() => shootingStar.classList.remove('active'), 2500);
}

// Trigger shooting star 2 (left → right, faster, brighter, rarer)
export function triggerShootingStar2() {
  const el = document.getElementById('shootingStar2');
  if (!el) return;
  if (!isShootingStarDarkMode()) return;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  debugLog('✨ Shooting star 2 (reverse) triggered!');
  setTimeout(() => el.classList.remove('active'), 1350);
}

// Initialize shooting star system
export function initShootingStar() {
  debugLog('Initializing shooting star system...');

  // First star on boot (after 2s)
  setTimeout(() => {
    triggerShootingStar();
    debugLog('🌠 Boot shooting star launched!');
  }, 2000);

  // Second star on boot: longer gap after the first (3.2s after first trigger = 5.2s from load)
  setTimeout(() => {
    triggerShootingStar2();
    debugLog('🌠 Boot shooting star 2 (reverse) launched!');
  }, 5200);

  // Original star: every 30–90s
  function scheduleNextShootingStar() {
    const randomInterval = Math.random() * (90000 - 30000) + 30000;
    setTimeout(() => {
      triggerShootingStar();
      debugLog(`Next shooting star in ${Math.round(randomInterval / 1000)}s`);
      scheduleNextShootingStar();
    }, randomInterval);
  }
  scheduleNextShootingStar();

  // Second star: more rare (e.g. 90–200s)
  function scheduleNextShootingStar2() {
    const randomInterval = Math.random() * (200000 - 90000) + 90000;
    setTimeout(() => {
      triggerShootingStar2();
      debugLog(`Next shooting star 2 in ${Math.round(randomInterval / 1000)}s`);
      scheduleNextShootingStar2();
    }, randomInterval);
  }
  scheduleNextShootingStar2();

  debugLog('Shooting star system initialized ✓');
}

