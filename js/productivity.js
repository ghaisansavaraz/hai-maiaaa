import { debugLog } from './config.js';

const SMART_SORT_KEY = 'maiaaa_smart_sort_v1';

let smartSortEnabled = JSON.parse(localStorage.getItem(SMART_SORT_KEY) || 'false');
let remindersCache = [];
let tasksCache = [];
let timelineRail = null;
let timelineLabel = null;
let smartToggleBtn = null;
let refreshTasksFn = null;

export function initProductivityMeta() {
  timelineRail = document.getElementById('timelineRail');
  timelineLabel = document.getElementById('timelineTodayLabel');
  smartToggleBtn = document.getElementById('smartSortToggle');
  updateTimelineLabel();
  updateSmartToggleButton();

  if (smartToggleBtn) {
    smartToggleBtn.addEventListener('click', () => {
      smartSortEnabled = !smartSortEnabled;
      localStorage.setItem(SMART_SORT_KEY, JSON.stringify(smartSortEnabled));
      updateSmartToggleButton();
      if (refreshTasksFn) {
        refreshTasksFn();
      }
    });
  }
}

export function registerTaskRefreshHandler(fn) {
  refreshTasksFn = fn;
}

export function setRemindersData(reminders = []) {
  remindersCache = reminders;
  renderTimeline();
}

export function setTasksData(tasks = []) {
  tasksCache = tasks;
  renderTimeline();
}

export function sortTasksForDisplay(tasks = []) {
  if (!smartSortEnabled) return tasks;

  const reminderKeywords = new Map();
  remindersCache.forEach((rem) => {
    const words = rem.text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    words.forEach((word) => {
      if (!reminderKeywords.has(word)) {
        reminderKeywords.set(word, rem.id);
      }
    });
  });

  const scored = tasks.map((task) => {
    let score = 0;
    if (task.deadline) {
      const diff = new Date(task.deadline) - new Date();
      score -= Math.max(0, diff) / 3600000; // sooner deadlines get higher priority
    }
    const taskWords = task.text.toLowerCase().split(/[^a-z0-9]+/);
    taskWords.forEach((word) => {
      if (word.length >= 4 && reminderKeywords.has(word)) {
        score -= 100; // strong boost when sharing keyword with reminder
      }
    });
    return { task, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored.map((entry) => entry.task);
}

export function isSmartSortEnabled() {
  return smartSortEnabled;
}

function updateTimelineLabel() {
  if (!timelineLabel) return;
  const now = new Date();
  timelineLabel.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function updateSmartToggleButton() {
  if (!smartToggleBtn) return;
  smartToggleBtn.setAttribute('aria-pressed', smartSortEnabled ? 'true' : 'false');
  smartToggleBtn.textContent = smartSortEnabled ? 'Link mode: On' : 'Link mode: Off';
}

function renderTimeline() {
  if (!timelineRail) return;
  timelineRail.innerHTML = '';
  const entries = [];

  tasksCache
    .filter((task) => task.deadline)
    .forEach((task) => {
      entries.push({
        type: 'task',
        label: task.text,
        time: new Date(task.deadline),
        meta: new Date(task.deadline).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      });
    });

  remindersCache
    .filter((rem) => rem.pinned)
    .forEach((rem) => {
      entries.push({
        type: 'reminder',
        label: rem.text,
        time: rem.createdAt ? new Date(rem.createdAt) : new Date(),
        meta: rem.tag || 'note'
      });
    });

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'timeline-empty';
    empty.textContent = 'No items yet';
    timelineRail.appendChild(empty);
    return;
  }

  entries.sort((a, b) => a.time - b.time);
  entries.forEach((entry, index) => {
    const pct = ((index + 1) / (entries.length + 1)) * 100;
    const node = document.createElement('div');
    node.className = `timeline-item ${entry.type}`;
    node.style.top = `${pct}%`;

    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    node.appendChild(dot);

    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.innerHTML = `<strong>${entry.type === 'task' ? 'Task' : 'Note'}</strong><br>${entry.label}<br><span>${entry.meta}</span>`;
    node.appendChild(label);

    timelineRail.appendChild(node);
  });
}
