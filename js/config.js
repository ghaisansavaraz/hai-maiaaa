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

// Vase flower bloom timing (private, tune freely)
export const VASE_BLOOM_START_DATE = '2026-07-20';  // EDIT ME — when it starts blooming
export const VASE_BLOOM_TARGET_DATE = '2026-08-31'; // EDIT ME — when it should be fully bloomed
export const VASE_BLOOM_PACE = 1;                   // EDIT ME — >1 = faster, <1 = slower (no date math needed)

// ===== The Moonlit Meadow (3D birthday world, world.html) — all EDIT ME =====
// Dates are her LOCAL midnight.
// From this date the dashboard's vase flower becomes the doorway into the
// meadow (before it, the flower behaves exactly as now). Set to today so the
// meadow is open to explore; only the hilltop ending waits for her birthday.
export const WORLD_ENTRY_DATE = '2026-10-16';
// From this date the moon-gate on the hilltop opens (the birthday ending).
export const WORLD_UNLOCK_DATE = '2026-10-19';
export const WORLD_HER_NAME = 'Maia Reva';
export const WORLD_FROM_NAME = 'Gesan';
// Signs on the pier's food stalls (shop names, change freely).
export const WORLD_PIER_SIGNS = {
  boutique: 'Reva Maia’s Nhà Việt', gelato: 'Gelato', jamu: 'Jamu',
  martabak: 'Gesan’s Legit & Gurih', dapur: 'Sajian Dapur Gesan',
};
// The carts on the pier's promenade, in bay order (gate end first, east then
// west, then the next pair). Add a name here to fill the next empty bay;
// known carts: 'esputer' (gelato), 'martabak'. Empty bays hold a planter.
export const WORLD_CARTS = ['esputer', 'martabak'];

// Sajian Dapur Gesan, the little private restaurant by the lake. It is only
// open on the days listed here (her local date), or whenever WORLD_DAPUR_OPEN
// says so: true = open now, false = closed now, null = follow the dates.
export const WORLD_DAPUR_EVENTS = ['2026-10-19'];
export const WORLD_DAPUR_OPEN = null;
// What you're cooking, shown on the menu board inside (only while
// WORLD_SHOW_MESSAGES is true; otherwise the board just carries the name).
export const WORLD_DAPUR_MENU = [
  'tonight, cooked by Gesan',
];
// Whisper that fades in under the flower when she hovers it (once it's a door).
export const WORLD_ENTRY_HINT = 'the one who’s lovelier than the moon, the night is waiting';

// MASTER SWITCH for every written message inside the meadow: lantern notes,
// the bench letter, the greenhouse lines, the "not yet" note and the birthday
// card. false = none of them appear (not even on her birthday); the visuals,
// lanterns glow, gate and shooting stars all still work. Set true to bring
// the texts back once they're written.
export const WORLD_SHOW_MESSAGES = false;

// One message per lantern, in walking order (entrance → hilltop).
export const WORLD_LANTERN_MESSAGES = [
  "Hi Maia. This little place is yours. Walk slowly — nothing here is in a hurry.",
  "Some people make ordinary days feel softer. You're one of them.",
  "I hope this year is as kind to you as you are to everyone around you.",
  "The flower in the greenhouse took its time. The best things usually do.",
  "Keep going up the hill. The moon has been waiting for you.",
];

// The story chapters Mr. Frundles leads her through, in order. Shown (as a
// card) when each one is reached — only while WORLD_SHOW_MESSAGES is true.
export const WORLD_CHAPTERS = [
  { id: 'entrance', title: 'The first lantern', message: "Mr. Frundles will show you the way. Follow him." },
  { id: 'pier', title: 'The pier', message: "Some places are worth walking all the way to the end of." },
  { id: 'desk', title: 'Your desk', message: "All those pages, all that work. I see how hard you try, and I'm so proud of you." },
  { id: 'hill', title: 'The hilltop', message: "Last stop. Light the lantern when it's your birthday." },
];

// Lines shown when she looks closer at things in the greenhouse.
export const WORLD_ITEM_MESSAGES = {
  flower: "It bloomed. Slowly, quietly, and right on time.",
  mug: "World's best Reva. Certified, laminated, non-negotiable.",
};

// The birthday ending, behind the moon-gate.
export const WORLD_FINAL_MESSAGE = {
  title: 'Happy Birthday, Maia',
  body: "Thank you for being exactly who you are. I hope this year brings you slow mornings, loud laughs, and every quiet wish you've been holding onto.",
};

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
