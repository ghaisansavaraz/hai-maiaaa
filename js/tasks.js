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

function renderTasks() {
  const tasksContainer = document.getElementById("tasksContainer");
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = "";
  
  tasks.forEach(task => {
    const taskItem = document.createElement("div");
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
    if (isOverdue) {
      taskItem.classList.add('overdue');
    }
    
    const deadlineText = task.deadline ? 
      new Date(task.deadline).toLocaleDateString() + ' ' + new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
      'No deadline';
    
    taskItem.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
      <div class="task-text">${task.text}</div>
      <div class="task-deadline">${deadlineText}</div>
    `;
    
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

