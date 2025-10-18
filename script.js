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
  const EDITOR_CODE = "gesanlove";
  
  // Letters from Gesan (easily editable content)
  const LETTERS_DATA = [
    {
      id: "welcome",
      title: "Welcome back, beautiful",
      date: "Today",
      preview: "I hope you're having a wonderful day...",
      content: "Welcome back to your personal space, Maiaaa cantik! I created this little corner of the internet just for you. Take your time, breathe, and remember that you're amazing. Every day is a new opportunity to shine, and I believe in you completely. 💕"
    },
    {
      id: "motivation",
      title: "You've got this",
      date: "Always",
      preview: "Remember how strong you are...",
      content: "Hey beautiful! I know some days feel harder than others, but look at how far you've come. You're stronger than you think, smarter than you know, and more capable than you believe. When things get tough, remember that this too shall pass, and you'll come out even stronger on the other side. I'm cheering for you always! 🌟"
    },
    {
      id: "love",
      title: "Just because",
      date: "Forever",
      preview: "You deserve all the happiness...",
      content: "Just wanted to remind you that you're loved, valued, and appreciated. Not just by me, but by everyone whose life you've touched. Your kindness, your smile, your beautiful spirit - they all matter more than you know. Take care of yourself, because you're precious. Sending you all the love and good vibes! ✨"
    }
  ];

  // ---- ELEMENTS ----
  const timerEl = document.getElementById("timer");
  const greetingEl = document.getElementById("greeting");
  const secretInput = document.getElementById("secretInput");
  const countdownContainer = document.getElementById("countdownContainer");
  const dashboard = document.getElementById("dashboard");

  // New dashboard elements
  const dashboardContent = document.getElementById("dashboardContent");
  const dynamicGreeting = document.getElementById("dynamicGreeting");
  const moodInput = document.getElementById("moodInput");
  const moodTags = document.getElementById("moodTags");
  const lettersContainer = document.getElementById("lettersContainer");

  // Existing elements
  const reminderText = document.getElementById("reminderText");
  const addReminderBtn = document.getElementById("addReminder");
  const reminderList = document.getElementById("reminderList");
  const exportReminders = document.getElementById("exportReminders");
  const importReminders = document.getElementById("importReminders");
  const importFile = document.getElementById("importFile");
  const clearReminders = document.getElementById("clearReminders");

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

  // ---- Dynamic greeting for dashboard ----
  function setDynamicGreeting() {
    if (!dynamicGreeting) return;
    try {
      const hour = new Date().getHours();
      let greeting = "Good evening, beautiful";
      if (hour >= 5 && hour < 12) greeting = "Good morning, sunshine";
      else if (hour >= 12 && hour < 18) greeting = "Good afternoon, lovely";
      
      dynamicGreeting.textContent = greeting;
    } catch (e) { console.error(e); }
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
      const card = document.createElement("div");
      card.className = "letter-card";
      card.style.animationDelay = `${index * 0.1}s`;
      
      card.innerHTML = `
        <div class="letter-header">
          <h3 class="letter-title">${letter.title}</h3>
          <span class="letter-date">${letter.date}</span>
        </div>
        <div class="letter-preview">${letter.preview}</div>
        <div class="letter-content">${letter.content}</div>
      `;
      
      card.addEventListener("click", () => {
        card.classList.toggle("open");
      });
      
      lettersContainer.appendChild(card);
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
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    countdownContainer.style.opacity = "0";
    setTimeout(() => {
      countdownContainer.classList.add("hidden");
      if (dashboard) {
        dashboard.classList.remove("hidden");
        // Show dashboard content with staggered section reveals
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (dashboardContent) {
              dashboardContent.classList.add("visible");
              setTimeout(() => revealSections(), 200);
            }
          }, 40);
        });
      }
    }, 600);
  }

  function revealSections() {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add('visible');
      }, index * 200);
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

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("[init] targetMs:", new Date(targetMs).toString());
      setGreeting();
      setDynamicGreeting();
      loadMoods();
      renderReminders();
      renderLetters();
      start();
    } catch (e) {
      console.error(e);
    }
  });
})();
