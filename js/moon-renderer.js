/* Moon Phase Renderer - compact engine inline (no extra files) */

/**
 * Render moon phase visualization and label
 * @param {{fraction: number, waxing: boolean, name: string}} phaseData
 */
export function renderMoon(phaseData) {
	const { fraction, waxing, name } = phaseData;

	// Visible label: name only (no percentage)
	const label = document.getElementById("moonPhaseLabel");
	if (label) {
		label.textContent = `${name}`;
		label.setAttribute("aria-label", `${name}, ${(fraction * 100).toFixed(0)}% illuminated`);
	}

	const litCutout = document.getElementById("litCutout");
	if (!litCutout) return;

	// Moon disc radius and center (from SVG)
	const R = 48;
	const center = 50;

	// Tunables to match timeanddate-style illustration
	const TERMINATOR_SCALE = 1.90;   // >1 flattens the arc (try 1.70–1.95)
	const SEAM_EPS = 0.25;           // avoids anti-aliased hairline along terminator
	const BASE_ANGLE_DEG = -33;      // subtle angle tweak for closer match

	// Use a larger cutout radius for a flatter arc
	const r2 = R * TERMINATOR_SCALE;
	litCutout.setAttribute("r", r2.toFixed(2));

	// Automatic orientation: pick an angle so the lit side matches waxing/waning
	const angleDeg = chooseAngleDeg(waxing, BASE_ANGLE_DEG);
	const rad = angleDeg * Math.PI / 180;
	const vx = Math.sin(rad);
	const vy = -Math.cos(rad); // screen Y grows down

	// Compute distance that yields the requested lit fraction using two-circle overlap inversion
	const f = clamp01(fraction);
	const dRaw = distanceForOverlapDifferentR(f, R, r2);
	const d = Math.max(0, Math.min(R + r2, dRaw - SEAM_EPS));

	const cx = center + vx * d;
	const cy = center + vy * d;

	litCutout.setAttribute("cx", cx.toFixed(2));
	litCutout.setAttribute("cy", cy.toFixed(2));
}

// Pick an angle that makes the lit crescent face the expected side.
// For timeanddate-style: Waxing → right-lit, Waning → left-lit.
function chooseAngleDeg(waxing, base) {
	const expectRight = !!waxing;
	const candidates = [
		base + (waxing ? 180 : 0),
		-base + (waxing ? 180 : 0),
		base + (waxing ? 0 : 180),
		-base + (waxing ? 0 : 180)
	];
	for (const a of candidates) {
		const vx = Math.sin(a * Math.PI / 180);
		const litRight = vx > 0;
		if (litRight === expectRight) return a;
	}
	return candidates[0];
}

/* Helpers */

function clamp01(x) {
	return x < 0 ? 0 : (x > 1 ? 1 : x);
}

// Invert overlap: find distance d so that overlap(r1,r2,d)/area(r1) ~= f
function distanceForOverlapDifferentR(f, r1, r2) {
	if (f >= 1) return 0;           // full lit → centers coincide
	if (f <= 0) return r1 + r2;     // new → no overlap
	let lo = 0, hi = r1 + r2;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		const fm = overlapFractionDifferentR(mid, r1, r2);
		if (fm > f) lo = mid; else hi = mid;
	}
	return (lo + hi) / 2;
}

function overlapFractionDifferentR(d, r1, r2) {
	const area1 = Math.PI * r1 * r1;
	return overlapAreaDifferentR(d, r1, r2) / area1;
}

// Overlap area for two circles with radii r1 and r2 separated by distance d
function overlapAreaDifferentR(d, r1, r2) {
	if (d >= r1 + r2) return 0;
	if (d <= Math.abs(r2 - r1)) {
		const rMin = Math.min(r1, r2);
		return Math.PI * rMin * rMin;
	}
	const clamp = (x) => x < -1 ? -1 : (x > 1 ? 1 : x);
	const a = Math.acos(clamp((d*d + r1*r1 - r2*r2) / (2*d*r1)));
	const b = Math.acos(clamp((d*d + r2*r2 - r1*r1) / (2*d*r2)));
	const area1 = r1*r1*a - 0.5*r1*r1*Math.sin(2*a);
	const area2 = r2*r2*b - 0.5*r2*r2*Math.sin(2*b);
	return area1 + area2;
}
