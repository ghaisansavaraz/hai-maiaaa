/* Main Application Entry Point - PULSING ANIMATIONS v6 */

import { EDITOR_CODE, LETTERS_DATA, MOOD_STORAGE_KEY, TASKS_STORAGE_KEY, debugLog, debugError } from './config.js';
import { DynamicBackground, applyTheme } from './background.js';
import { startTimeDisplay } from './clock.js';
import { loadMoods, initMoodEventListeners, toggleMoodSelectionMode } from './mood.js';
import { loadTasks, initTaskEventListeners, toggleTasksSelectionMode } from './tasks.js';
import { loadReminders, initReminderEventListeners } from './reminders.js';
import { initMoonSync } from './moon-sync.js';

let dynamicBackground = null;

// Show dashboard
function showDashboard() {
  const dashboard = document.getElementById("dashboard");
  const centerContainer = document.querySelector(".center");
  const dashboardContent = document.getElementById("dashboardContent");
  
  if (dashboard) {
    dashboard.classList.remove("hidden");
    dashboard.classList.add("visible");
    if (centerContainer) {
      centerContainer.classList.add("dashboard-active");
    }
    dashboard.style.opacity = "1";
    dashboard.style.transform = "translateY(0) scale(1)";
    if (dashboardContent) {
      dashboardContent.classList.add("visible");
      dashboardContent.style.opacity = "1";
      dashboardContent.style.transform = "translateY(0)";
      setTimeout(() => revealSections(), 300);
    }
  }
}

function revealSections() {
  const sections = document.querySelectorAll('.dashboard-section');
  debugLog(`Found ${sections.length} sections to reveal`);
  
  sections.forEach((section, index) => {
    setTimeout(() => {
      section.classList.add('visible');
      section.style.opacity = "1";
      section.style.transform = "translateY(0) scale(1)";
      debugLog(`Revealed section ${index + 1}`);
    }, index * 150);
  });
}

// Starfield: randomly place discrete stars if present
function initStarfieldPositions() {
  try {
    const stars = document.querySelectorAll('.stars-container .star');
    if (!stars || stars.length === 0) return;
    stars.forEach((star, idx) => {
      // Deterministic pseudo-random using index for stable layout across reloads
      const seed = (idx + 1) * 9301 % 233280;
      const rand1 = (seed / 233280);
      const rand2 = ((seed * 1103515245 + 12345) % 2147483647) / 2147483647;
      const top = Math.floor(rand1 * 100);
      const left = Math.floor(rand2 * 100);
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      star.style.opacity = String(0.6 + (rand2 * 0.4)); // 0.6–1.0
    });
    debugLog(`Positioned ${stars.length} stars`);
  } catch (e) {
    debugError("initStarfieldPositions failed:", e);
  }
}

// Letters system
function renderLetters() {
  const lettersContainer = document.getElementById("lettersContainer");
  if (!lettersContainer) return;
  
  lettersContainer.innerHTML = "";
  
  LETTERS_DATA.forEach((letter, index) => {
    const envelopeCard = document.createElement("div");
    envelopeCard.className = "envelope-card";
    envelopeCard.style.animationDelay = `${index * 0.1}s`;
    
    envelopeCard.innerHTML = `
      <div class="envelope">
        <div class="envelope-front">
          <div class="envelope-icon">${letter.icon}</div>
          <h3 class="envelope-title">${letter.title}</h3>
          <div class="envelope-date">${letter.date}</div>
        </div>
        <div class="envelope-back">
          <div class="envelope-content">${letter.content}</div>
        </div>
      </div>
    `;
    
    envelopeCard.addEventListener("click", () => {
      envelopeCard.classList.toggle("flipped");
    });
    
    lettersContainer.appendChild(envelopeCard);
  });
}

// Card Activation System (Show/Hide Controls)
function initCardActivation() {
  const cards = document.querySelectorAll('.dashboard-card');
  
  cards.forEach(card => {
    // Click card to toggle active state
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking on inputs, buttons, or interactive elements
      if (e.target.matches('input, button, .mood-tag, .task-checkbox, .reminder-card, .btn-icon')) {
        return;
      }
      
      card.classList.toggle('active');
      debugLog(`Card ${card.id} toggled to: ${card.classList.contains('active') ? 'active' : 'inactive'}`);
    });
  });
  
  // Click outside any card to close all
  document.addEventListener('click', (e) => {
    const clickedCard = e.target.closest('.dashboard-card');
    
    if (!clickedCard) {
      // Clicked outside all cards - deactivate all
      cards.forEach(card => {
        if (card.classList.contains('active')) {
          card.classList.remove('active');
          debugLog(`Card ${card.id} deactivated (clicked outside)`);
        }
      });
    }
  });
}

// Editor key (triple-click on dashboard title)
function initEditorKey() {
  const dashboard = document.getElementById("dashboard");
  let editorClicks = 0;
  
  if (dashboard) {
    dashboard.addEventListener("click", (e) => {
      if (e.target.classList.contains("dash-title")) {
        editorClicks++;
        if (editorClicks === 3) {
          const code = prompt("Enter editor code:");
          if (code === EDITOR_CODE) {
            alert("Editor mode unlocked! You can now edit letters in the code.");
            console.log("Editor mode unlocked. Edit LETTERS_DATA in config.js to modify letters.");
          }
          editorClicks = 0;
        }
        setTimeout(() => (editorClicks = 0), 1000);
      }
    });
  }
}

// Clear mood button
function initClearButtons() {
  const clearMoodBtn = document.getElementById("clearMood");
  if (clearMoodBtn) {
    console.log("[Maiaaa] Trash button wired for SELECTION MODE (not clear all)");
    clearMoodBtn.addEventListener("click", () => {
      console.log("[Maiaaa] Trash clicked - toggling selection mode");
      toggleMoodSelectionMode(clearMoodBtn);
    });
  }
  
  const clearTasksBtn = document.getElementById("clearTasks");
  if (clearTasksBtn) {
    clearTasksBtn.addEventListener("click", () => {
      toggleTasksSelectionMode(clearTasksBtn);
    });
  }
}

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    debugLog("Initializing application...");
    
    // Apply lightweight, non-blocking initializations first
    try {
      startTimeDisplay(); // start clock immediately
    } catch (e) {
      debugError("startTimeDisplay failed:", e);
    }
    try {
      initMoonSync(); // kick off moon sync early
    } catch (e) {
      debugError("initMoonSync failed:", e);
    }
    
    // Initialize dynamic background (non-critical)
    try {
      dynamicBackground = new DynamicBackground();
    } catch (e) {
      debugError("DynamicBackground failed:", e);
    }
    
    // Apply time-based theme (non-critical)
    try {
      applyTheme();
    } catch (e) {
      debugError("applyTheme failed:", e);
    }
    
    // Initialize card activation system
    try { initCardActivation(); } catch (e) { debugError("initCardActivation failed:", e); }
    
    // Initialize all components
    try { loadMoods(); } catch (e) { debugError("loadMoods failed:", e); }
    try { loadReminders(); } catch (e) { debugError("loadReminders failed:", e); }
    try { loadTasks(); } catch (e) { debugError("loadTasks failed:", e); }
    try { renderLetters(); } catch (e) { debugError("renderLetters failed:", e); }
    
    // Initialize event listeners
    try { initMoodEventListeners(); } catch (e) { debugError("initMoodEventListeners failed:", e); }
    try { initReminderEventListeners(); } catch (e) { debugError("initReminderEventListeners failed:", e); }
    try { initTaskEventListeners(); } catch (e) { debugError("initTaskEventListeners failed:", e); }
    try { initClearButtons(); } catch (e) { debugError("initClearButtons failed:", e); }
    try { initEditorKey(); } catch (e) { debugError("initEditorKey failed:", e); }
    try { initStarfieldPositions(); } catch (e) { debugError("initStarfieldPositions failed:", e); }
    
    // Force re-render tasks to remove any old flower elements from cache
    try { loadTasks(); } catch (e) { debugError("second loadTasks failed:", e); }
    
    // Show dashboard immediately
    showDashboard();
    
    debugLog("Application initialized successfully");
  } catch (e) {
    debugError("Initialization failed:", e);
  }
});

