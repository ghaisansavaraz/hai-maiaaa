/* Reminder System */

import { STORAGE_KEY, debugLog, debugError } from './config.js';
import { addTask } from './tasks.js';
import { setRemindersData } from './productivity.js';

const REMINDER_TAGS = [
  { id: 'idea', label: 'Idea' },
  { id: 'note', label: 'Note' },
  { id: 'errand', label: 'Errand' },
  { id: 'mood', label: 'Mood' }
];

let reminders = [];
let selectedTag = REMINDER_TAGS[0].id;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function migrateReminders(raw) {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'object') return raw;
  return raw.map((text) => ({
    id: generateId(),
    text,
    tag: 'note',
    pinned: false,
    createdAt: new Date().toISOString()
  }));
}

export function loadReminders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    reminders = migrateReminders(arr);
    saveReminders();
    renderReminders();
  } catch (e) {
    debugError('Failed to load reminders:', e);
    reminders = [];
  }
}

function saveReminders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  setRemindersData(reminders);
}

function renderTagPalette() {
  const palette = document.getElementById('reminderTagPalette');
  if (!palette) return;
  palette.innerHTML = '';
  REMINDER_TAGS.forEach((tag) => {
    const btn = document.createElement('button');
    btn.className = `tag-pill ${tag.id === selectedTag ? 'active' : ''}`;
    btn.type = 'button';
    btn.textContent = tag.label;
    btn.addEventListener('click', () => {
      selectedTag = tag.id;
      renderTagPalette();
    });
    palette.appendChild(btn);
  });
}

function renderIdeaBoard() {
  const grid = document.getElementById('ideaBoardGrid');
  const count = document.getElementById('ideaCount');
  if (!grid || !count) return;
  const ideas = reminders.filter((rem) => rem.tag === 'idea');
  count.textContent = ideas.length;
  grid.innerHTML = '';
  if (ideas.length === 0) {
    grid.innerHTML = '<div class="idea-card">No ideas yet. Dream something?</div>';
    return;
  }
  ideas.slice(0, 6).forEach((idea) => {
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.textContent = idea.text;
    grid.appendChild(card);
  });
}

function formatRelativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function makeEditable(reminder, contentWrapper) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'reminder-text-input';
  input.value = reminder.text;
  contentWrapper.innerHTML = '';
  contentWrapper.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    const newText = input.value.trim();
    if (newText) {
      reminder.text = newText;
      saveReminders();
      renderReminders();
    } else {
      renderReminders();
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      renderReminders();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(save, 100);
  });
}

function buildReminderCard(reminder, index) {
  const card = document.createElement('div');
  card.className = 'reminder-card';
  card.style.setProperty('--note-tilt', index % 2 === 0 ? '-0.6deg' : '0.5deg');
  card.dataset.tag = reminder.tag;

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'reminder-card-content';

  const meta = document.createElement('div');
  meta.className = 'reminder-meta';
  const tagPill = document.createElement('span');
  tagPill.className = 'reminder-tag-pill';
  tagPill.textContent = REMINDER_TAGS.find((t) => t.id === reminder.tag)?.label || 'Note';
  const timestamp = document.createElement('span');
  timestamp.textContent = formatRelativeTime(reminder.createdAt);
  meta.appendChild(tagPill);
  meta.appendChild(timestamp);

  const textEl = document.createElement('p');
  textEl.className = 'reminder-text';
  textEl.textContent = reminder.text;
  textEl.setAttribute('title', 'Double-click to edit');
  textEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    makeEditable(reminder, contentWrapper);
  });

  contentWrapper.appendChild(meta);
  contentWrapper.appendChild(textEl);

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'reminder-card-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-icon btn-copy';
  copyBtn.textContent = '⎘';
  copyBtn.title = 'Copy to clipboard';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(reminder.text, copyBtn);
  });

  const convertBtn = document.createElement('button');
  convertBtn.className = 'btn-icon btn-convert';
  convertBtn.textContent = '↦';
  convertBtn.title = 'Convert to task';
  convertBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addTask(reminder.text, null);
  });

  const pinBtn = document.createElement('button');
  pinBtn.className = `btn-icon btn-pin ${reminder.pinned ? 'active' : ''}`;
  pinBtn.textContent = reminder.pinned ? '★' : '☆';
  pinBtn.title = reminder.pinned ? 'Unpin from timeline' : 'Pin to timeline';
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    reminder.pinned = !reminder.pinned;
    saveReminders();
    renderReminders();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon btn-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Delete reminder';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteReminder(reminder.id);
  });

  actionsContainer.appendChild(copyBtn);
  actionsContainer.appendChild(convertBtn);
  actionsContainer.appendChild(pinBtn);
  actionsContainer.appendChild(deleteBtn);

  card.appendChild(contentWrapper);
  card.appendChild(actionsContainer);
  return card;
}

function renderReminders() {
  const reminderList = document.getElementById('reminderList');
  if (!reminderList) return;
  reminderList.innerHTML = '';

  if (reminders.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'reminders-empty-state';
    emptyState.innerHTML = `
      <div class="reminders-empty-icon">∅</div>
      <div class="reminders-empty-text">No reminders for Maia cantik yet, add one?</div>
    `;
    reminderList.appendChild(emptyState);
    renderIdeaBoard();
    return;
  }

  reminders.forEach((reminder, index) => {
    const card = buildReminderCard(reminder, index);
    reminderList.appendChild(card);
  });

  renderIdeaBoard();
}

function deleteReminder(id) {
  reminders = reminders.filter((rem) => rem.id !== id);
  saveReminders();
  renderReminders();
}

function copyToClipboard(text, buttonEl) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess(buttonEl);
    }).catch((err) => {
      debugError('Clipboard API failed, using fallback', err);
      fallbackCopy(text, buttonEl);
    });
  } else {
    fallbackCopy(text, buttonEl);
  }
}

function fallbackCopy(text, buttonEl) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopySuccess(buttonEl);
  } catch (e) {
    debugError('Failed to copy:', e);
  }
}

function showCopySuccess(buttonEl) {
  if (!buttonEl) return;
  const original = buttonEl.textContent;
  buttonEl.textContent = '✓';
  setTimeout(() => {
    buttonEl.textContent = original;
  }, 1200);
}

export function initReminderEventListeners() {
  const reminderText = document.getElementById('reminderText');
  const addReminderBtn = document.getElementById('addReminder');
  renderTagPalette();

  if (addReminderBtn && reminderText) {
    addReminderBtn.addEventListener('click', () => {
      const text = reminderText.value.trim();
      if (!text) return;
      const reminder = {
        id: generateId(),
        text,
        tag: selectedTag,
        pinned: selectedTag === 'idea',
        createdAt: new Date().toISOString()
      };
      reminders.unshift(reminder);
      reminderText.value = '';
      saveReminders();
      renderReminders();
      debugLog('Reminder added:', reminder);
    });
  }
}
