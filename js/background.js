/* Dynamic Background System */

import { debugLog } from './config.js';

export class DynamicBackground {
  constructor() {
    debugLog("Initializing time-based background system (pure white/black)...");
    this.updateBackground();
    this.startTimeSync();
  }

  getCurrentTheme() {
    const hour = new Date().getHours();
    
    // Simple time-based theme selection
    if (hour >= 6 && hour < 18) {
      return { 
        name: 'light', 
        isLight: true,
        gradient: '#ffffff'
      };
    } else {
      return { 
        name: 'dark', 
        isLight: false,
        // Use solid black at night to avoid any glare
        gradient: '#000000'
      };
    }
  }

  updateBackground() {
    const theme = this.getCurrentTheme();
    
    debugLog(`Updating background to ${theme.name} mode`);
    
    // Remove any system theme classes
    document.body.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    
    if (theme.isLight) {
      // Light mode: pure white background with black dashboard
      document.body.style.setProperty('background', theme.gradient, 'important');
      document.body.style.removeProperty('background-size');
      document.body.style.setProperty('animation', 'none', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.body.style.setProperty('color', '#000000', 'important');
      document.body.style.setProperty('color-scheme', 'light', 'important');
      document.documentElement.style.setProperty('color-scheme', 'light', 'important');
      
      // Apply light theme classes
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      
      // Hide day particles (no clouds/light rays), hide stars
      document.body.classList.remove('show-day-particles');
      document.body.classList.remove('show-stars');
      document.body.classList.add('hide-day-particles');
      
      debugLog('Applied light theme: pure white background, black dashboard, no particles');
    } else {
      // Dark mode: enforce pure black background with no animation to remove glare
      document.body.style.setProperty('background', '#000000', 'important');
      document.body.style.removeProperty('background-size');
      document.body.style.setProperty('animation', 'none', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.body.style.setProperty('color', '#ffffff', 'important');
      document.body.style.setProperty('color-scheme', 'dark', 'important');
      document.documentElement.style.setProperty('color-scheme', 'dark', 'important');
      
      // Apply dark theme classes
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      
      // Show stars, hide day particles
      document.body.classList.add('show-stars');
      document.body.classList.remove('show-day-particles');
      document.body.classList.remove('hide-day-particles');
      
      // Apply night theme class for glow effects
      document.body.classList.add('night-theme');
      
      debugLog('Applied dark theme: black background, white dashboard, stars');
    }
    
    debugLog(`Background updated: ${theme.name} mode`);
  }

  startTimeSync() {
    // Update every hour
    setInterval(() => {
      this.updateBackground();
    }, 3600000);
  }
}

// Apply time-based theme
export function applyTheme() {
  debugLog("Applying time-based theme (no system light/dark mode)");
  
  // Always use white text for better contrast with dynamic backgrounds
  document.body.style.setProperty('color', '#fff', 'important');
  document.body.classList.remove('light-mode');
  
  debugLog("Applied time-based theme - Background changes with time of day");
  console.log("🕐 Time-based theme active - Background adapts to time of day");
}

