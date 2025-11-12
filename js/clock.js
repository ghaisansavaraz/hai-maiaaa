/* Clock and Time Display System */

import { debugLog, debugError } from './config.js';
import { getMoonPhaseData, getMaskParams } from './moon.js';

let lastTime = ''; // Track time changes for individual digit flipping

export function updateTime() {
  debugLog("updateTime called");
  
  const headerCurrentTime = document.getElementById("headerCurrentTime");
  const headerCurrentDate = document.getElementById("headerCurrentDate");
  const headerTimeGreeting = document.getElementById("headerTimeGreeting");
  
  if (!headerCurrentTime || !headerCurrentDate || !headerTimeGreeting) {
    debugError("Header clock elements not available for update");
    return;
  }
  
  try {
    const now = new Date();
    
    // Update time (HH MM SS) - no colons for minimalist look
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, ' ');
    
    if (headerCurrentTime) {
      // Create individual digit containers and flip only changing digits
      const timeArray = timeString.split(' ');
      const lastTimeArray = lastTime.split(' ');
      
      headerCurrentTime.innerHTML = '';
      
      timeArray.forEach((timePart, partIndex) => {
        const partContainer = document.createElement('div');
        partContainer.style.display = 'flex';
        partContainer.style.gap = '0.05em';
        
        for (let i = 0; i < timePart.length; i++) {
          const digitSpan = document.createElement('span');
          digitSpan.className = 'time-digit';
          digitSpan.textContent = timePart[i];
          
          // Check if this digit changed
          if (lastTime && lastTimeArray[partIndex] && lastTimeArray[partIndex][i] !== timePart[i]) {
            digitSpan.classList.add('flipping');
            setTimeout(() => {
              digitSpan.classList.remove('flipping');
            }, 600);
          }
          
          partContainer.appendChild(digitSpan);
        }
        
        headerCurrentTime.appendChild(partContainer);
        
        // Add space between time parts (except last)
        if (partIndex < timeArray.length - 1) {
          const spaceSpan = document.createElement('span');
          spaceSpan.textContent = ' ';
          spaceSpan.style.margin = '0 0.1em';
          headerCurrentTime.appendChild(spaceSpan);
        }
      });
      
      lastTime = timeString;
      debugLog("Header time updated:", timeString);
    }
    
    // Update date (proper capitalization)
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (headerCurrentDate) {
      headerCurrentDate.textContent = dateString;
      debugLog("Header date updated:", dateString);
    }
    
    // Update greeting based on time
    const hour = now.getHours();
    let greeting = "Good evening Maiaaa";
    if (hour >= 5 && hour < 12) greeting = "Good morning Maiaaa";
    else if (hour >= 12 && hour < 18) greeting = "Good afternoon Maiaaa";
    
    // Update greeting inline structure
    const greetingTextEl = document.querySelector('.greeting-text');
    if (greetingTextEl) greetingTextEl.textContent = greeting;
    
    // Update moon phase (Jakarta)
    try {
      const moonData = getMoonPhaseData();
      const phaseNameEl = document.getElementById('moonPhaseName');
      if (phaseNameEl) phaseNameEl.textContent = moonData.name;
      
      const moonSvg = document.getElementById('moonIcon');
      const mask = moonSvg ? moonSvg.querySelector('#moonMask') : null;
      if (moonSvg && mask) {
        // Build a dynamic phase mask using two circles to create crescent/gibbous
        const { offset, radius, waxing } = getMaskParams(moonData.phase);
        // Clear current mask contents
        mask.innerHTML = '';
        // Base: full dark rectangle
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', '0');
        bg.setAttribute('y', '0');
        bg.setAttribute('width', '100');
        bg.setAttribute('height', '100');
        bg.setAttribute('fill', 'black');
        mask.appendChild(bg);
        // Light circle (the lit disk)
        const light = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        light.setAttribute('cx', '50');
        light.setAttribute('cy', '50');
        light.setAttribute('r', '46');
        light.setAttribute('fill', 'white');
        mask.appendChild(light);
        // Shadow circle to cut away illumination (creates phase)
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shadow.setAttribute('cx', String(50 + offset));
        shadow.setAttribute('cy', '50');
        shadow.setAttribute('r', String(Math.max(36, Math.min(60, radius))));
        shadow.setAttribute('fill', 'black');
        // For waxing, subtract shadow from left; for waning from right
        // Apply composite by drawing black over white area
        mask.appendChild(shadow);
      }
    } catch (e) {
      debugError('Failed to update moon phase', e);
    }
    
  } catch (error) {
    debugError("Failed to update header time", error);
  }
}

export function startTimeDisplay() {
  debugLog("Starting header time display...");
  
  const headerCurrentTime = document.getElementById("headerCurrentTime");
  const headerCurrentDate = document.getElementById("headerCurrentDate");
  const headerTimeGreeting = document.getElementById("headerTimeGreeting");
  
  debugLog("headerCurrentTime element:", headerCurrentTime);
  debugLog("headerCurrentDate element:", headerCurrentDate);
  debugLog("headerTimeGreeting element:", headerTimeGreeting);
  
  if (!headerCurrentTime || !headerCurrentDate || !headerTimeGreeting) {
    debugError("Header time display elements not found!");
    console.error("Missing elements:", {
      headerCurrentTime: !!headerCurrentTime,
      headerCurrentDate: !!headerCurrentDate,
      headerTimeGreeting: !!headerTimeGreeting
    });
    return;
  }
  
  // Update immediately
  updateTime();
  
  // Update every second
  setInterval(updateTime, 1000);
  
  debugLog("Header time display started successfully");
}

