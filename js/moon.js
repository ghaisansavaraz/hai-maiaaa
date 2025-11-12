/* Moon phase calculation and UI update for Jakarta timezone (UTC+7) */

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

function getJakartaDate(now = new Date()) {
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
	// Thresholds tuned for intuitive names
	const eps = 0.02;
	if (phase < eps || phase > 1 - eps) return "New Moon";
	if (Math.abs(phase - 0.25) < eps) return "First Quarter";
	if (Math.abs(phase - 0.5) < eps) return "Full Moon";
	if (Math.abs(phase - 0.75) < eps) return "Last Quarter";

	if (phase > 0 && phase < 0.25 - eps) return "Waxing Crescent";
	if (phase >= 0.25 + eps && phase < 0.5 - eps) return "Waxing Gibbous";
	if (phase >= 0.5 + eps && phase < 0.75 - eps) return "Waning Gibbous";
	// else near the end of cycle but not within eps of 1
	return "Waning Crescent";
}

export function getMoonPhaseJakarta(now = new Date()) {
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

export function updateMoonDisplay(now = new Date()) {
	// Compute phase
	const p = getMoonPhaseJakarta(now);

	// Update label (inline with greeting)
	const label = document.getElementById("moonPhaseLabel");
	if (label) {
		label.textContent = p.name;
		label.setAttribute(
			"aria-label",
			`${p.name}, ${(p.fraction * 100).toFixed(0)}% illuminated`
		);
	}

	// Update SVG mask overlay geometry
	const litCutout = document.getElementById("litCutout");
	if (litCutout) {
		// SVG viewBox 0..100, r = 48, center at (50,50)
		const R = 48;
		const cxBase = 50;
		// Offset mapping: fraction -> offset; flip direction by waxing/waning
		const cx = cxBase + (2 * p.fraction - 1) * R * (p.waxing ? 1 : -1);
		litCutout.setAttribute("cx", cx.toFixed(2));
	}

	// Shadow overlay opacity (keep 30–40% texture visible on unlit side)
	const shadowOverlay = document.getElementById("shadowOverlayCircle");
	if (shadowOverlay) {
		const root = document.documentElement;
		const cssOpacity = getComputedStyle(root).getPropertyValue("--moon-shadow-opacity").trim();
		const o = cssOpacity ? parseFloat(cssOpacity) : 0.65; // default ~65% darkness
		shadowOverlay.setAttribute("opacity", isNaN(o) ? "0.65" : String(o));
	}
}


