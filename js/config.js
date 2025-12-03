/* Configuration and Constants */

// Storage keys
export const STORAGE_KEY = "maiaaa_reminders_v1";
export const MOOD_STORAGE_KEY = "maiaaa_mood_v1";
export const TASKS_STORAGE_KEY = "maiaaa_tasks_v1";
export const PINTEREST_STORAGE_KEY = "maiaaa_pinterest_v1";

// Editor configuration
export const EDITOR_CODE = "gesanlove";
export const DEBUG_MODE = true; // Set to false in production

// Letters from Gesan (easily editable content)
export const LETTERS_DATA = [
  {
    id: "welcome",
    title: "Welcome back, beautiful",
    date: "Today",
    preview: "I hope you're having a wonderful day...",
    content: "Welcome back to your personal space, Maiaaa cantik! I created this little corner of the internet just for you. Take your time, breathe, and remember that you're amazing. Every day is a new opportunity to shine, and I believe in you completely. 💕",
    icon: "🌅"
  },
  {
    id: "motivation",
    title: "You've got this",
    date: "Always",
    preview: "Remember how strong you are...",
    content: "Hey beautiful! I know some days feel harder than others, but look at how far you've come. You're stronger than you think, smarter than you know, and more capable than you believe. When things get tough, remember that this too shall pass, and you'll come out even stronger on the other side. I'm cheering for you always! 🌟",
    icon: "💌"
  },
  {
    id: "love",
    title: "Just because",
    date: "Forever",
    preview: "You deserve all the happiness...",
    content: "Just wanted to remind you that you're loved, valued, and appreciated. Not just by me, but by everyone whose life you've touched. Your kindness, your smile, your beautiful spirit - they all matter more than you know. Take care of yourself, because you're precious. Sending you all the love and good vibes! ✨",
    icon: "✨"
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
