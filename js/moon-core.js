/* Moon Phase Calculation - Pure Functions for Jakarta Timezone */

// Synodic month (mean lunar cycle) in days
const SYNODIC_MONTH_DAYS = 29.530588853;
// Reference new moon: 2000-01-06 18:14 UTC (Jean Meeus, Astronomical Algorithms)
const REFERENCE_NEW_MOON_JD = 2451550.1;
const MS_PER_DAY = 86400000;
const UNIX_EPOCH_TO_JD = 2440587.5;

function toJulianDay(date) {
	// date.getTime() is ms since Unix epoch in UTC
	return date.getTime() / MS_PER_DAY + UNIX_EPOCH_TO_JD;
}

export function getJakartaDate(now = new Date()) {
	// Convert current instant to Asia/Jakarta local clock time (UTC+7, no DST)
	// Compute UTC ms, then add +7 hours
	const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
	const jakartaMs = utcMs + 7 * 3600000;
	return new Date(jakartaMs);
}

function normalizeCycle(x) {
	const n = x % 1;
	return n < 0 ? n + 1 : n;
}

function phaseNameFromPhase(phase) {
	// phase: 0..1 (0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter)
	// Use a tighter epsilon so quarters only show very near the exact events
	const eps = 0.01; // ~0.30 days window
	if (phase < eps || phase > 1 - eps) return "New Moon";
	if (Math.abs(phase - 0.25) < eps) return "First Quarter";
	if (Math.abs(phase - 0.5) < eps) return "Full Moon";
	if (Math.abs(phase - 0.75) < eps) return "Last Quarter";

	// Continuous ranges outside the narrow quarter windows
	if (phase > 0 && phase < 0.25 - eps) return "Waxing Crescent";
	if (phase >= 0.25 + eps && phase < 0.5 - eps) return "Waxing Gibbous";
	if (phase >= 0.5 + eps && phase < 0.75 - eps) return "Waning Gibbous";
	return "Waning Crescent";
}

/**
 * Calculate moon phase for Jakarta timezone
 * @param {Date} now - Current date/time (defaults to now)
 * @returns {{fraction: number, waxing: boolean, name: string, phase: number, phaseAngle: number, ageDays: number}}
 */
export function getJakartaPhase(now = new Date()) {
	const jakarta = getJakartaDate(now);
	const jd = toJulianDay(jakarta);
	const daysSinceRef = jd - REFERENCE_NEW_MOON_JD;

	// Phase in [0,1)
	const phase = normalizeCycle(daysSinceRef / SYNODIC_MONTH_DAYS);
	const ageDays = phase * SYNODIC_MONTH_DAYS;
	const waxing = phase < 0.5;

	// Illuminated fraction approximation
	const phaseAngle = 2 * Math.PI * phase; // 0..2π
	const fraction = 0.5 * (1 - Math.cos(phaseAngle)); // 0=new, 1=full

	const name = phaseNameFromPhase(phase);
	return { fraction, phase, phaseAngle, waxing, name, ageDays };
}

// --- Bright limb tilt (approx) ---
const DEG = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const J2000 = 2451545.0;
const OBLIQUITY = 23.4397 * DEG;

function solarRADEC(d) {
	// Approximate Sun position (Meeus/SunCalc simplified)
	const M = (357.5291 + 0.98560028 * d) * DEG;
	const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * DEG;
	const P = 102.9372 * DEG; // perihelion of Earth
	const L = M + C + P + Math.PI;
	// Ecliptic to equatorial (lat=0)
	const ra = Math.atan2(Math.sin(L) * Math.cos(OBLIQUITY), Math.cos(L));
	const dec = Math.asin(Math.sin(L) * Math.sin(OBLIQUITY));
	return { ra, dec };
}

function lunarRADEC(d) {
	// Simplified Moon position (truncated series)
	const L = (218.316 + 13.176396 * d) * DEG;
	const M_m = (134.963 + 13.064993 * d) * DEG;
	const F = (93.272 + 13.229350 * d) * DEG;
	const lon = L + (6.289 * DEG) * Math.sin(M_m);
	const lat = (5.128 * DEG) * Math.sin(F);
	// Ecliptic to equatorial
	const sinLon = Math.sin(lon), cosLon = Math.cos(lon);
	const sinLat = Math.sin(lat), cosLat = Math.cos(lat);
	const x = cosLon * cosLat;
	const y = sinLon * cosLat * Math.cos(OBLIQUITY) - sinLat * Math.sin(OBLIQUITY);
	const z = sinLon * cosLat * Math.sin(OBLIQUITY) + sinLat * Math.cos(OBLIQUITY);
	const ra = Math.atan2(y, x);
	const dec = Math.asin(z);
	return { ra, dec };
}

/**
 * Approximate bright limb position angle χ (degrees) as seen from Earth center.
 * Positive values rotate from north towards east.
 */
export function getBrightLimbAngleJakarta(now = new Date()) {
	const d = toJulianDay(getJakartaDate(now)) - J2000;
	const sun = solarRADEC(d);
	const moon = lunarRADEC(d);
	const y = Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra);
	const x = Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra);
	const chi = Math.atan2(y, x) * RAD2DEG; // degrees
	return chi;
}

