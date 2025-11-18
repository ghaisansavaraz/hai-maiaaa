/* Mood System */

import { MOOD_STORAGE_KEY, debugLog, debugError } from './config.js';

// Lock state storage key
const MOOD_LOCK_KEY = "maiaaa_mood_locked_v1";

// Selection mode state
let moodSelectionMode = false;
let selectedMoodIds = new Set();

// Lock state
let moodLocked = false;

export function toggleMoodSelectionMode(triggerBtn) {
  try {
    if (!moodSelectionMode) {
      moodSelectionMode = true;
      selectedMoodIds.clear();
      const section = document.getElementById("moodSection");
      if (section) section.classList.add("selection-mode");
      if (triggerBtn) {
        triggerBtn.classList.add("is-selection-mode");
        console.log("[Maiaaa] ✓ Added is-selection-mode class to trash button");
        console.log("[Maiaaa] Trash button classes:", triggerBtn.className);
      }
      debugLog("Mood selection mode enabled");
      loadMoods();
      // ESC to cancel
      const escHandler = (e) => {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", escHandler);
          cancelMoodSelection(triggerBtn);
        }
      };
      document.addEventListener("keydown", escHandler);
    } else {
      // Confirm deletion if any selected, otherwise exit selection mode
      if (selectedMoodIds.size > 0) {
        if (confirm(`Delete ${selectedMoodIds.size} selected mood${selectedMoodIds.size > 1 ? 's' : ''}?`)) {
          deleteSelectedMoods();
        }
      } else {
        cancelMoodSelection(triggerBtn);
      }
    }
  } catch (e) {
    debugError("Failed to toggle mood selection mode:", e);
  }
}

function cancelMoodSelection(triggerBtn) {
  moodSelectionMode = false;
  selectedMoodIds.clear();
  const section = document.getElementById("moodSection");
  if (section) section.classList.remove("selection-mode");
  if (triggerBtn) triggerBtn.classList.remove("is-selection-mode");
  loadMoods();
  debugLog("Mood selection mode cancelled");
}

function deleteSelectedMoods() {
  try {
    const moods = migrateMoodData();
    const updated = moods.filter(m => !selectedMoodIds.has(String(m.id)));
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(updated));
    moodSelectionMode = false;
    selectedMoodIds.clear();
    const section = document.getElementById("moodSection");
    if (section) section.classList.remove("selection-mode");
    const triggerBtn = document.getElementById("clearMood");
    if (triggerBtn) triggerBtn.classList.remove("is-selection-mode");
    loadMoods();
    debugLog("Deleted selected moods");
  } catch (e) {
    debugError("Failed to delete selected moods:", e);
  }
}

// Data migration: Convert old string array to new object format with categories
function migrateMoodData() {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    
    // Check if data needs category migration
    let needsCategoryMigration = false;
    if (data.length > 0 && typeof data[0] === 'object') {
      needsCategoryMigration = !data[0].hasOwnProperty('category');
    }
    
    // Migrate old string array to new object format
    if (data.length > 0 && typeof data[0] === 'string') {
      debugLog("Migrating mood data from old string format...");
      const migratedData = data.map((mood, index) => ({
        id: Date.now() + index,
        mood: mood,
        category: "Calm", // Default category for old moods
        intensity: "medium",
        note: "",
        timestamp: new Date(Date.now() - (data.length - index) * 3600000).toISOString()
      }));
      
      localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(migratedData));
      debugLog("✓ Mood data migrated to object format:", migratedData.length, "moods");
      return migratedData;
    }
    
    // Add category to existing object-format moods
    if (needsCategoryMigration) {
      debugLog("Adding category field to existing moods...");
      data.forEach(mood => {
        if (!mood.category) {
          mood.category = "Calm"; // Default category
        }
      });
      localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(data));
      debugLog("✓ Category field added to", data.length, "moods");
    }
    
    return data;
    
  } catch (e) {
    debugError("Mood migration failed:", e);
    return [];
  }
}

// Format timestamp to relative time
function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return 'Yesterday';
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

// Calculate mood analytics with category breakdown
function calculateMoodAnalytics(moods) {
  if (moods.length === 0) return null;
  
  const today = new Date().toDateString();
  const todayMoods = moods.filter(m => new Date(m.timestamp).toDateString() === today);
  
  // Category counts
  const categoryCounts = {};
  todayMoods.forEach(m => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });
  
  // Most felt category
  const mostFeltCategory = Object.keys(categoryCounts).length > 0 
    ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
    : null;
  
  return {
    mostFeltCategory: mostFeltCategory ? mostFeltCategory[0] : null,
    mostFeltCount: mostFeltCategory ? mostFeltCategory[1] : 0,
    rangeToday: todayMoods.length,
    totalMoods: moods.length,
    categoryCounts
  };
}

// Update mood analytics display with category breakdown
function updateMoodAnalytics(moods) {
  const analytics = document.getElementById("moodAnalytics");
  if (!analytics) return;
  
  const stats = calculateMoodAnalytics(moods);
  if (!stats) {
    analytics.style.display = "none";
    return;
  }
  
  analytics.style.display = "flex";
  
  const mostFeltEl = analytics.querySelector(".mood-stat-most");
  const rangeEl = analytics.querySelector(".mood-stat-range");
  
  if (mostFeltEl && stats.mostFeltCategory) {
    mostFeltEl.innerHTML = `Most felt: <span>${stats.mostFeltCategory} (${stats.mostFeltCount})</span>`;
  }
  
  if (rangeEl) {
    const categoryText = Object.entries(stats.categoryCounts)
      .map(([cat, count]) => `${count} ${cat}`)
      .join(', ');
    rangeEl.innerHTML = `Today: <span>${categoryText || 'No moods yet'}</span>`;
  }
}

// Cycle mood intensity
function cycleMoodIntensity(id) {
  try {
    const moods = migrateMoodData();
    const mood = moods.find(m => m.id === id);
    if (!mood) return;
    
    const intensities = ["light", "medium", "strong"];
    const currentIndex = intensities.indexOf(mood.intensity);
    const nextIndex = (currentIndex + 1) % intensities.length;
    
    mood.intensity = intensities[nextIndex];
    
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(moods));
    loadMoods();
    
    debugLog(`Mood intensity changed to: ${mood.intensity}`);
  } catch (e) {
    debugError("Failed to cycle intensity:", e);
  }
}

// Edit mood note
function editMoodNote(id) {
  try {
    const moods = migrateMoodData();
    const mood = moods.find(m => m.id === id);
    if (!mood) return;
    
    const note = prompt(`Add a note for "${mood.mood}":`, mood.note || "");
    if (note !== null) {
      mood.note = note.trim();
      localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(moods));
      loadMoods();
      debugLog(`Note ${note ? 'added' : 'removed'} for mood: ${mood.mood}`);
    }
  } catch (e) {
    debugError("Failed to edit note:", e);
  }
}

// Load and render moods
export function loadMoods() {
  try {
    const moods = migrateMoodData();
    const moodTags = document.getElementById("moodTags");
    if (!moodTags) return;
    
    moodTags.innerHTML = "";
    
    if (moods.length === 0) {
      // Empty state
      const emptyState = document.createElement("div");
      emptyState.className = "mood-empty-state";
      emptyState.innerHTML = `
        <div class="mood-empty-icon">∅</div>
        <div class="mood-empty-text">How is Maia feeling?</div>
      `;
      moodTags.appendChild(emptyState);
      
      // Hide analytics
      const analytics = document.getElementById("moodAnalytics");
      if (analytics) analytics.style.display = "none";
      return;
    }
    
    // Sort by timestamp (newest first)
    const sortedMoods = [...moods].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedMoods.forEach((moodData, index) => {
      const tag = document.createElement("div");
      tag.className = `mood-tag intensity-${moodData.intensity} ${moodSelectionMode ? 'selectable' : ''} ${selectedMoodIds.has(String(moodData.id)) ? 'selected' : ''}`;
      tag.setAttribute("data-id", moodData.id);
      tag.setAttribute("data-category", moodData.category || "Calm");
      tag.style.animationDelay = `${index * 0.05}s`;
      
      // Mood text
      const moodText = document.createElement("span");
      moodText.className = "mood-tag-text";
      moodText.textContent = moodData.mood;
      tag.appendChild(moodText);
      
      // Category label (visible)
      const categoryLabel = document.createElement("div");
      categoryLabel.className = "mood-category-label";
      categoryLabel.textContent = moodData.category || "Calm";
      tag.appendChild(categoryLabel);
      
      // Timestamp
      const timestamp = document.createElement("div");
      timestamp.className = "mood-timestamp";
      timestamp.textContent = formatTimeAgo(moodData.timestamp);
      tag.appendChild(timestamp);
      
      // Note indicator
      if (moodData.note) {
        const noteIndicator = document.createElement("div");
        noteIndicator.className = "mood-note-indicator";
        tag.appendChild(noteIndicator);
        
        // Tooltip with note and category
        tag.setAttribute("title", `${moodData.category}: ${moodData.note}`);
      } else {
        // Just category tooltip
        tag.setAttribute("title", moodData.category);
      }
      
      // Selection overlay checkbox
      if (moodSelectionMode) {
        const sel = document.createElement("div");
        sel.className = "select-overlay";
        sel.textContent = selectedMoodIds.has(String(moodData.id)) ? '✓' : '';
        tag.appendChild(sel);
      }
      
      // Click behavior: selection or intensity
      tag.addEventListener("click", (e) => {
        if (moodSelectionMode) {
          const idStr = String(moodData.id);
          if (selectedMoodIds.has(idStr)) {
            selectedMoodIds.delete(idStr);
            tag.classList.remove("selected");
            console.log(`[Maiaaa] Deselected mood ${idStr}. Selected count: ${selectedMoodIds.size}`);
            const overlay = tag.querySelector(".select-overlay");
            if (overlay) overlay.textContent = '';
          } else {
            selectedMoodIds.add(idStr);
            tag.classList.add("selected");
            console.log(`[Maiaaa] ✓ Selected mood ${idStr}`);
            console.log(`[Maiaaa] Classes:`, tag.className);
            console.log(`[Maiaaa] Computed animation:`, window.getComputedStyle(tag).animation);
            console.log(`[Maiaaa] Total selected: ${selectedMoodIds.size}`);
            const overlay = tag.querySelector(".select-overlay");
            if (overlay) overlay.textContent = '✓';
          }
        } else {
          if (e.detail === 1) {
            cycleMoodIntensity(moodData.id);
          }
        }
      });
      
      // Double-click to edit note
      tag.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (!moodSelectionMode) {
          editMoodNote(moodData.id);
        }
      });
      
      moodTags.appendChild(tag);
    });
    
    // Update analytics
    updateMoodAnalytics(moods);
    
  } catch (e) { 
    debugError("Failed to load moods:", e);
  }
}

// Save new mood with category
export function saveMood(moodText, category, intensity = "medium") {
  try {
    const moods = migrateMoodData();
    
    const newMood = {
      id: Date.now(),
      mood: moodText.trim(),
      category: category,
      intensity: intensity,
      note: "",
      timestamp: new Date().toISOString()
    };
    
    moods.unshift(newMood); // Add to beginning (newest first)
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(moods));
    loadMoods();
    
    debugLog("New mood added:", newMood);
  } catch (e) { 
    debugError("Failed to save mood:", e);
  }
}

// Initialize mood event listeners
export function initMoodEventListeners() {
  const moodInput = document.getElementById("moodInput");
  const categoryButtons = document.querySelectorAll(".mood-category");
  const categoryContainer = document.querySelector(".mood-categories");
  const moodTagsContainer = document.getElementById("moodTags");
  
  debugLog(`Found ${categoryButtons.length} category buttons`);
  
  // Show/hide category buttons and mood tags based on input
  if (moodInput) {
    moodInput.addEventListener("input", (e) => {
      const hasText = e.target.value.trim().length > 0;
      
      debugLog(`Input changed, hasText: ${hasText}`);
      
      // Show category buttons, hide mood tags and analytics during input
      const analyticsContainer = document.getElementById("moodAnalytics");
      
      if (hasText) {
        // Show categories
        if (categoryContainer) {
          categoryContainer.classList.add("visible");
          debugLog("✓ Added .visible class to category container");
          debugLog("Category container classes:", categoryContainer.className);
        }
        
        // Hide mood tags and analytics
        if (moodTagsContainer) {
          moodTagsContainer.classList.add("hidden");
          debugLog("✓ Hidden mood tags");
        }
        if (analyticsContainer) {
          analyticsContainer.classList.add("hidden");
          debugLog("✓ Hidden analytics");
        }
        
        // Enable category buttons with animation restart
        categoryButtons.forEach((btn, i) => {
          btn.disabled = false;
          debugLog(`✓ Enabled button ${i}: ${btn.getAttribute('data-category')}`);
          // Restart animation for smooth appearance
          btn.style.animation = 'none';
          requestAnimationFrame(() => {
            btn.style.animation = '';
          });
        });
        
        debugLog("✅ Category buttons enabled and shown with glows");
        debugLog("Button count:", categoryButtons.length);
      } else {
        // Hide categories
        if (categoryContainer) {
          categoryContainer.classList.remove("visible");
        }
        
        // Show mood tags and analytics
        if (moodTagsContainer) moodTagsContainer.classList.remove("hidden");
        if (analyticsContainer) analyticsContainer.classList.remove("hidden");
        
        // Disable category buttons
        categoryButtons.forEach(btn => {
          btn.disabled = true;
        });
        
        debugLog("Category buttons disabled and hidden");
      }
    });
    
    // Prevent Enter key from doing anything
    moodInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission
        // Do nothing - user must click a category
      }
    });
  }
  
  // Category button clicks
  categoryButtons.forEach((button) => {
    const category = button.getAttribute("data-category");
    debugLog(`Setting up category button: ${category}`);
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (!moodInput || button.disabled) return;
      
      const mood = moodInput.value.trim();
      if (!mood) return;
      
      debugLog(`Category button clicked: ${category} for mood: ${mood}`);
      
      // Save mood with category
      saveMood(mood, category);
      
      // Clear input
      moodInput.value = "";
      
      // Disable buttons and hide categories
      categoryButtons.forEach(btn => {
        btn.disabled = true;
      });
      
      // Hide category buttons, show mood tags and analytics
      const analyticsContainer = document.getElementById("moodAnalytics");
      if (categoryContainer) categoryContainer.classList.remove("visible");
      if (moodTagsContainer) moodTagsContainer.classList.remove("hidden");
      if (analyticsContainer) analyticsContainer.classList.remove("hidden");
      
      // Visual feedback
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "";
      }, 200);
    });
  });
}

// Toggle mood lock state
export function toggleMoodLock() {
  try {
    moodLocked = !moodLocked;
    
    // Save to localStorage
    localStorage.setItem(MOOD_LOCK_KEY, JSON.stringify(moodLocked));
    
    // Update UI
    const section = document.getElementById("moodSection");
    const lockBtn = document.getElementById("lockMood");
    const content = section.querySelector(".card-content");
    
    if (moodLocked) {
      // Lock the section
      section.classList.add("locked");
      if (lockBtn) {
        lockBtn.setAttribute("aria-label", "Unlock mood journal");
        lockBtn.setAttribute("title", "Unlock journal");
      }
      
      // Disable all interactions
      if (content) {
        content.style.pointerEvents = "none";
      }
      
      // Create lock overlay
      const overlay = document.createElement("div");
      overlay.className = "lock-overlay";
      overlay.innerHTML = `
        <svg class="lock-overlay-icon" viewBox="0 0 24 24" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          <path class="lock-body" d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z" fill="currentColor"/>
          <path class="lock-shackle" d="M7 11V7c0-2.76 2.24-5 5-5s5 2.24 5 5v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle class="lock-keyhole" cx="12" cy="16" r="1.5" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <div class="lock-overlay-text">Locked</div>
      `;
      section.appendChild(overlay);
      
      debugLog("Mood journal locked");
    } else {
      // Unlock the section
      section.classList.remove("locked");
      if (lockBtn) {
        lockBtn.setAttribute("aria-label", "Lock mood journal");
        lockBtn.setAttribute("title", "Lock journal");
      }
      
      // Re-enable interactions
      if (content) {
        content.style.pointerEvents = "auto";
      }
      
      // Remove lock overlay
      const overlay = section.querySelector(".lock-overlay");
      if (overlay) {
        overlay.classList.add("unlocking");
        setTimeout(() => overlay.remove(), 600);
      }
      
      debugLog("Mood journal unlocked");
    }
  } catch (e) {
    debugError("Failed to toggle mood lock:", e);
  }
}

// Load mood lock state from localStorage
export function loadMoodLockState() {
  try {
    const stored = localStorage.getItem(MOOD_LOCK_KEY);
    if (stored) {
      moodLocked = JSON.parse(stored);
      
      if (moodLocked) {
        // Apply locked state
        const section = document.getElementById("moodSection");
        const lockBtn = document.getElementById("lockMood");
        const content = section.querySelector(".card-content");
        
        section.classList.add("locked");
        if (lockBtn) {
          lockBtn.setAttribute("aria-label", "Unlock mood journal");
          lockBtn.setAttribute("title", "Unlock journal");
        }
        
        if (content) {
          content.style.pointerEvents = "none";
        }
        
        // Create lock overlay
        const overlay = document.createElement("div");
        overlay.className = "lock-overlay";
        overlay.innerHTML = `
          <svg class="lock-overlay-icon" viewBox="0 0 24 24" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
            <path class="lock-body" d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z" fill="currentColor"/>
            <path class="lock-shackle" d="M7 11V7c0-2.76 2.24-5 5-5s5 2.24 5 5v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
            <circle class="lock-keyhole" cx="12" cy="16" r="1.5" fill="rgba(0,0,0,0.4)"/>
          </svg>
          <div class="lock-overlay-text">Locked</div>
        `;
        section.appendChild(overlay);
        
        debugLog("Mood journal loaded as locked");
      }
    }
  } catch (e) {
    debugError("Failed to load mood lock state:", e);
  }
}

