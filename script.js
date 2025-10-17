/* script.js
   Handles:
   - Countdown timer to target date (Asia/Jakarta)
   - Auto-switch to dashboard when countdown ends (or user can skip)
   - Reminder board (add/edit/delete, store in localStorage)
   - Export/Import reminders (JSON)
   - Light/Dark toggle (overrides system pref if used)
*/

/* -------------------------
   Configuration / Defaults
   -------------------------*/

// USER INFO / change here if needed
const PERSON_NAME = "Maiaaa";

// TARGET BIRTHDAY: default set to Oct 19, 2025 00:00 in Asia/Jakarta.
// If you want a time of day, change the time portion (e.g., "2025-10-19T08:00:00+07:00")
const BIRTHDAY_ISO = "2025-10-19T00:00:00+07:00"; // ISO string with Jakarta offset (+07:00)

// localStorage key
const STORAGE_KEY = "maiaaa.reminders.v1";

/* -------------------------
   Node references
   -------------------------*/
const countdownView = document.getElementById("countdown-view");
const dashboardView = document.getElementById("dashboard-view");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const skipBtn = document.getElementById("skip-to-dashboard");
const greetingEl = document.getElementById("greeting");
const reminderForm = document.getElementById("reminder-form");
const reminderInput = document.getElementById("reminder-input");
const reminderList = document.getElementById("reminder-list");
const exportBtn = document.getElementById("export-reminders");
const importBtn = document.getElementById("import-reminders");
const importFile = document.getElementById("import-file");
const clearAllBtn = document.getElementById("clear-all");
const quoteEl = document.getElementById("today-quote");
const toggleThemeBtn = document.getElementById("toggle-theme");

/* -------------------------
   Utility helpers
   -------------------------*/
const parseISOToDate = iso => new Date(iso);
const now = () => new Date();

/* -------------------------
   Countdown logic
   -------------------------*/
const targetDate = parseISOToDate(BIRTHDAY_ISO);

function getRemaining(msTarget = targetDate) {
  const t = msTarget - now();
  if (t <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const seconds = Math.floor((t / 1000) % 60);
  const minutes = Math.floor((t / 1000 / 60) % 60);
  const hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  const days = Math.floor(t / (1000 * 60 * 60 * 24));
  return { total: t, days, hours, minutes, seconds };
}

let countdownInterval = null;
function startCountdown() {
  updateCountdown(); // immediate
  countdownInterval = setInterval(() => {
    updateCountdown();
  }, 1000);
}

function updateCountdown() {
  const rem = getRemaining();
  daysEl.textContent = String(rem.days);
  hoursEl.textContent = String(rem.hours).padStart(2, "0");
  minutesEl.textContent = String(rem.minutes).padStart(2, "0");
  secondsEl.textContent = String(rem.seconds).padStart(2, "0");

  if (rem.total <= 0) {
    clearInterval(countdownInterval);
    // small delay then show dashboard
    setTimeout(() => showDashboard(true), 500);
  }
}

/* -------------------------
   View switching
   -------------------------*/
function showDashboard(isAfterCountdown = false) {
  // set greeting
  greetingEl.textContent = isAfterCountdown
    ? `Happy Birthday ${PERSON_NAME}!`
    : `Hello ${PERSON_NAME} — Dashboard`;

  // show dashboard and hide countdown with simple fade
  countdownView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  dashboardView.setAttribute("aria-hidden", "false");
  // load reminders
  loadRemindersToUI();
}

/* skip button */
skipBtn.addEventListener("click", () => showDashboard(false));

/* -------------------------
   Simple daily quote (local list)
   -------------------------*/
const QUOTES = [
  "Make today kind. — small reminder",
  "You are loved. Remember to smile.",
  "Little moments, big memories.",
  "Do something that makes you proud today."
];
function pickQuote() {
  const idx = Math.floor(Math.random() * QUOTES.length);
  quoteEl.textContent = QUOTES[idx];
}
pickQuote();

/* -------------------------
   Reminders: model + UI
   -------------------------*/
function loadReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to read reminders:", err);
    return [];
  }
}

function saveReminders(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function createReminderObject(text) {
  return {
    id: Date.now().toString(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
    done: false
  };
}

/* UI rendering */
function loadRemindersToUI() {
  const list = loadReminders();
  reminderList.innerHTML = "";
  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No reminders. Add one above ✨";
    empty.style.color = getComputedStyle(document.documentElement).getPropertyValue("--muted");
    reminderList.appendChild(empty);
    return;
  }

  list.forEach(item => {
    const li = document.createElement("li");
    li.className = "reminder-item";
    li.dataset.id = item.id;

    const text = document.createElement("div");
    text.className = "reminder-text";
    text.textContent = item.text;
    if (item.done) text.style.textDecoration = "line-through";

    const actions = document.createElement("div");
    actions.className = "reminder-actions";

    const doneBtn = document.createElement("button");
    doneBtn.className = "btn small";
    doneBtn.textContent = item.done ? "Undo" : "Done";
    doneBtn.addEventListener("click", () => toggleDone(item.id));

    const editBtn = document.createElement("button");
    editBtn.className = "btn small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => promptEdit(item.id));

    const delBtn = document.createElement("button");
    delBtn.className = "btn small danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteReminder(item.id));

    actions.append(doneBtn, editBtn, delBtn);
    li.append(text, actions);
    reminderList.appendChild(li);
  });
}

/* actions */
function addReminder(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const list = loadReminders();
  list.unshift(createReminderObject(trimmed)); // newest first
  saveReminders(list);
  loadRemindersToUI();
}

function deleteReminder(id) {
  const list = loadReminders().filter(r => r.id !== id);
  saveReminders(list);
  loadRemindersToUI();
}

function toggleDone(id) {
  const list = loadReminders().map(r => r.id === id ? {...r, done: !r.done} : r);
  saveReminders(list);
  loadRemindersToUI();
}

function promptEdit(id) {
  const list = loadReminders();
  const item = list.find(r => r.id === id);
  if (!item) return;
  const newVal = prompt("Edit reminder:", item.text);
  if (newVal === null) return; // cancelled
  item.text = newVal.trim();
  saveReminders(list);
  loadRemindersToUI();
}

/* form submit */
reminderForm.addEventListener("submit", e => {
  e.preventDefault();
  addReminder(reminderInput.value);
  reminderInput.value = "";
  reminderInput.focus();
});

/* clear all */
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all reminders? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  loadRemindersToUI();
});

/* export / import */
exportBtn.addEventListener("click", () => {
  const data = loadReminders();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maiaaa-reminders-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Invalid format");
    // basic validation of reminders
    const sanitized = data.map(d => ({
      id: d.id || Date.now().toString() + Math.random().toString(36).slice(2,8),
      text: String(d.text || "").trim(),
      createdAt: d.createdAt || new Date().toISOString(),
      done: !!d.done
    })).filter(d => d.text);
    saveReminders(sanitized);
    loadRemindersToUI();
    importFile.value = "";
  } catch (err) {
    alert("Failed to import: " + err.message);
  }
});

/* -------------------------
   Theme toggle (optional override)
   -------------------------*/
function setThemePreference(pref) {
  // pref: "light" | "dark" | null to reset to system
  if (pref === "light") {
    document.documentElement.style.colorScheme = "light";
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("maiaaa.theme", "light");
  } else if (pref === "dark") {
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("maiaaa.theme", "dark");
  } else {
    document.documentElement.style.colorScheme = "";
    document.documentElement.dataset.theme = "";
    localStorage.removeItem("maiaaa.theme");
  }
}

toggleThemeBtn.addEventListener("click", () => {
  const cur = localStorage.getItem("maiaaa.theme");
  if (cur === "dark") setThemePreference("light");
  else if (cur === "light") setThemePreference(null);
  else setThemePreference("dark");
});

/* on load, restore theme */
(function restoreTheme() {
  const pref = localStorage.getItem("maiaaa.theme");
  if (pref) setThemePreference(pref);
})();

/* -------------------------
   Init
   -------------------------*/
function init() {
  // personalize title
  document.title = `${PERSON_NAME} • Birthday Dashboard`;
  document.getElementById("countdown-title").textContent = `Countdown to ${PERSON_NAME}'s Birthday`;
  document.getElementById("next-event").textContent = `Birthday: ${new Date(BIRTHDAY_ISO).toLocaleDateString()}`;

  // start countdown
  startCountdown();

  // show dashboard immediately if birthday passed
  if (getRemaining().total <= 0) {
    showDashboard(true);
  }
}

init();
