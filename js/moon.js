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
	
	console.log('[Moon Phase]', {
		phase: (p.phase * 100).toFixed(1) + '%',
		illumination: (p.fraction * 100).toFixed(1) + '%',
		waxing: p.waxing,
		name: p.name
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

	// Update both mask discs for Jakarta vertical view
	const litDisc = document.getElementById("litDisc");
	const unlitDisc = document.getElementById("unlitDisc");
	
	if (litDisc && unlitDisc) {
		const R = 50; // disc radius
		const center = 50;
		
		// Jakarta view: Waning = lit at BOTTOM, Waxing = lit at TOP
		// Move BOTH discs vertically to create curved crescent
		
		// Calculate offset: at 0% = far away, at 50% = at center, at 100% = far opposite
		// Use (1 - 2*fraction) to map: 0→+1, 0.5→0, 1→-1
		const normalizedOffset = 1 - 2 * p.fraction;
		
		let litCy, unlitCy;
		
		if (p.waxing) {
			// WAXING: Lit portion grows at TOP
			// At 0%: litDisc at bottom (cy=100), unlitDisc at bottom (cy=100) - all dark
			// At 36%: litDisc above center, unlitDisc below center - top crescent lit
			// At 100%: litDisc at top (cy=0), unlitDisc at top (cy=0) - all lit
			litCy = center + normalizedOffset * R;
			unlitCy = center - normalizedOffset * R;
		} else {
			// WANING: Lit portion shrinks to BOTTOM
			// At 100%: litDisc at bottom (cy=100), unlitDisc at bottom (cy=100) - all lit
			// At 36%: litDisc below center, unlitDisc above center - bottom crescent lit
			// At 0%: litDisc at top (cy=0), unlitDisc at top (cy=0) - all dark
			litCy = center - normalizedOffset * R;
			unlitCy = center + normalizedOffset * R;
		}
		
		litDisc.setAttribute("cy", litCy.toFixed(2));
		unlitDisc.setAttribute("cy", unlitCy.toFixed(2));
		
		console.log('[Moon Render]', {
			waxing: p.waxing,
			fraction: p.fraction.toFixed(3),
			litCy: litCy.toFixed(1),
			unlitCy: unlitCy.toFixed(1)
		});
	}
}


