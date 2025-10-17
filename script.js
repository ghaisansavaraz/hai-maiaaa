const countdown = document.getElementById('countdown');
const dashboard = document.getElementById('dashboard');
const countdownContainer = document.getElementById('countdown-container');
const secretInput = document.getElementById('secret-input');
const remindersList = document.getElementById('reminders');
const addReminderBtn = document.getElementById('add-reminder');
let clickCount = 0;

// 🎯 Countdown target (Jakarta)
let targetDate = new Date('2025-10-19T00:00:00+07:00');

// ⏳ Countdown logic
function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    showDashboard();
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const formatted = `${d.toString().padStart(2, '0')} ${h
    .toString()
    .padStart(2, '0')} ${m.toString().padStart(2, '0')} ${s
    .toString()
    .padStart(2, '0')}`;

  countdown.style.opacity = 0;
  countdown.style.transform = "translateY(10px)";
  setTimeout(() => {
    countdown.textContent = formatted;
    countdown.style.opacity = 1;
    countdown.style.transform = "translateY(0)";
  }, 200);
}

function showDashboard() {
  countdownContainer.classList.add('hidden');
  dashboard.classList.remove('hidden');
  setTimeout(() => {
    dashboard.classList.add('visible');
  }, 100);
  loadReminders();
}

// 🕵️ Hidden bypass
countdown.addEventListener('click', () => {
  clickCount++;
  if (clickCount === 3) {
    secretInput.style.display = 'block';
    secretInput.focus();
  }
});

secretInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (secretInput.value === 'maiacantik') {
      showDashboard();
    }
    secretInput.value = '';
    secretInput.style.display = 'none';
    clickCount = 0;
  }
});

// 🗒 Reminder System
function loadReminders() {
  const stored = JSON.parse(localStorage.getItem('maiaaa_reminders')) || [];
  remindersList.innerHTML = '';
  stored.forEach((text, i) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.className = 'reminder';
    remindersList.appendChild(li);
    setTimeout(() => li.classList.add('visible'), i * 100);
  });
}

function saveReminders() {
  const items = Array.from(remindersList.children).map(li => li.textContent);
  localStorage.setItem('maiaaa_reminders', JSON.stringify(items));
}

addReminderBtn.addEventListener('click', () => {
  const text = prompt('What would you like to remind Maiaa?');
  if (text && text.trim() !== '') {
    const li = document.createElement('li');
    li.textContent = text.trim();
    li.className = 'reminder';
    remindersList.appendChild(li);
    setTimeout(() => li.classList.add('visible'), 50);
    saveReminders();
  }
});

setInterval(updateCountdown, 1000);
updateCountdown();
