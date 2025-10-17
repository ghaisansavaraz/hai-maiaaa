const countdownEl = document.getElementById("countdown");
const timerEl = document.getElementById("timer");
const dashboardEl = document.getElementById("dashboard");
const greetingEl = document.getElementById("greeting");
const secretInput = document.getElementById("secretInput");

const TARGET_DATE = new Date("2025-10-19T00:00:00+07:00");
let clickCount = 0;

// --- Greeting ---
function updateGreeting() {
  const hour = new Date().getHours();
  let text = "Good evening";
  if (hour < 12) text = "Good morning";
  else if (hour < 18) text = "Good afternoon";
  greetingEl.textContent = `${text}, Maiaaa cantik`;
}
updateGreeting();

// --- Countdown ---
function updateCountdown() {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();

  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timerEl.textContent = `${String(days).padStart(2,"0")} ${String(hours).padStart(2,"0")} ${String(minutes).padStart(2,"0")} ${String(seconds).padStart(2,"0")}`;
  } else {
    showDashboard();
    clearInterval(interval);
  }
}

const interval = setInterval(updateCountdown, 1000);
updateCountdown();

// --- Secret triple click ---
timerEl.addEventListener("click", () => {
  clickCount++;
  if (clickCount === 3) {
    secretInput.style.display = "block";
    secretInput.focus();
  }
  setTimeout(() => (clickCount = 0), 800);
});

secretInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (secretInput.value === "maiacantik") {
      showDashboard();
    }
    secretInput.value = "";
    secretInput.style.display = "none";
  }
});

// --- Show dashboard ---
function showDashboard() {
  countdownEl.style.display = "none";
  dashboardEl.style.display = "block";
}
