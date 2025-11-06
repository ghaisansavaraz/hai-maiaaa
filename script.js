/* Robust countdown (self-correcting), greeting fade-in, animated bg already handled in CSS.
   - Targets Jakarta midnight Oct 19 2025
   - Works across timezones and devices
   - Triple-click bypass with 'maiacantik'
   - Console logs for debugging
*/

(() => {
  // ---- CONFIG ----
  // Countdown has ended; remove countdown/bypass
  const STORAGE_KEY = "maiaaa_reminders_v1";
  const MOOD_STORAGE_KEY = "maiaaa_mood_v1";
  const TASKS_STORAGE_KEY = "maiaaa_tasks_v1";
  const EDITOR_CODE = "gesanlove";
  const DEBUG_MODE = true; // Set to false in production
  
  // Letters from Gesan (easily editable content)
  const LETTERS_DATA = [
    {
      id: "welcome",
      title: "Welcome back, beautiful",
      date: "Today",
      preview: "I hope you're having a wonderful day...",
      content: "Welcome back to your personal space, Maiaaa cantik! I created this little corner of the internet just for you. Take your time, breathe, and remember that you're amazing. Every day is a new opportunity to shine, and I believe in you completely. 💕",
      icon: "🌅"
    },
    {
      id: "motivation",
      title: "You've got this",
      date: "Always",
      preview: "Remember how strong you are...",
      content: "Hey beautiful! I know some days feel harder than others, but look at how far you've come. You're stronger than you think, smarter than you know, and more capable than you believe. When things get tough, remember that this too shall pass, and you'll come out even stronger on the other side. I'm cheering for you always! 🌟",
      icon: "💌"
    },
    {
      id: "love",
      title: "Just because",
      date: "Forever",
      preview: "You deserve all the happiness...",
      content: "Just wanted to remind you that you're loved, valued, and appreciated. Not just by me, but by everyone whose life you've touched. Your kindness, your smile, your beautiful spirit - they all matter more than you know. Take care of yourself, because you're precious. Sending you all the love and good vibes! ✨",
      icon: "✨"
    }
  ];

  // ---- Debug logging ----
  function debugLog(message, ...args) {
    if (DEBUG_MODE) {
      console.log(`[Maiaaa] ${message}`, ...args);
    }
  }

  function debugError(message, error) {
    if (DEBUG_MODE) {
      console.error(`[Maiaaa] ${message}`, error);
    }
  }

  // ---- ELEMENTS ----
  // Removed countdown elements
  const timerEl = null;
  const greetingEl = null;
  const secretInput = null;
  const countdownContainer = null;
  const dashboard = document.getElementById("dashboard");
  const centerContainer = document.querySelector(".center");

  // New dashboard elements
  const dashboardContent = document.getElementById("dashboardContent");
  const moodInput = document.getElementById("moodInput");
  const moodTags = document.getElementById("moodTags");
  const lettersContainer = document.getElementById("lettersContainer");
  
  // Header clock elements
  const headerCurrentTime = document.getElementById("headerCurrentTime");
  const headerCurrentDate = document.getElementById("headerCurrentDate");
  const headerTimeGreeting = document.getElementById("headerTimeGreeting");

  // Debug element availability
  debugLog("Element availability check:", {
    timerEl: !!timerEl,
    dashboard: !!dashboard,
    dashboardContent: !!dashboardContent,
    headerCurrentTime: !!headerCurrentTime,
    headerCurrentDate: !!headerCurrentDate,
    headerTimeGreeting: !!headerTimeGreeting
  });

  // Existing elements
  const reminderText = document.getElementById("reminderText");
  const addReminderBtn = document.getElementById("addReminder");
  const reminderList = document.getElementById("reminderList");
  const exportReminders = document.getElementById("exportReminders");
  const importReminders = document.getElementById("importReminders");
  const importFile = document.getElementById("importFile");
  const clearReminders = document.getElementById("clearReminders");

  // Validate critical elements
  const criticalElements = { dashboard };
  Object.entries(criticalElements).forEach(([name, element]) => {
    if (!element) {
      debugError(`Critical element ${name} not found!`);
    } else {
      debugLog(`✓ ${name} element found`);
    }
  });

  // Countdown and its greeting removed

  // ---- Shooting Stars System ----
  class ShootingStars {
    constructor() {
      this.shootingStars = document.querySelectorAll('.shooting-star');
      this.startShootingStars();
    }

    startShootingStars() {
      // Initial delay
      setTimeout(() => {
        this.triggerShootingStar();
        // Then every 5 minutes
        setInterval(() => {
          this.triggerShootingStar();
        }, 300000);
      }, 15000); // Start after 15 seconds
    }

    triggerShootingStar() {
      // Only show shooting stars during night time
      if (document.body.classList.contains('show-stars')) {
        const randomStar = this.shootingStars[Math.floor(Math.random() * this.shootingStars.length)];
        
        // Get the star number to determine which animation to use
        const starNumber = randomStar.className.match(/shooting-star-(\d+)/)[1];
        const animationName = `shoot${starNumber}`;
        
        // Reset and trigger animation
        randomStar.style.animation = 'none';
        randomStar.offsetHeight; // Trigger reflow
        randomStar.style.animation = `${animationName} 2s ease-out`;
        
        debugLog(`Shooting star ${starNumber} triggered!`);
      }
    }
  }
  class DynamicBackground {
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

  // Initialize systems
  let dynamicBackground = null;
  let shootingStars = null;

  // ---- Dynamic greeting for dashboard ----
  // Time Display Functions
  let lastTime = ''; // Track time changes for individual digit flipping
  
  function updateTime() {
    debugLog("updateTime called");
    
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
        headerTimeGreeting.textContent = greeting;
        debugLog("Header greeting updated:", greeting);
      }
      
    } catch (error) {
      debugError("Failed to update header time", error);
    }
  }

  function startTimeDisplay() {
    debugLog("Starting header time display...");
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

  // ---- Enhanced Mood System with Migration ----
  
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

  // Load and render moods
  function loadMoods() {
    try {
      const moods = migrateMoodData();
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
        tag.className = `mood-tag intensity-${moodData.intensity}`;
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
        
        // Click to cycle intensity
        tag.addEventListener("click", (e) => {
          if (e.detail === 1) { // Single click
            cycleMoodIntensity(moodData.id);
          }
        });
        
        // Double-click to edit note
        tag.addEventListener("dblclick", (e) => {
          e.preventDefault();
          editMoodNote(moodData.id);
        });
        
        moodTags.appendChild(tag);
      });
      
      // Update analytics
      updateMoodAnalytics(moods);
      
    } catch (e) { 
      debugError("Failed to load moods:", e);
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

  // Save new mood with category
  function saveMood(moodText, category, intensity = "medium") {
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

  // ---- Letters system ----
  function renderLetters() {
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

  // Countdown logic removed

  // ---- Show dashboard (fade out countdown, fade in dashboard) ----
  function showDashboard() {
    // Immediate show (countdown removed)
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

  // Triple-click bypass removed

  // ---- Copy to Clipboard with fallback ----
  function copyToClipboard(text, buttonEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showCopySuccess(buttonEl);
          debugLog("Copied to clipboard:", text);
        })
        .catch((err) => {
          debugError("Clipboard API failed, using fallback", err);
          fallbackCopy(text, buttonEl);
        });
    } else {
      fallbackCopy(text, buttonEl);
    }
  }

  function fallbackCopy(text, buttonEl) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopySuccess(buttonEl);
      debugLog("Copied via fallback:", text);
    } catch (e) {
      debugError("Failed to copy:", e);
      alert("Failed to copy to clipboard");
    }
  }

  function showCopySuccess(buttonEl) {
    if (!buttonEl) return;
    const originalContent = buttonEl.textContent;
    buttonEl.textContent = "✓";
    buttonEl.classList.add("success");
    setTimeout(() => {
      buttonEl.textContent = originalContent;
      buttonEl.classList.remove("success");
    }, 1500);
  }

  // ---- Edit Reminder Functionality ----
  function makeEditable(textEl, contentWrapper, index) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const originalText = arr[index];
    
    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.className = "reminder-text-input";
    input.value = originalText;
    
    // Replace text with input
    contentWrapper.innerHTML = "";
    contentWrapper.appendChild(input);
    input.focus();
    input.select();
    
    // Save function
    const save = () => {
      const newText = input.value.trim();
      if (newText && newText !== originalText) {
        arr[index] = newText;
        saveReminders(arr);
        renderReminders();
      } else {
        renderReminders();
      }
    };
    
    // Cancel function
    const cancel = () => {
      renderReminders();
    };
    
    // Event listeners
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    });
    
    input.addEventListener("blur", () => {
      setTimeout(save, 100);
    });
  }

  // ---- Reminders storage & UI with individual buttons ----
  function loadReminders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      reminderList.innerHTML = "";
      
      // Show empty state if no reminders
      if (arr.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "reminders-empty-state";
        emptyState.innerHTML = `
          <div class="reminders-empty-icon">∅</div>
          <div class="reminders-empty-text">No reminders for Maia cantik yet, add one?</div>
        `;
        reminderList.appendChild(emptyState);
        return;
      }
      
      arr.forEach((reminderText, index) => {
        // Create card container
        const card = document.createElement("div");
        card.className = "reminder-card";
        
        // Staggered animation delay
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Create content wrapper
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "reminder-card-content";
        
        // Create text element
        const textEl = document.createElement("p");
        textEl.className = "reminder-text";
        textEl.textContent = reminderText;
        textEl.setAttribute("title", "Double-click to edit");
        
        // Double-click to edit
        textEl.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          makeEditable(textEl, contentWrapper, index);
        });
        
        contentWrapper.appendChild(textEl);
        
        // Create actions container
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "reminder-card-actions";
        
        // Create copy button
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-icon btn-copy";
        copyBtn.textContent = "⎘";
        copyBtn.setAttribute("aria-label", "Copy reminder");
        copyBtn.setAttribute("title", "Copy to clipboard");
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          copyToClipboard(reminderText, copyBtn);
        });
        
        // Create delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-icon btn-delete";
        deleteBtn.textContent = "✕";
        deleteBtn.setAttribute("aria-label", "Delete reminder");
        deleteBtn.setAttribute("title", "Delete reminder");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteReminder(card, index);
        });
        
        // Assemble the card
        actionsContainer.appendChild(copyBtn);
        actionsContainer.appendChild(deleteBtn);
        card.appendChild(contentWrapper);
        card.appendChild(actionsContainer);
        reminderList.appendChild(card);
      });
    } catch (e) { 
      debugError("Failed to load reminders:", e);
    }
  }
  
  // ---- Delete with animation ----
  function deleteReminder(cardEl, index) {
    // Add removing class for animation
    cardEl.classList.add("removing");
    
    // Wait for animation to complete
    setTimeout(() => {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = arr.filter((_, i) => i !== index);
      saveReminders(updated);
      renderReminders();
    }, 400); // Match animation duration
  }
  function saveReminders(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function renderReminders() { loadReminders(); }

  if (addReminderBtn && reminderText) {
    addReminderBtn.addEventListener("click", () => {
      const v = reminderText.value.trim();
      if (!v) return;
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      arr.push(v);
      saveReminders(arr);
      reminderText.value = "";
      renderReminders();
    });
  }

  // clear reminders
  const clearRemindersBtn = document.getElementById("clearReminders");
  if (clearRemindersBtn) {
    clearRemindersBtn.addEventListener("click", () => {
      if (confirm("Clear all reminders?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderReminders();
      }
    });
  }
  
  // clear mood
  const clearMoodBtn = document.getElementById("clearMood");
  if (clearMoodBtn) {
    clearMoodBtn.addEventListener("click", () => {
      if (confirm("Clear all moods?")) {
        localStorage.removeItem(MOOD_STORAGE_KEY);
        loadMoods();
      }
    });
  }
  
  // clear tasks
  const clearTasksBtn = document.getElementById("clearTasks");
  if (clearTasksBtn) {
    clearTasksBtn.addEventListener("click", () => {
      if (confirm("Clear all tasks?")) {
        localStorage.removeItem(TASKS_STORAGE_KEY);
        tasks = [];
        renderTasks();
      }
    });
  }

  // export
  if (exportReminders) {
    exportReminders.addEventListener("click", () => {
      const data = JSON.stringify(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `maiaaa-reminders-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // import
  if (importReminders && importFile) {
    importReminders.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("invalid");
        saveReminders(data);
        renderReminders();
      } catch {
        alert("Invalid file format");
      } finally {
        importFile.value = "";
      }
    });
  }

  // ---- Event listeners for category-based mood system ----
  function initMoodEventListeners() {
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

  // Hidden editor key (triple-click on dashboard title)
  let editorClicks = 0;
  if (dashboard) {
    dashboard.addEventListener("click", (e) => {
      if (e.target.classList.contains("dash-title")) {
        editorClicks++;
        if (editorClicks === 3) {
          const code = prompt("Enter editor code:");
          if (code === EDITOR_CODE) {
            alert("Editor mode unlocked! You can now edit letters in the code.");
            console.log("Editor mode unlocked. Edit LETTERS_DATA in script.js to modify letters.");
          }
          editorClicks = 0;
        }
        setTimeout(() => (editorClicks = 0), 1000);
      }
    });
  }

  // ---- Time-based theme application ----
  function applyTheme() {
    debugLog("Applying time-based theme (no system light/dark mode)");
    
    // Always use white text for better contrast with dynamic backgrounds
    document.body.style.setProperty('color', '#fff', 'important');
    document.body.classList.remove('light-mode');
    
    // Let dynamic background handle the background
    if (dynamicBackground) {
      dynamicBackground.updateBackground();
      debugLog("Applied time-based dynamic background");
    } else {
      document.body.style.setProperty('background', '#000', 'important');
    }
    
    debugLog("Applied time-based theme - Background changes with time of day");
    console.log("🕐 Time-based theme active - Background adapts to time of day");
  }

  // ---- Smart Task Checklist ----
  let tasks = [];
  
  function formatDeadline(dateStr, timeStr) {
    if (!dateStr && !timeStr) return null;
    
    try {
      let deadline = null;
      
      if (dateStr) {
        // Parse date in YYYY-MM-DD format
        const date = new Date(dateStr + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          deadline = date;
        }
      }
      
      if (timeStr && deadline) {
        // Add time to existing date
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          deadline.setHours(hours, minutes, 0, 0);
        }
      } else if (timeStr && !deadline) {
        // Time only - use today's date
        const today = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
        }
      }
      
      return deadline ? deadline.toISOString() : null;
    } catch (error) {
      debugError("Failed to format deadline:", error);
      return null;
    }
  }
  
  function loadTasks() {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      tasks = stored ? JSON.parse(stored) : [];
      renderTasks();
    } catch (e) {
      console.error("Failed to load tasks:", e);
      tasks = [];
    }
  }
  
  function saveTasks() {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks:", e);
    }
  }
  
  function addTask(text, deadline) {
    if (!text.trim()) return;
    
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      deadline: deadline || null,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    renderTasks();
  }
  
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    }
  }
  
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
  
  function renderTasks() {
    const tasksContainer = document.getElementById("tasksContainer");
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = "";
    
    tasks.forEach(task => {
      const taskItem = document.createElement("div");
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
      if (isOverdue) {
        taskItem.classList.add('overdue');
      }
      
      const deadlineText = task.deadline ? 
        new Date(task.deadline).toLocaleDateString() + ' ' + new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
        'No deadline';
      
      taskItem.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
        <div class="task-text">${task.text}</div>
        <div class="task-deadline">${deadlineText}</div>
      `;
      
      tasksContainer.appendChild(taskItem);
    });
  }
  
  // Make functions globally accessible
  window.toggleTask = toggleTask;
  window.deleteTask = deleteTask;
  window.addTask = addTask;

  // ---- Card Activation System (Show/Hide Controls) ----
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

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", () => {
    try {
      debugLog("Initializing application...");
      
      // Initialize dynamic background first
      dynamicBackground = new DynamicBackground();
      
      // Initialize shooting stars
      shootingStars = new ShootingStars();
      
      // Apply time-based theme
      applyTheme();
      
      // Initialize card activation system
      initCardActivation();
      
      // Initialize all components
      if (greetingEl) setGreeting();
      if (moodTags) loadMoods();
      if (reminderList) renderReminders();
      if (lettersContainer) renderLetters();
      
      // Initialize mood event listeners
      initMoodEventListeners();
      
      // Initialize task system
      loadTasks();
      
      // Force re-render tasks to remove any old flower elements from cache
      renderTasks();
      
      // Task event listeners
      const taskText = document.getElementById("taskText");
      const taskDeadlineDate = document.getElementById("taskDeadlineDate");
      const taskDeadlineTime = document.getElementById("taskDeadlineTime");
      const addTaskBtn = document.getElementById("addTask");
      
      if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
          if (taskText) {
            const deadline = formatDeadline(taskDeadlineDate?.value, taskDeadlineTime?.value);
            addTask(taskText.value, deadline);
            taskText.value = "";
            if (taskDeadlineDate) taskDeadlineDate.value = "";
            if (taskDeadlineTime) taskDeadlineTime.value = "";
          }
        });
      }
      
      if (taskText) {
        taskText.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const deadline = formatDeadline(taskDeadlineDate?.value, taskDeadlineTime?.value);
            addTask(taskText.value, deadline);
            taskText.value = "";
            if (taskDeadlineDate) taskDeadlineDate.value = "";
            if (taskDeadlineTime) taskDeadlineTime.value = "";
          }
        });
      }
      // Countdown removed
      
      // Start time display immediately (always visible)
      startTimeDisplay();
      
      debugLog("Application initialized successfully");
    } catch (e) {
      debugError("Initialization failed:", e);
    }
  });
})();

