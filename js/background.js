/* Dynamic Background System - Day/Night Theme */

import { debugLog } from './config.js';

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

// Apply theme based on time of day
export function applyTheme() {
  const hour = new Date().getHours();
  const body = document.body;
  
  // Day theme: 5 AM to 6 PM (5-18)
  // Night theme: 6 PM to 5 AM (18-5)
  if (hour >= 5 && hour < 18) {
    body.classList.add('light-theme');
    debugLog("Applied light theme (day mode)");
  } else {
    body.classList.remove('light-theme');
    debugLog("Applied dark theme (night mode)");
  }
}

// Update theme periodically (every minute)
setInterval(applyTheme, 60000);

