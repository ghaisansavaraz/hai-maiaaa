/* Shooting Star System - Triggers on boot and periodically */

import { debugLog } from './config.js';

// Trigger shooting star
export function triggerShootingStar() {
  const shootingStar = document.getElementById('shootingStar');
  if (!shootingStar) {
    debugLog('Shooting star element not found');
    return;
  }
  
  // Only trigger in dark mode
  const isDarkMode = !document.body.classList.contains('light-theme');
  if (!isDarkMode) {
    debugLog('Skipping shooting star (day mode)');
    return;
  }
  
  // Remove active class if it exists (reset)
  shootingStar.classList.remove('active');
  
  // Force reflow to restart animation
  void shootingStar.offsetWidth;
  
  // Add active class to trigger animation
  shootingStar.classList.add('active');
  
  debugLog('✨ Shooting star triggered!');
  
  // Remove active class after animation completes
  setTimeout(() => {
    shootingStar.classList.remove('active');
  }, 2500);
}

// Initialize shooting star system
export function initShootingStar() {
  debugLog('Initializing shooting star system...');
  
  // Trigger on boot (after 2 seconds delay for better effect)
  setTimeout(() => {
    triggerShootingStar();
    debugLog('🌠 Boot shooting star launched!');
  }, 2000);
  
  // Trigger periodically (random interval between 30-90 seconds)
  function scheduleNextShootingStar() {
    const minInterval = 30000; // 30 seconds
    const maxInterval = 90000; // 90 seconds
    const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;
    
    setTimeout(() => {
      triggerShootingStar();
      debugLog(`Next shooting star in ${Math.round(randomInterval / 1000)}s`);
      scheduleNextShootingStar(); // Schedule next one
    }, randomInterval);
  }
  
  // Start the periodic scheduling
  scheduleNextShootingStar();
  
  debugLog('Shooting star system initialized ✓');
}

