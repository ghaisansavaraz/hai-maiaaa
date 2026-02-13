/* Configuration and Constants */

// Storage keys
export const STORAGE_KEY = "maiaaa_reminders_v1";
export const MOOD_STORAGE_KEY = "maiaaa_mood_v1";
export const TASKS_STORAGE_KEY = "maiaaa_tasks_v1";
export const PINTEREST_STORAGE_KEY = "maiaaa_pinterest_v1";
export const VALENTINE_STORAGE_KEY = "maiaaa_valentine_v1";

// Editor configuration
export const EDITOR_CODE = "gesanlove";
export const DEBUG_MODE = true; // Set to false in production

// Letters from Gesan (easily editable content)
export const LETTERS_DATA = [
  {
    id: "love",
    title: "For Maia",
    content: "Just wanted to remind you that you're loved, valued, and appreciated. Not just by me, but by everyone whose life you've touched. Your kindness, your smile, your beautiful spirit - they all matter more than you know. Take care of yourself, because you're precious. Sending you all the love and good vibes! ✨"
  }
];

// Debug logging functions
export function debugLog(message, ...args) {
  if (DEBUG_MODE) {
    console.log(`[Maiaaa] ${message}`, ...args);
  }
}

export function debugError(message, error) {
  if (DEBUG_MODE) {
    console.error(`[Maiaaa] ${message}`, error);
  }
}
