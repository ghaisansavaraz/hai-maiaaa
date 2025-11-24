/* Dynamic Background System - Day/Night Theme */

import { debugLog } from './config.js';

// Manual override state
let manualThemeOverride = null; // null = auto, 'light' = day, 'dark' = night

export class DynamicBackground {
  constructor() {
    this.init();
  }

  init() {
    debugLog("Dynamic background initialized");
    // Background is handled by CSS, this is just a placeholder for future enhancements
  }

  update() {
    // Placeholder for dynamic updates
  }
}

// Apply theme based on time of day or manual override
function setThemeClass(isLight) {
  const body = document.body;
  const root = document.documentElement;
  if (!body || !root) return;

  if (isLight) {
    body.classList.add('light-theme');
    root.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
    root.classList.remove('light-theme');
  }
}

export function applyTheme() {
  const body = document.body;
  if (!body) return;

  // Check if manual override is set
  if (manualThemeOverride === 'light') {
    setThemeClass(true);
    debugLog("Applied light theme (manual override)");
    return;
  } else if (manualThemeOverride === 'dark') {
    setThemeClass(false);
    debugLog("Applied dark theme (manual override)");
    return;
  }
  
  // Auto mode - based on time
  const hour = new Date().getHours();
  // Day theme: 5 AM to 6 PM (5-18)
  // Night theme: 6 PM to 5 AM (18-5)
  if (hour >= 5 && hour < 18) {
    setThemeClass(true);
    debugLog("Applied light theme (day mode - auto)");
  } else {
    setThemeClass(false);
    debugLog("Applied dark theme (night mode - auto)");
  }
}

// Toggle theme manually (for testing)
export function toggleTheme() {
  const body = document.body;
  const isCurrentlyLight = body.classList.contains('light-theme');
  
  if (isCurrentlyLight) {
    // Switch to dark
    setThemeClass(false);
    manualThemeOverride = 'dark';
    body.classList.add('testing-mode'); // mark manual testing active
    debugLog("Manually switched to dark theme");
  } else {
    // Switch to light
    setThemeClass(true);
    manualThemeOverride = 'light';
    body.classList.add('testing-mode'); // mark manual testing active
    debugLog("Manually switched to light theme");
  }
}

// Reset to auto mode
export function resetThemeToAuto() {
  manualThemeOverride = null;
  document.body.classList.remove('testing-mode');
  // Reapply theme to sync html/body classes
  applyTheme();
  debugLog("Reset theme to auto mode");
}

// Update theme periodically (every minute) - only if not in manual override
setInterval(() => {
  if (manualThemeOverride === null) {
    applyTheme();
  }
}, 60000);

