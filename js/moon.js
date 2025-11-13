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
	
	console.log('[Moon Debug]', {
		phase: p.phase.toFixed(3),
		fraction: p.fraction.toFixed(3),
		waxing: p.waxing,
		name: p.name,
		ageDays: p.ageDays.toFixed(1)
	});

	// Update label (inline with greeting)
	const label = document.getElementById("moonPhaseLabel");
	if (label) {
		label.textContent = p.name;
		label.setAttribute(
			"aria-label",
			`${p.name}, ${(p.fraction * 100).toFixed(0)}% illuminated`
		);
	}

	// Update SVG mask overlay geometry - Jakarta view (vertical curved crescent)
	const litCutout = document.getElementById("litCutout");
	if (litCutout) {
		// SVG viewBox 0..100, r = 49, center at (50,50)
		const R = 48.3; // Match the litCutout radius in HTML
		const cyBase = 50;
		
		// Jakarta view: waning crescents show lit at BOTTOM, waxing crescents show lit at TOP
		// The unlitMask works by: white areas allow shadow, black areas (litCutout) block shadow
		// So litCutout carves out the LIT region from the shadow
		
		// For waning (phase 0.5→1.0, fraction decreasing from 1.0→0):
		//   - At full (fraction=1): litCutout far down (cy=98), entire moon lit
		//   - At 3rd quarter (fraction=0.5): litCutout at center (cy=50), bottom half lit
		//   - At waning crescent (fraction=0.36): litCutout above center, small crescent at bottom lit
		//   - At new (fraction=0): litCutout far up (cy=2), no moon lit
		
		// For waxing (phase 0→0.5, fraction increasing from 0→1.0):
		//   - At new (fraction=0): litCutout far down (cy=98), no moon lit
		//   - At waxing crescent (fraction=0.36): litCutout below center, small crescent at top lit
		//   - At 1st quarter (fraction=0.5): litCutout at center (cy=50), top half lit
		//   - At full (fraction=1): litCutout far up (cy=2), entire moon lit
		
		let cy;
		if (p.waxing) {
			// Waxing: lit at TOP, cutout moves UP as fraction increases
			// fraction 0→1 maps to cy: 98→2
			cy = cyBase + (1 - 2 * p.fraction) * R;
		} else {
			// Waning: lit at BOTTOM, cutout moves DOWN as fraction decreases (which means as phase increases)
			// fraction 1→0 maps to cy: 98→2
			cy = cyBase - (1 - 2 * p.fraction) * R;
		}
		
		console.log('[Moon Render]', { cy: cy.toFixed(2), waxing: p.waxing, fraction: p.fraction.toFixed(3) });
		litCutout.setAttribute("cy", cy.toFixed(2));
	}

	// Ensure shadow opacity is at configured darkness (single shadow)
	const shadowOverlay = document.getElementById("shadowOverlayCircle");
	if (shadowOverlay) {
		const root = document.documentElement;
		const cssOpacity = getComputedStyle(root).getPropertyValue("--moon-shadow-opacity").trim();
		const o = cssOpacity ? parseFloat(cssOpacity) : 0.85;
		shadowOverlay.setAttribute("opacity", isNaN(o) ? "0.85" : String(o));
	}
}


