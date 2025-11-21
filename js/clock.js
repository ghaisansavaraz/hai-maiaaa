/* Clock and Time Display System */

import { debugLog, debugError } from './config.js';

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
    
    if (headerTimeGreeting) {
      const greetingTextSpan = document.getElementById("greetingText");
      if (greetingTextSpan) {
        greetingTextSpan.textContent = greeting;
      } else {
        headerTimeGreeting.textContent = greeting;
      }
      debugLog("Header greeting updated:", greeting);
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

