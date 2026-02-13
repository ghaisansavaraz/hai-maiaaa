/* Letters Card System with Modal */

import { LETTERS_DATA, debugLog, debugError } from './config.js';

// Load letters from config
export function loadLetters() {
  try {
    renderLetters();
    debugLog("Letters loaded successfully");
  } catch (e) {
    debugError("Failed to load letters:", e);
  }
}

// Render letters as cards
function renderLetters() {
  const lettersContainer = document.getElementById("lettersContainer");
  if (!lettersContainer) return;
  
  lettersContainer.innerHTML = "";
  
  if (!LETTERS_DATA || LETTERS_DATA.length === 0) {
    lettersContainer.innerHTML = `
      <div class="no-letters">
        <p>No letters yet. Add some in config.js!</p>
      </div>
    `;
    return;
  }
  
  LETTERS_DATA.forEach((letter, index) => {
    const letterCard = document.createElement("div");
    letterCard.className = "letter-card";
    letterCard.style.animationDelay = `${index * 0.15}s`;
    letterCard.dataset.letterId = letter.id;
    
    // Truncate content for preview
    const previewContent = letter.content.length > 120 
      ? letter.content.substring(0, 120) + "..." 
      : letter.content;
    
    letterCard.innerHTML = `
      <button class="letter-card-ribbon" aria-label="Open letter" data-letter-id="${letter.id}">
        <span class="ribbon-icon">🎀</span>
      </button>
      <div class="letter-card-header">
        <h3 class="letter-card-title">${escapeHtml(letter.title)}</h3>
        <span class="letter-card-date">${escapeHtml(letter.date)}</span>
      </div>
      <div class="letter-card-content">${escapeHtml(previewContent)}</div>
    `;
    
    lettersContainer.appendChild(letterCard);
  });
  
  debugLog(`Rendered ${LETTERS_DATA.length} letters`);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open letter modal
function openLetterModal(letterId) {
  const letter = LETTERS_DATA.find(l => l.id === letterId);
  if (!letter) return;
  
  const modal = document.getElementById("letterModal");
  const modalTitle = modal.querySelector(".letter-modal-title");
  const modalDate = modal.querySelector(".letter-modal-date");
  const modalBody = modal.querySelector(".letter-modal-body");
  
  // Set content
  modalTitle.textContent = letter.title;
  modalDate.textContent = letter.date;
  modalBody.textContent = letter.content;
  
  // Show modal
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  
  debugLog(`Opened letter modal: ${letter.title}`);
}

// Close letter modal
function closeLetterModal() {
  const modal = document.getElementById("letterModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  
  debugLog("Closed letter modal");
}

// Animate ribbon untie
function animateRibbonUntie(ribbonElement) {
  ribbonElement.classList.add("untying");
  setTimeout(() => {
    ribbonElement.classList.remove("untying");
  }, 300);
}

// Initialize card interactions (3D tilt effect)
function initCardInteractions() {
  const cards = document.querySelectorAll(".letter-card");
  
  cards.forEach(card => {
    card.addEventListener("mousemove", handleCardMouseMove);
    card.addEventListener("mouseleave", handleCardMouseLeave);
  });
}

// Handle card mouse move for 3D tilt
function handleCardMouseMove(e) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 768) return; // Disable on mobile
  
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = (y - centerY) / centerY * -5; // Max 5deg
  const rotateY = (x - centerX) / centerX * 5;
  
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
}

// Handle card mouse leave
function handleCardMouseLeave(e) {
  const card = e.currentTarget;
  card.style.transform = "";
}

// Initialize event listeners
export function initLettersEventListeners() {
  try {
    // Ribbon button clicks (delegated)
    document.addEventListener("click", (e) => {
      const ribbonButton = e.target.closest(".letter-card-ribbon");
      if (ribbonButton) {
        e.stopPropagation();
        const letterId = ribbonButton.dataset.letterId;
        animateRibbonUntie(ribbonButton);
        setTimeout(() => {
          openLetterModal(letterId);
        }, 300);
      }
    });
    
    // Modal close button
    const closeButton = document.querySelector(".letter-modal-close");
    if (closeButton) {
      closeButton.addEventListener("click", closeLetterModal);
    }
    
    // Modal backdrop click
    const modal = document.getElementById("letterModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeLetterModal();
        }
      });
    }
    
    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("letterModal");
        if (modal && modal.classList.contains("active")) {
          closeLetterModal();
        }
      }
    });
    
    // Initialize card interactions after render
    setTimeout(() => {
      initCardInteractions();
    }, 100);
    
    debugLog("Letters event listeners initialized");
  } catch (e) {
    debugError("Failed to initialize letters event listeners:", e);
  }
}
