/* Working countdown + dashboard + triple-click bypass + reminders persistence */

/* ---------- Config ---------- */
// Jakarta birthday target (change if needed)
const TARGET_ISO = '2025-10-19T00:00:00+07:00';
const TARGET_TIME = new Date(TARGET_ISO).getTime();
const BYPASS_CODE = 'maiacantik';
const STORAGE_KEY = 'maiaaa_reminders_v1';

/* ---------- Elements ---------- */
const countdownEl = document.getElementById('countdown');
const countdownContainer = document.getElementById('countdown-container');
const secretInput = document.getElementById('secret-input');
const dashboard = document.getElementById('dashboard');
const addBtn = document.getElementById('addReminder');
const reminderInput = document.getElementById('reminderText');
const reminderList = document.getElementById('reminderList');
const exportBtn = document.getElementById('exportReminders');
const importBtn = document.getElementById('importReminders');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearReminders');

/* ---------- Countdown logic ---------- */
let timerId = null;
function computeRemaining(nowMs = Date.now(), targetMs = TARGET_TIME) {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { total: 0, d:0, h:0, m:0, s:0 };
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / (24*3600));
  const h = Math.floor((s % (24*3600)) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { total: diff, d, h, m, s: sec };
}

function renderCountdown() {
  const rem = computeRemaining();
  if (rem.total <= 0) {
    // finished
    showDashboard();
    return;
  }
  // format: "03 12 45 09" (days hours minutes seconds)
  const text = `${String(rem.d).padStart(2,'0')} ${String(rem.h).padStart(2,'0')} ${String(rem.m).padStart(2,'0')} ${String(rem.s).padStart(2,'0')}`;

  // graceful animated update
  countdownEl.style.opacity = '0';
  countdownEl.style.transform = 'translateY(8px)';
  setTimeout(() => {
    countdownEl.textContent = text;
    countdownEl.style.opacity = '1';
    countdownEl.style.transform = 'translateY(0)';
  }, 160);
}

function startCountdown() {
  // initial render
  renderCountdown();
  if (timerId) clearInterval(timerId);
  timerId = setInterval(renderCountdown, 1000);
}

/* ---------- View switching ---------- */
function showDashboard() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  countdownContainer.style.opacity = '0';
  setTimeout(() => {
    countdownContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    setTimeout(() => dashboard.classList.add('visible'), 40);
  }, 600);
}

/* ---------- Triple-click bypass ---------- */
let clickCount = 0;
countdownEl.addEventListener('click', () => {
  clickCount++;
  if (clickCount === 3) {
    // reveal small input for security
    secretInput.style.display = 'block';
    secretInput.focus();
  }
  setTimeout(() => (clickCount = 0), 700);
});
secretInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const v = secretInput.value.trim();
    secretInput.value = '';
    secretInput.style.display = 'none';
    if (v === BYPASS_CODE) {
      showDashboard();
    }
  }
});

/* ---------- Reminders (localStorage) ---------- */
function loadReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveReminders(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}
function renderReminders() {
  const items = loadReminders();
  reminderList.innerHTML = '';
  items.forEach((t, i) => {
    const li = document.createElement('li');
    li.textContent = t;
    // click to remove single item (simple UX)
    li.addEventListener('click', () => {
      items.splice(i,1);
      saveReminders(items);
      renderReminders();
    });
    reminderList.appendChild(li);
  });
}
addBtn.addEventListener('click', () => {
  const text = (reminderInput.value || '').trim();
  if (!text) return;
  const arr = loadReminders();
  arr.push(text);
  saveReminders(arr);
  reminderInput.value = '';
  renderReminders();
});
clearBtn && clearBtn.addEventListener('click', () => {
  if (confirm('Clear all reminders?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderReminders();
  }
});

/* export / import */
exportBtn && exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(loadReminders(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `maiaaa-reminders-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
importBtn && importBtn.addEventListener('click', () => importFile.click());
importFile && importFile.addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Invalid');
    saveReminders(data);
    renderReminders();
  } catch {
    alert('Invalid file');
  }
});

/* ---------- Init ---------- */
startCountdown();
renderReminders();
