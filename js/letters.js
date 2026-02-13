/* Letters Book Management */

import { LETTERS_DATA, debugLog, debugError } from './config.js';

// Book state management
const LETTERS_LOCK_KEY = "maiaaa_letters_lock_v1";
const BOOK_TRANSITION_DURATION = 1200;
let lettersBookClosed = true;
let lettersBookAnimating = false;

// Load letters from config
export function loadLetters() {
  try {
    renderLetters();
    debugLog("Letters loaded successfully");
  } catch (e) {
    debugError("Failed to load letters:", e);
  }
}

// Render letters in the book
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
    const letterPaper = document.createElement("div");
    letterPaper.className = "letter-paper";
    letterPaper.style.animationDelay = `${index * 0.15}s`;
    
    letterPaper.innerHTML = `
      <div class="letter-paper-header">
        <h3 class="letter-paper-title">${escapeHtml(letter.title)}</h3>
        <span class="letter-paper-date">${escapeHtml(letter.date)}</span>
      </div>
      <div class="letter-paper-content">${escapeHtml(letter.content)}</div>
    `;
    
    lettersContainer.appendChild(letterPaper);
  });
  
  debugLog(`Rendered ${LETTERS_DATA.length} letters`);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Apply book state (open/closed)
function applyLettersBookState() {
  const section = document.getElementById("lettersSection");
  if (!section) return;

  const bookShell = section.querySelector(".letters-book-shell");
  const bookCover = section.querySelector(".letters-book-cover");
  const bookInterior = section.querySelector(".letters-book-interior");
  const claspButton = document.getElementById("lettersBookClasp");
  const bookSpine = section.querySelector(".letters-book-spine");

  const isClosed = lettersBookClosed;

  section.classList.toggle("open", !isClosed);
  section.classList.toggle("book-closed", isClosed);
  bookShell?.classList.toggle("open", !isClosed);
  bookCover?.classList.toggle("open", !isClosed);
  bookInterior?.classList.toggle("open", !isClosed);

  if (claspButton) {
    claspButton.setAttribute(
      "aria-label",
      isClosed ? "Open letters book" : "Close letters book"
    );
    claspButton.setAttribute(
      "title",
      isClosed ? "Open letters" : "Close letters"
    );
  }

  if (bookSpine) {
    if (!isClosed) {
      bookSpine.setAttribute("role", "button");
      bookSpine.setAttribute("tabindex", "0");
      bookSpine.setAttribute("aria-label", "Close letters book");
    } else {
      bookSpine.removeAttribute("role");
      bookSpine.removeAttribute("tabindex");
      bookSpine.removeAttribute("aria-label");
    }
  }

  debugLog(`Letters book ${isClosed ? "closed" : "opened"}`);
}

// Toggle book state (open/close)
export function toggleLettersBookState() {
  try {
    if (lettersBookAnimating) return;
    lettersBookAnimating = true;

    const section = document.getElementById("lettersSection");
    const claspButton = document.getElementById("lettersBookClasp");
    if (section) section.classList.add("book-transitioning");
    if (claspButton) claspButton.setAttribute("disabled", "disabled");

    lettersBookClosed = !lettersBookClosed;
    localStorage.setItem(LETTERS_LOCK_KEY, JSON.stringify(lettersBookClosed));
    applyLettersBookState();

    setTimeout(() => {
      lettersBookAnimating = false;
      if (section) section.classList.remove("book-transitioning");
      if (claspButton) claspButton.removeAttribute("disabled");
    }, BOOK_TRANSITION_DURATION);
  } catch (e) {
    debugError("Failed to toggle letters book state:", e);
    lettersBookAnimating = false;
    const claspButton = document.getElementById("lettersBookClasp");
    if (claspButton) claspButton.removeAttribute("disabled");
  }
}

// Load book state from localStorage
function loadLettersBookState() {
  try {
    const stored = localStorage.getItem(LETTERS_LOCK_KEY);
    if (stored !== null) {
      lettersBookClosed = JSON.parse(stored);
    }
  } catch (e) {
    debugError("Failed to load letters book state:", e);
    lettersBookClosed = true;
  }
}

// Initialize letters book
export function initLettersBook() {
  try {
    loadLettersBookState();
    applyLettersBookState();
    debugLog("Letters book initialized");
  } catch (e) {
    debugError("Failed to initialize letters book:", e);
  }
}

// Initialize event listeners
export function initLettersEventListeners() {
  try {
    const claspButton = document.getElementById("lettersBookClasp");
    const section = document.getElementById("lettersSection");
    
    if (claspButton) {
      claspButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLettersBookState();
      });
    }
    
    if (section) {
      const bookSpine = section.querySelector(".letters-book-spine");
      if (bookSpine) {
        bookSpine.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!lettersBookClosed) {
            toggleLettersBookState();
          }
        });
        
        bookSpine.addEventListener("keydown", (e) => {
          if ((e.key === "Enter" || e.key === " ") && !lettersBookClosed) {
            e.preventDefault();
            toggleLettersBookState();
          }
        });
      }
    }
    
    debugLog("Letters event listeners initialized");
  } catch (e) {
    debugError("Failed to initialize letters event listeners:", e);
  }
}
