/* Task Management System */

import { TASKS_STORAGE_KEY, debugError } from './config.js';

let tasks = [];

function formatDeadline(dateStr, timeStr) {
  if (!dateStr && !timeStr) return null;
  
  try {
    let deadline = null;
    
    if (dateStr) {
      // Parse date in YYYY-MM-DD format
      const date = new Date(dateStr + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        deadline = date;
      }
    }
    
    if (timeStr && deadline) {
      // Add time to existing date
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        deadline.setHours(hours, minutes, 0, 0);
      }
    } else if (timeStr && !deadline) {
      // Time only - use today's date
      const today = new Date();
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        deadline = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
      }
    }
    
    return deadline ? deadline.toISOString() : null;
  } catch (error) {
    debugError("Failed to format deadline:", error);
    return null;
  }
}

export function loadTasks() {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
  } catch (e) {
    console.error("Failed to load tasks:", e);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
}

export function addTask(text, deadline) {
  if (!text.trim()) return;
  
  const task = {
    id: Date.now().toString(),
    text: text.trim(),
    deadline: deadline || null,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

export function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

export function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// Selection mode state
let tasksSelectionMode = false;
let selectedTaskIds = new Set();

export function toggleTasksSelectionMode(triggerBtn) {
  if (!tasksSelectionMode) {
    tasksSelectionMode = true;
    selectedTaskIds.clear();
    const section = document.getElementById("tasksSection");
    if (section) section.classList.add("selection-mode");
    if (triggerBtn) triggerBtn.classList.add("is-selection-mode");
  } else {
    if (selectedTaskIds.size > 0) {
      if (confirm(`Delete ${selectedTaskIds.size} selected task${selectedTaskIds.size > 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(t => !selectedTaskIds.has(String(t.id)));
        saveTasks();
        tasksSelectionMode = false;
        selectedTaskIds.clear();
        const section = document.getElementById("tasksSection");
        if (section) section.classList.remove("selection-mode");
        if (triggerBtn) triggerBtn.classList.remove("is-selection-mode");
        renderTasks();
        return;
      }
    }
    // Cancel selection mode if nothing selected or not confirmed
    tasksSelectionMode = false;
    selectedTaskIds.clear();
    const section = document.getElementById("tasksSection");
    if (section) section.classList.remove("selection-mode");
    if (triggerBtn) triggerBtn.classList.remove("is-selection-mode");
  }
  renderTasks();
}

function renderTasks() {
  const tasksContainer = document.getElementById("tasksContainer");
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = "";
  
  tasks.forEach(task => {
    const taskItem = document.createElement("div");
    taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${tasksSelectionMode ? 'selectable' : ''} ${selectedTaskIds.has(String(task.id)) ? 'selected' : ''}`;
    
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
    if (isOverdue) {
      taskItem.classList.add('overdue');
    }
    
    const deadlineText = task.deadline ? 
      new Date(task.deadline).toLocaleDateString() + ' ' + new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
      'No deadline';
    
    // Base content
    const checkbox = document.createElement("div");
    checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
    if (!tasksSelectionMode) {
      checkbox.setAttribute("onclick", `toggleTask('${task.id}')`);
    }
    const textEl = document.createElement("div");
    textEl.className = "task-text";
    textEl.textContent = task.text;
    const deadlineEl = document.createElement("div");
    deadlineEl.className = "task-deadline";
    deadlineEl.textContent = deadlineText;
    
    taskItem.appendChild(checkbox);
    taskItem.appendChild(textEl);
    taskItem.appendChild(deadlineEl);
    
    // Selection overlay
    if (tasksSelectionMode) {
      const sel = document.createElement("div");
      sel.className = "select-overlay";
      sel.textContent = selectedTaskIds.has(String(task.id)) ? '✓' : '';
      taskItem.appendChild(sel);
    }
    
    // Click behavior: selection or normal
    taskItem.addEventListener("click", () => {
      if (tasksSelectionMode) {
        const idStr = String(task.id);
        if (selectedTaskIds.has(idStr)) {
          selectedTaskIds.delete(idStr);
          taskItem.classList.remove("selected");
          const overlay = taskItem.querySelector(".select-overlay");
          if (overlay) overlay.textContent = '';
        } else {
          selectedTaskIds.add(idStr);
          taskItem.classList.add("selected");
          const overlay = taskItem.querySelector(".select-overlay");
          if (overlay) overlay.textContent = '✓';
        }
      }
    });
    
    tasksContainer.appendChild(taskItem);
  });
}

export function initTaskEventListeners() {
  const taskText = document.getElementById("taskText");
  const taskDeadlineDate = document.getElementById("taskDeadlineDate");
  const taskDeadlineTime = document.getElementById("taskDeadlineTime");
  const addTaskBtn = document.getElementById("addTask");
  
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      if (taskText) {
        const deadline = formatDeadline(taskDeadlineDate?.value, taskDeadlineTime?.value);
        addTask(taskText.value, deadline);
        taskText.value = "";
        if (taskDeadlineDate) taskDeadlineDate.value = "";
        if (taskDeadlineTime) taskDeadlineTime.value = "";
      }
    });
  }
  
  if (taskText) {
    taskText.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const deadline = formatDeadline(taskDeadlineDate?.value, taskDeadlineTime?.value);
        addTask(taskText.value, deadline);
        taskText.value = "";
        if (taskDeadlineDate) taskDeadlineDate.value = "";
        if (taskDeadlineTime) taskDeadlineTime.value = "";
      }
    });
  }
}

export function clearTasks() {
  tasks = [];
  saveTasks();
  renderTasks();
}

// Make functions globally accessible
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.addTask = addTask;

