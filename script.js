// --- CONFIG ---
const TARGET_LOCAL = "2025-10-19T00:00:00"; // midnight Jakarta time
const JAKARTA_OFFSET = 7 * 60 * 60 * 1000; // GMT+7 in ms
const BYPASS_CODE = "maiacantik";
const STORAGE_KEY = "maiaaa_reminders_v1";

// --- ELEMENTS ---
const countdownEl = document.getElementById("countdown");
const countdownContainer = document.getElementById("countdown-container");
const secretInput = document.getElementById("secret-input");
const dashboard = document.getElementById("dashboard");

// --- TIME ADJUSTMENT ---
const localOffset = new Date().getTimezoneOffset() * 60 * 1000; // in ms
const TARGET_TIME =
  new Date(TARGET_LOCAL).getTime() - localOffset - JAKARTA_OFFSET;

console.log("[Countdown] Target (Jakarta):", TARGET_LOCAL);
console.log("[Countdown] Adjusted local target:", new Date(TARGET_TIME).toString());

// --- COUNTDOWN FUNCTION ---
function updateCountdown() {
  const now = Date.now();
  const diff = TARGET_TIME - now;

  if (isNaN(TARGET_TIME)) {
    countdownEl.textContent = "Invalid date ⚠️";
    console.error("Countdown: TARGET_TIME invalid.");
    return;
  }

  if (diff <= 0) {
    showDashboard();
    return;
  }

  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  countdownEl.textContent =
    `${String(days).padStart(2, "0")} ` +
    `${String(hours).padStart(2, "0")} ` +
    `${String(mins).padStart(2, "0")} ` +
    `${String(secs).padStart(2, "0")}`;
}

function startCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// --- DASHBOARD SHOW ---
function showDashboard() {
  countdownContainer.style.opacity = "0";
  setTimeout(() => {
    countdownContainer.classList.add("hidden");
    dashboard.classList.remove("hidden");
    dashboard.classList.add("visible");
  }, 600);
}

// --- BYPASS SECRET ---
let clicks = 0;
countdownEl.addEventListener("click", () => {
  clicks++;
  if (clicks === 3) {
    secretInput.style.display = "block";
    secretInput.focus();
  }
  setTimeout(() => (clicks = 0), 700);
});

secretInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const code = secretInput.value.trim();
    secretInput.value = "";
    secretInput.style.display = "none";
    if (code === BYPASS_CODE) showDashboard();
  }
});

// --- REMINDER STORAGE (optional) ---
const reminderText = document.getElementById("reminderText");
const addReminder = document.getElementById("addReminder");
const reminderList = document.getElementById("reminderList");

function loadReminders() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  reminderList.innerHTML = "";
  data.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    reminderList.appendChild(li);
  });
}

function saveReminders() {
  const items = Array.from(reminderList.children).map((li) => li.textContent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

if (addReminder) {
  addReminder.addEventListener("click", () => {
    const val = reminderText.value.trim();
    if (val) {
      const li = document.createElement("li");
      li.textContent = val;
      reminderList.appendChild(li);
      reminderText.value = "";
      saveReminders();
    }
  });
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Countdown] Script loaded, starting timer...");
  loadReminders();
  startCountdown();
});
