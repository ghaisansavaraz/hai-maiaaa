/* Clock and Time Display System */

import { debugLog, debugError } from './config.js';

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
    
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    if (headerCurrentTime) {
      headerCurrentTime.textContent = timeString;
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

