// Target birthday countdown: October 19, local Jakarta time
const targetDate = new Date('2025-10-19T00:00:00+07:00');

const countdownView = document.getElementById('countdown-view');
const dashboardView = document.getElementById('dashboard-view');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    countdownView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = days;
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ========== Reminder dashboard ==========
const reminderForm = document.getElementById('reminder-form');
const reminderInput = document.getElementById('reminder-input');
const reminderList = document.getElementById('reminder-list');
const exportBtn = document.getElementById('export-reminders');
const importBtn = document.getElementById('import-reminders');
const importFile = document.getElementById('import-file');
const clearBtn = document.getElementById('clear-all');

function loadReminders() {
  const data = localStorage.getItem('maiaa_reminders');
  return data ? JSON.parse(data) : [];
}

function saveReminders(reminders) {
  localStorage.setItem('maiaa_reminders', JSON.stringify(reminders));
}

function renderReminders() {
  const reminders = loadReminders();
  reminderList.innerHTML = '';
  reminders.forEach((text, i) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.addEventListener('click', () => {
      reminders.splice(i, 1);
      saveReminders(reminders);
      renderReminders();
    });
    reminderList.appendChild(li);
  });
}

reminderForm.addEventListener('submit', e => {
  e.preventDefault();
  const value = reminderInput.value.trim();
  if (!value) return;
  const reminders = loadReminders();
  reminders.push(value);
  saveReminders(reminders);
  reminderInput.value = '';
  renderReminders();
});

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(loadReminders(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reminders.json';
  a.click();
});

importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        saveReminders(data);
        renderReminders();
      }
    } catch (err) {
      alert('Invalid file format');
    }
  };
  reader.readAsText(file);
});

clearBtn.addEventListener('click', () => {
  if (confirm('Clear all reminders?')) {
    localStorage.removeItem('maiaa_reminders');
    renderReminders();
  }
});

renderReminders();
