const countdownEl = document.getElementById("countdown");
const timerEl = document.getElementById("timer");
const dashboardEl = document.getElementById("dashboard");
const greetingEl = document.getElementById("greeting");
const secretInput = document.getElementById("secretInput");

const TARGET_DATE = new Date("2025-10-19T00:00:00+07:00").getTime();
let clickCount = 0;

// Show greeting
function updateGreeting() {
  const hour = new Date().getHours();
  let text = "Good evening";
  if (hour < 12) text = "Good morning";
  else if (hour < 18) text = "Good afternoon";
  greetingEl.textContent = `${text}, Maiaaa cantik`;
}
updateGreeting();

// Countdown updater
function updateCountdown() {
  const now = new Date().getTime();
  const diff = TARGET_DATE - now;

  if (diff <= 0) {
    showDashboard();
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  timerEl.textContent = 
    `${String(d).padStart(2,"0")} ${String(h).padStart(2,"0")} ${String(m).padStart(2,"0")} ${String(s).padStart(2,"0")}`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Triple-click unlock
timerEl.addEventListener("click", () => {
  clickCount++;
  if (clickCount === 3) {
    secretInput.style.display = "block";
    secretInput.focus();
  }
  setTimeout(() => clickCount = 0, 800);
});

secretInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    if (secretInput.value === "maiacantik") {
      showDashboard();
    }
    secretInput.value = "";
    secretInput.style.display = "none";
  }
});

// Show dashboard
function showDashboard() {
  countdownEl.style.display = "none";
  dashboardEl.style.display = "block";
}
