/* Reminder System */

import { STORAGE_KEY, debugLog, debugError } from './config.js';

// Copy to Clipboard with fallback
function copyToClipboard(text, buttonEl) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showCopySuccess(buttonEl);
        debugLog("Copied to clipboard:", text);
      })
      .catch((err) => {
        debugError("Clipboard API failed, using fallback", err);
        fallbackCopy(text, buttonEl);
      });
  } else {
    fallbackCopy(text, buttonEl);
  }
}

function fallbackCopy(text, buttonEl) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showCopySuccess(buttonEl);
    debugLog("Copied via fallback:", text);
  } catch (e) {
    debugError("Failed to copy:", e);
    alert("Failed to copy to clipboard");
  }
}

function showCopySuccess(buttonEl) {
  if (!buttonEl) return;
  const originalContent = buttonEl.textContent;
  buttonEl.textContent = "✓";
  buttonEl.classList.add("success");
  setTimeout(() => {
    buttonEl.textContent = originalContent;
    buttonEl.classList.remove("success");
  }, 1500);
}

// Edit Reminder Functionality
function makeEditable(textEl, contentWrapper, index) {
  const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const originalText = arr[index];
  
  // Create input element
  const input = document.createElement("input");
  input.type = "text";
  input.className = "reminder-text-input";
  input.value = originalText;
  
  // Replace text with input
  contentWrapper.innerHTML = "";
  contentWrapper.appendChild(input);
  input.focus();
  input.select();
  
  // Save function
  const save = () => {
    const newText = input.value.trim();
    if (newText && newText !== originalText) {
      arr[index] = newText;
      saveReminders(arr);
      renderReminders();
    } else {
      renderReminders();
    }
  };
  
  // Cancel function
  const cancel = () => {
    renderReminders();
  };
  
  // Event listeners
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });
  
  input.addEventListener("blur", () => {
    setTimeout(save, 100);
  });
}

// Load and display reminders
export function loadReminders() {
  const reminderList = document.getElementById("reminderList");
  if (!reminderList) return;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    reminderList.innerHTML = "";
    
    // Show empty state if no reminders
    if (arr.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "reminders-empty-state";
      emptyState.innerHTML = `
        <div class="reminders-empty-icon">∅</div>
        <div class="reminders-empty-text">No reminders for Maia cantik yet, add one?</div>
      `;
      reminderList.appendChild(emptyState);
      return;
    }
    
    arr.forEach((reminderText, index) => {
      // Create card container
      const card = document.createElement("div");
      card.className = "reminder-card";
      card.addEventListener("click", () => {
        card.classList.toggle("active");
      });
      
      // Staggered animation delay
      card.style.animationDelay = `${index * 0.05}s`;
      
      // Create content wrapper
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "reminder-card-content";
      
      // Create text element
      const textEl = document.createElement("p");
      textEl.className = "reminder-text";
      textEl.textContent = reminderText;
      textEl.setAttribute("title", "Double-click to edit");
      
      // Double-click to edit
      textEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        makeEditable(textEl, contentWrapper, index);
      });
      
      contentWrapper.appendChild(textEl);
      
      // Create actions container
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "reminder-card-actions";
      
      // Create copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "btn-icon btn-copy";
      copyBtn.textContent = "⎘";
      copyBtn.setAttribute("aria-label", "Copy reminder");
      copyBtn.setAttribute("title", "Copy to clipboard");
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(reminderText, copyBtn);
      });
      
      // Create delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-icon btn-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", "Delete reminder");
      deleteBtn.setAttribute("title", "Delete reminder");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteReminder(card, index);
      });
      
      // Assemble the card
      actionsContainer.appendChild(copyBtn);
      actionsContainer.appendChild(deleteBtn);
      card.appendChild(contentWrapper);
      card.appendChild(actionsContainer);
      reminderList.appendChild(card);
    });
  } catch (e) { 
    debugError("Failed to load reminders:", e);
  }
}

// Delete with animation
function deleteReminder(cardEl, index) {
  // Add removing class for animation
  cardEl.classList.add("removing");
  
  // Wait for animation to complete
  setTimeout(() => {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = arr.filter((_, i) => i !== index);
    saveReminders(updated);
    renderReminders();
  }, 400); // Match animation duration
}

function saveReminders(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function renderReminders() { 
  loadReminders(); 
}

export function initReminderEventListeners() {
  const reminderText = document.getElementById("reminderText");
  const addReminderBtn = document.getElementById("addReminder");
  const exportReminders = document.getElementById("exportReminders");
  const importReminders = document.getElementById("importReminders");
  const importFile = document.getElementById("importFile");
  
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

  // Clear all removed (individual delete only)

  // Export
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

  // Import
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
}

