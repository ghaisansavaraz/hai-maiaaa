/* Moon Phase Calculation - Jakarta (Asia/Jakarta, UTC+7)
   Minimalist utility returning the current phase fraction and human name.
   Phase fraction: 0 → New Moon, 0.5 → Full Moon, 1 → New Moon again.
*/

// Synodic month (lunation) in days
const SYNODIC_MONTH_DAYS = 29.53058867;

// Reference new moon: 2000-01-06 18:14:00 UTC (commonly used epoch)
const NEW_MOON_EPOCH_UTC = Date.UTC(2000, 0, 6, 18, 14, 0, 0);

// Get a Date object representing "now" in Jakarta by round-tripping a formatted string.
function getJakartaNow() {
  // This creates a locale string in the Jakarta TZ, then constructs a Date from it
  // which becomes a Date in the local environment but with the Jakarta components.
  const now = new Date();
  const jakartaString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(jakartaString);
}

// Normalize a number into [0,1)
function normalize01(value) {
  const v = value - Math.floor(value);
  return v < 0 ? v + 1 : v;
}

// Calculate moon phase fraction based on a Date (defaults to Jakarta now)
export function calculateMoonPhaseFraction(dateInJakarta = getJakartaNow()) {
  const t = dateInJakarta.getTime(); // interpreted in local environment
  // Convert to an approximate UTC-equivalent milliseconds by subtracting local offset,
  // then compare with the epoch. This keeps the day count consistent.
  const localOffsetMs = dateInJakarta.getTimezoneOffset() * 60 * 1000;
  const approxUtcMs = t - localOffsetMs;

  const daysSinceEpoch = (approxUtcMs - NEW_MOON_EPOCH_UTC) / (1000 * 60 * 60 * 24);
  const phase = normalize01(daysSinceEpoch / SYNODIC_MONTH_DAYS);
  return phase;
}

export function getMoonPhaseName(phase) {
  // Map fraction to phase names
  // Boundaries roughly:
  // 0.00 new, 0.125 waxing crescent, 0.25 first quarter, 0.375 waxing gibbous,
  // 0.50 full, 0.625 waning gibbous, 0.75 last quarter, 0.875 waning crescent
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function getMoonPhaseData() {
  const jakartaNow = getJakartaNow();
  const phase = calculateMoonPhaseFraction(jakartaNow);
  const name = getMoonPhaseName(phase);
  // Approximate illumination percentage (simple model)
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase)) * 50 * 2) / 2; // 0–100%
  return {
    date: jakartaNow,
    phase,          // 0..1
    illumination,   // 0..100 (%)
    name,           // human-readable phase
  };
}

// Helper to get suggested mask parameters for SVG rendering
export function getMaskParams(phase) {
  // Illumination center offset: negative for waxing (light on right),
  // positive for waning (light on left). Keep minimal for minimalist look.
  const waxing = phase <= 0.5;
  const progress = waxing ? phase / 0.5 : (1 - phase) / 0.5; // 0..1 to/from full
  const offset = (waxing ? -1 : 1) * (0.5 - progress) * 30; // px offset within 100 viewBox
  // Radius interpolation for crescent/gibbous feel
  const radius = 50 + (progress - 0.5) * 12; // slight change around 50
  return { offset, radius, waxing };
}

export default {
  getJakartaNow,
  calculateMoonPhaseFraction,
  getMoonPhaseName,
  getMoonPhaseData,
  getMaskParams,
};


