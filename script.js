/* Robust countdown (self-correcting), greeting fade-in, animated bg already handled in CSS.
   - Targets Jakarta midnight Oct 19 2025
   - Works across timezones and devices
   - Triple-click bypass with 'maiacantik'
   - Console logs for debugging
*/

(() => {
  // ---- CONFIG ----
  const TARGET_ISO = "2025-10-19T00:00:00+07:00"; // Jakarta midnight
  const BYPASS_CODE = "maiacantik";
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
  const timerEl = document.getElementById("timer");
  const greetingEl = document.getElementById("greeting");
  const secretInput = document.getElementById("secretInput");
  const countdownContainer = document.getElementById("countdownContainer");
  const dashboard = document.getElementById("dashboard");
  const centerContainer = document.querySelector(".center");

  // New dashboard elements
  const dashboardContent = document.getElementById("dashboardContent");
  const currentTime = document.getElementById("currentTime");
  const currentDate = document.getElementById("currentDate");
  const timeGreeting = document.getElementById("timeGreeting");
  const moodInput = document.getElementById("moodInput");
  const moodTags = document.getElementById("moodTags");
  const lettersContainer = document.getElementById("lettersContainer");

  // Debug element availability
  debugLog("Element availability check:", {
    timerEl: !!timerEl,
    dashboard: !!dashboard,
    dashboardContent: !!dashboardContent,
    currentTime: !!currentTime,
    currentDate: !!currentDate,
    timeGreeting: !!timeGreeting
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
  const criticalElements = { timerEl, countdownContainer, dashboard };
  Object.entries(criticalElements).forEach(([name, element]) => {
    if (!element) {
      debugError(`Critical element ${name} not found!`);
    } else {
      debugLog(`✓ ${name} element found`);
    }
  });

  // ---- Setup target ms robustly ----
  let targetMs = Date.parse(TARGET_ISO);
  if (isNaN(targetMs)) {
    // fallback: manually compute UTC milliseconds for Jakarta midnight
    try {
      const parts = TARGET_ISO.slice(0, 10).split("-").map(Number); // YYYY-MM-DD
      const [y, m, d] = parts;
      // Jakarta midnight UTC = Date.UTC(y,m-1,d,0,0,0) - (7 hours)
      targetMs = Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 3600 * 1000;
      console.warn("[Countdown] used manual targetMs fallback:", new Date(targetMs).toString());
    } catch (e) {
      console.error("[Countdown] failed to build fallback target:", e);
    }
  }
  console.log("[Countdown] target parsed ->", new Date(targetMs).toString());

  // ---- Greeting (with fade-in class) ----
  function setGreeting() {
    try {
      const hour = new Date().getHours();
      let g = "Good evening";
      if (hour >= 5 && hour < 12) g = "Good morning";
      else if (hour >= 12 && hour < 18) g = "Good afternoon";
      greetingEl.textContent = `${g}, Maiaaa cantik`;
      // reveal greeting after slight delay
      requestAnimationFrame(() => {
        setTimeout(() => greetingEl.classList.add("visible"), 500);
      });
    } catch (e) { console.error(e); }
  }

  // ---- Original Light/Dark Background System with Moving Gradients ----
  class DynamicBackground {
    constructor() {
      debugLog("Initializing original light/dark background system...");
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
          gradient: 'linear-gradient(45deg, #ffffff, #e0e0e0, #f0f0f0, #d0d0d0, #ffffff, #c0c0c0, #f8f8f8)'
        };
      } else {
        return { 
          name: 'dark', 
          isLight: false,
          gradient: 'linear-gradient(45deg, #000000, #2a2a2a, #1a1a1a, #333333, #000000, #444444, #111111)'
        };
      }
    }

    updateBackground() {
      const theme = this.getCurrentTheme();
      
      debugLog(`Updating background to ${theme.name} mode`);
      
      // Force override system theme detection
      document.body.style.setProperty('color-scheme', 'dark', 'important');
      document.documentElement.style.setProperty('color-scheme', 'dark', 'important');
      
      // Remove any system theme classes
      document.body.classList.remove('light-mode', 'dark-mode');
      document.documentElement.classList.remove('light-mode', 'dark-mode');
      
      // Let CSS handle the gradient animation - just set theme-specific gradients
      if (theme.isLight) {
        document.body.style.setProperty('background', 'linear-gradient(45deg, #ffffff, #e0e0e0, #f0f0f0, #d0d0d0, #ffffff, #c0c0c0, #f8f8f8)', 'important');
      } else {
        document.body.style.setProperty('background', 'linear-gradient(45deg, #000000, #2a2a2a, #1a1a1a, #333333, #000000, #444444, #111111)', 'important');
      }
      document.body.style.setProperty('background-size', '400% 400%', 'important');
      document.body.style.setProperty('animation', 'gradientMove 6s linear infinite', 'important');
      
      debugLog(`Applied ${theme.name} gradient`);
      console.log('Body background:', document.body.style.background);
      console.log('Body animation:', document.body.style.animation);
      
      // Set text color
      if (theme.isLight) {
        document.body.style.setProperty('color', '#000000', 'important');
      } else {
        document.body.style.setProperty('color', '#ffffff', 'important');
      }
      
      // Apply dashboard theme
      const dashboard = document.getElementById('dashboard');
      if (dashboard) {
        if (theme.isLight) {
          dashboard.classList.add('light-theme');
          debugLog('Applied light theme to dashboard');
        } else {
          dashboard.classList.remove('light-theme');
          debugLog('Applied dark theme to dashboard');
        }
      }
      
      // Apply night theme class for glow effects
      if (theme.isLight) {
        document.body.classList.remove('night-theme');
        debugLog('Removed night-theme class');
      } else {
        document.body.classList.add('night-theme');
        debugLog('Applied night-theme class for time glow');
      }
      
      // Control star visibility
      if (theme.isLight) {
        document.body.classList.add('hide-stars');
        document.body.classList.remove('show-stars');
        debugLog('Stars hidden');
      } else {
        document.body.classList.add('show-stars');
        document.body.classList.remove('hide-stars');
        debugLog('Stars visible');
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

  // Initialize dynamic background
  let dynamicBackground = null;

  // ---- Dynamic greeting for dashboard ----
  // Time Display Functions
  function updateTime() {
    debugLog("updateTime called");
    
    if (!currentTime || !currentDate || !timeGreeting) {
      debugError("Time elements not available for update");
      return;
    }
    
    try {
      const now = new Date();
      
      // Update time (HH:MM:SS)
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      if (currentTime) {
        currentTime.textContent = timeString;
        debugLog("Time updated:", timeString);
      }
      
      // Update date
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (currentDate) {
        currentDate.textContent = dateString;
        debugLog("Date updated:", dateString);
      }
      
      // Update greeting based on time
      const hour = now.getHours();
      let greeting = "Good evening, beautiful";
      if (hour >= 5 && hour < 12) greeting = "Good morning, sunshine";
      else if (hour >= 12 && hour < 18) greeting = "Good afternoon, lovely";
      
      if (timeGreeting) {
        timeGreeting.textContent = greeting;
        debugLog("Greeting updated:", greeting);
      }
      
    } catch (error) {
      debugError("Failed to update time", error);
    }
  }

  function startTimeDisplay() {
    debugLog("Starting time display...");
    debugLog("currentTime element:", currentTime);
    debugLog("currentDate element:", currentDate);
    debugLog("timeGreeting element:", timeGreeting);
    
    if (!currentTime || !currentDate || !timeGreeting) {
      debugError("Time display elements not found!");
      console.error("Missing elements:", {
        currentTime: !!currentTime,
        currentDate: !!currentDate,
        timeGreeting: !!timeGreeting
      });
      return;
    }
    
    // Update immediately
    updateTime();
    
    // Update every second
    setInterval(updateTime, 1000);
    
    debugLog("Time display started successfully");
  }

  // ---- Mood system ----
  function loadMoods() {
    try {
      const moods = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || "[]");
      moodTags.innerHTML = "";
      moods.forEach(mood => {
        const tag = document.createElement("div");
        tag.className = "mood-tag";
        tag.textContent = mood;
        moodTags.appendChild(tag);
      });
    } catch (e) { console.error(e); }
  }

  function saveMood(mood) {
    try {
      const moods = JSON.parse(localStorage.getItem(MOOD_STORAGE_KEY) || "[]");
      if (!moods.includes(mood)) {
        moods.push(mood);
        localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(moods));
        loadMoods();
      }
    } catch (e) { console.error(e); }
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

  // ---- Countdown compute & render ----
  function computeRemaining(msNow = Date.now()) {
    const diff = targetMs - msNow;
    if (diff <= 0) return { total: 0, d: 0, h: 0, m: 0, s: 0 };
    const sec = Math.floor(diff / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { total: diff, d, h, m, s };
  }

  let intervalId = null;
  function renderCountdownOnce() {
    const r = computeRemaining();
    if (r.total <= 0) {
      // ensure it shows 00 ... then show dashboard
      timerEl.textContent = "00 00 00 00";
      showDashboard();
      return;
    }
    // animate update
    timerEl.style.opacity = "0";
    timerEl.style.transform = "translateY(8px)";
    setTimeout(() => {
      timerEl.textContent = `${String(r.d).padStart(2, "0")} ${String(r.h).padStart(2, "0")} ${String(r.m).padStart(2, "0")} ${String(r.s).padStart(2, "0")}`;
      timerEl.style.opacity = "1";
      timerEl.style.transform = "translateY(0)";
    }, 140);
  }

  function start() {
    renderCountdownOnce();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(renderCountdownOnce, 1000);
  }

  // ---- Show dashboard (fade out countdown, fade in dashboard) ----
  function showDashboard() {
    debugLog("Starting dashboard transition...");
    
    if (intervalId) { 
      clearInterval(intervalId); 
      intervalId = null; 
    }
    
    countdownContainer.style.opacity = "0";
    
    setTimeout(() => {
      countdownContainer.classList.add("hidden");
      
      if (dashboard) {
        debugLog("Showing dashboard element...");
        dashboard.classList.remove("hidden");
        
        // Add dashboard-active class to center container for proper layout
        if (centerContainer) {
          centerContainer.classList.add("dashboard-active");
        }
        
        // Force visibility with immediate styles
        dashboard.style.opacity = "1";
        dashboard.style.transform = "translateY(0) scale(1)";
        
        // Show dashboard content with staggered section reveals
        setTimeout(() => {
          if (dashboardContent) {
            debugLog("Showing dashboard content...");
            dashboardContent.classList.add("visible");
            dashboardContent.style.opacity = "1";
            dashboardContent.style.transform = "translateY(0)";
            
            setTimeout(() => {
              debugLog("Revealing sections...");
              revealSections();
              
              // Start time display after dashboard is fully visible
              setTimeout(() => {
                debugLog("Starting time display...");
                startTimeDisplay();
              }, 500);
            }, 300);
          } else {
            debugError("dashboardContent element not found!");
          }
        }, 100);
      } else {
        debugError("dashboard element not found!");
      }
    }, 600);
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

  // ---- Triple-click bypass ----
  let clicks = 0;
  timerEl.addEventListener("click", () => {
    clicks++;
    if (clicks === 3) {
      secretInput.style.display = "block";
      secretInput.focus();
    }
    setTimeout(() => (clicks = 0), 700);
  });
  secretInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = secretInput.value.trim();
      secretInput.value = "";
      secretInput.style.display = "none";
      if (v === BYPASS_CODE) showDashboard();
    }
  });

  // ---- Reminders storage & simple UI ----
  function loadReminders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      reminderList.innerHTML = "";
      arr.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        li.addEventListener("click", () => {
          // remove on click
          const updated = Array.from(reminderList.children).map(n => n.textContent).filter(x => x !== t);
          saveReminders(updated);
          renderReminders();
        });
        reminderList.appendChild(li);
      });
    } catch (e) { console.error(e); }
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

  // clear
  if (clearReminders) {
    clearReminders.addEventListener("click", () => {
      if (confirm("Clear all reminders?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderReminders();
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

  // ---- Event listeners for new features ----
  if (moodInput) {
    moodInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const mood = moodInput.value.trim();
        if (mood) {
          saveMood(mood);
          moodInput.value = "";
        }
      }
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
        <div class="flower-bloom">🌸</div>
      `;
      
      tasksContainer.appendChild(taskItem);
    });
  }
  
  // Make functions globally accessible
  window.toggleTask = toggleTask;
  window.deleteTask = deleteTask;
  window.addTask = addTask;

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", () => {
    try {
      debugLog("Initializing application...");
      debugLog("Target date:", new Date(targetMs).toString());
      
      // Initialize dynamic background first
      dynamicBackground = new DynamicBackground();
      
      // Apply time-based theme
      applyTheme();
      
      // Initialize all components
      if (greetingEl) setGreeting();
      if (moodTags) loadMoods();
      if (reminderList) renderReminders();
      if (lettersContainer) renderLetters();
      
      // Initialize task system
      loadTasks();
      
      // Task event listeners
      const taskText = document.getElementById("taskText");
      const taskDeadline = document.getElementById("taskDeadline");
      const addTaskBtn = document.getElementById("addTask");
      
      if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
          if (taskText) {
            addTask(taskText.value, taskDeadline?.value);
            taskText.value = "";
            if (taskDeadline) taskDeadline.value = "";
          }
        });
      }
      
      if (taskText) {
        taskText.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            addTask(taskText.value, taskDeadline?.value);
            taskText.value = "";
            if (taskDeadline) taskDeadline.value = "";
          }
        });
      }
      
      
      // Start countdown
      if (timerEl && countdownContainer) {
        start();
        debugLog("Countdown started");
      } else {
        debugError("Failed to start countdown - missing elements");
      }
      
      debugLog("Application initialized successfully");
    } catch (e) {
      debugError("Initialization failed:", e);
    }
  });
})();
