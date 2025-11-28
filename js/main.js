/* Main Application Entry Point - PULSING ANIMATIONS v6 */

import { EDITOR_CODE, LETTERS_DATA, MOOD_STORAGE_KEY, TASKS_STORAGE_KEY, debugLog, debugError } from './config.js';
import { DynamicBackground, applyTheme, toggleTheme } from './background.js';
import { startTimeDisplay } from './clock.js';
import { loadMoods, initMoodEventListeners, toggleMoodSelectionMode, toggleBookState, loadMoodBookState } from './mood.js';
import { loadTasks, initTaskEventListeners, toggleTasksSelectionMode } from './tasks.js';
import { loadReminders, initReminderEventListeners } from './reminders.js';
import { initShootingStar, triggerShootingStar } from './shootingstar.js';

let dynamicBackground = null;
let zenModeActive = false;
let zenModeTimeoutId = null;
let zenAudioElement = null;
let zenBloomTimeoutId = null;

const DAY_START_HOUR = 5;
const DAY_END_HOUR = 18;
const ZEN_DAY_AUTO_EXIT_HOUR = 20;
const ZEN_NIGHT_AUTO_EXIT_HOUR = 8;
const ZEN_CHIME_PATH = 'assets/Wind chime Zen/Wind chime, Hai Maiaaa.mp3';

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

function isDaytimeHour(date = new Date()) {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
}

function clearZenModeTimeout() {
  if (zenModeTimeoutId) {
    clearTimeout(zenModeTimeoutId);
    zenModeTimeoutId = null;
  }
}

function clearZenBloomTimeout() {
  if (zenBloomTimeoutId) {
    clearTimeout(zenBloomTimeoutId);
    zenBloomTimeoutId = null;
  }
}

function stopZenBloom() {
  clearZenBloomTimeout();
  document.body.classList.remove('zen-bloom');
}

function startZenBloom() {
  document.body.classList.add('zen-bloom');
  clearZenBloomTimeout();
  zenBloomTimeoutId = window.setTimeout(() => {
    stopZenBloom();
  }, 5000);
}

function scheduleZenModeAutoExit() {
  clearZenModeTimeout();
  const now = new Date();
  const target = new Date(now);

  if (isDaytimeHour(now)) {
    target.setHours(ZEN_DAY_AUTO_EXIT_HOUR, 0, 0, 0);
  } else {
    target.setHours(ZEN_NIGHT_AUTO_EXIT_HOUR, 0, 0, 0);
  }

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = Math.max(target.getTime() - now.getTime(), 0);
  zenModeTimeoutId = window.setTimeout(() => {
    console.log('[Maiaaa] Zen mode auto-exiting at scheduled boundary');
    exitZenMode(true);
  }, delay);

  console.log('[Maiaaa] Zen mode auto-exit scheduled for', target.toString());
}

function ensureZenAudio() {
  if (!zenAudioElement) {
    zenAudioElement = new Audio(ZEN_CHIME_PATH);
    zenAudioElement.preload = 'auto';
    zenAudioElement.loop = false;
    zenAudioElement.addEventListener('ended', () => {
      zenAudioElement.pause();
      zenAudioElement.currentTime = 0;
      stopZenBloom();
    });
  }
  return zenAudioElement;
}

function playZenChime() {
  try {
    const audio = ensureZenAudio();
    audio.currentTime = 0;
    const playPromise = audio.play();
    startZenBloom();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch((err) => {
        console.warn('[Maiaaa] Zen chime playback blocked:', err);
        stopZenBloom();
      });
    }
  } catch (error) {
    console.warn('[Maiaaa] Unable to play zen chime:', error);
    stopZenBloom();
  }
}

function stopZenChime() {
  if (zenAudioElement) {
    zenAudioElement.pause();
    zenAudioElement.currentTime = 0;
  }
  stopZenBloom();
}

function setMoonPressedState(isPressed) {
  const moon = document.getElementById('moonIconContainer');
  if (moon) {
    moon.setAttribute('aria-pressed', String(isPressed));
    moon.setAttribute('aria-label', isPressed ? 'Exit zen mode' : 'Enter zen mode');
  }
}

function enterZenMode() {
  if (zenModeActive) return;
  zenModeActive = true;
  document.body.classList.add('zen-mode');
  setMoonPressedState(true);
  scheduleZenModeAutoExit();
  playZenChime();
  triggerShootingStar();
  console.log('[Maiaaa] Zen mode enabled');
}

function exitZenMode(autoTriggered = false) {
  if (!zenModeActive && !document.body.classList.contains('zen-mode')) {
    setMoonPressedState(false);
    return;
  }
  zenModeActive = false;
  document.body.classList.remove('zen-mode');
  setMoonPressedState(false);
  clearZenModeTimeout();
  stopZenChime();
  stopZenBloom();
  console.log(`[Maiaaa] Zen mode disabled${autoTriggered ? ' (auto)' : ''}`);
}

function toggleZenMode() {
  if (zenModeActive) {
    exitZenMode(false);
  } else {
    enterZenMode();
  }
}

function initZenModeToggle() {
  const moon = document.getElementById('moonIconContainer');
  if (!moon) return;

  document.body.classList.remove('zen-mode');
  zenModeActive = false;
  setMoonPressedState(false);
  console.log('[Maiaaa] Zen toggle ready');

  const handleToggle = () => {
    toggleZenMode();
  };

  moon.addEventListener('click', (e) => {
    e.preventDefault();
    handleToggle();
  });

  moon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  });
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

// Clear mood button and book clasp
function initClearButtons() {
  const clearMoodBtn = document.getElementById("clearMood");
  if (clearMoodBtn) {
    console.log("[Maiaaa] Trash button wired for SELECTION MODE (not clear all)");
    clearMoodBtn.addEventListener("click", () => {
      console.log("[Maiaaa] Trash clicked - toggling selection mode");
      toggleMoodSelectionMode(clearMoodBtn);
    });
  }
  
  const bookClaspBtn = document.getElementById("moodBookClasp");
  if (bookClaspBtn) {
    console.log("[Maiaaa] Book keyhole wired for mood journal");
    bookClaspBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log("[Maiaaa] Keyhole clicked - toggling book state");
      toggleBookState();
    });
  }

  const bookSpine = document.querySelector(".book-spine");
  if (bookSpine) {
    bookSpine.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const section = document.getElementById("moodSection");
      if (section && !section.classList.contains("book-closed")) {
        console.log("[Maiaaa] Spine clicked - closing book");
        toggleBookState();
      }
    });
    bookSpine.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        const section = document.getElementById("moodSection");
        if (section && !section.classList.contains("book-closed")) {
          toggleBookState();
        }
      }
    });
  }
  
  const clearTasksBtn = document.getElementById("clearTasks");
  if (clearTasksBtn) {
    clearTasksBtn.addEventListener("click", () => {
      toggleTasksSelectionMode(clearTasksBtn);
    });
  }
}

// Theme toggle button (hidden, for testing) - Requires triple-click
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    let clickCount = 0;
    let clickTimer = null;
    
    themeToggleBtn.addEventListener("click", () => {
      clickCount++;
      debugLog(`Theme toggle click ${clickCount}/3`);
      
      // Clear existing timer
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      
      // Check if we reached 3 clicks
      if (clickCount === 3) {
        toggleTheme();
        debugLog("✓ Triple-click detected - Theme toggled!");
        clickCount = 0;
        clickTimer = null;
      } else {
        // Reset counter after 1 second if not completed
        clickTimer = setTimeout(() => {
          debugLog(`Triple-click timeout - resetting (was at ${clickCount}/3)`);
          clickCount = 0;
          clickTimer = null;
        }, 1000);
      }
    });
  }
}

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    debugLog("Initializing application...");
    
    // Initialize dynamic background first
    dynamicBackground = new DynamicBackground();
    
    // Apply time-based theme
    applyTheme();
    
    // Initialize card activation system
    initCardActivation();
    
    // Initialize all components
    loadMoods();
    loadMoodBookState(); // Load book state after moods are loaded
    loadReminders();
    loadTasks();
    renderLetters();
    
    // Initialize event listeners
    initMoodEventListeners();
    initReminderEventListeners();
    initTaskEventListeners();
    initClearButtons();
    initEditorKey();
    initThemeToggle();
    
    // Force re-render tasks to remove any old flower elements from cache
    loadTasks();
    
    // Start time display immediately (always visible)
    startTimeDisplay();
    
    // Initialize shooting star system
    initShootingStar();
    
    // Show dashboard immediately
    showDashboard();
    
    debugLog("Application initialized successfully");
  } catch (e) {
    debugError("Initialization failed:", e);
  } finally {
    initZenModeToggle();
  }
});

