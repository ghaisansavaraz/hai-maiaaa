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

  // ---- ELEMENTS ----
  const timerEl = document.getElementById("timer");
  const greetingEl = document.getElementById("greeting");
  const secretInput = document.getElementById("secretInput");
  const countdownContainer = document.getElementById("countdownContainer");
  const dashboard = document.getElementById("dashboard");

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
        // small delay to allow CSS transition
        requestAnimationFrame(() => setTimeout(() => dashboard.classList.add("visible"), 40));
      }
    }, 600);
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

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("[init] targetMs:", new Date(targetMs).toString());
      setGreeting();
      renderReminders();
      start();
    } catch (e) {
      console.error(e);
    }
  });
})();
