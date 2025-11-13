/* Moon Phase Renderer - DOM/SVG Updates */
import { getBrightLimbAngleJakarta } from './moon-core.js';

/**
 * Render moon phase visualization and label
 * @param {{fraction: number, waxing: boolean, name: string}} phaseData - Moon phase data
 */
export function renderMoon(phaseData) {
	const { fraction, waxing, name } = phaseData;

	// Update label (inline with greeting)
	const label = document.getElementById("moonPhaseLabel");
	if (label) {
		label.textContent = `${name}`;
		label.setAttribute(
			"aria-label",
			`${name}, ${(fraction * 100).toFixed(0)}% illuminated`
		);
	}

	// Update SVG cutout position for shadow mask using accurate overlap
	const litCutout = document.getElementById("litCutout");
	if (!litCutout) return;

	const R = 48;      // cutout radius (matches clip radius)
	const center = 50; // SVG center

	// Overlap area of two equal circles (distance d between centers)
	function overlapFraction(d, r) {
		if (d <= 0) return 1;
		if (d >= 2 * r) return 0;
		const x = d / (2 * r);
		const a = 2 * r * r * Math.acos(x);
		const b = (d / 2) * Math.sqrt(Math.max(0, 4 * r * r - d * d));
		return (a - b) / (Math.PI * r * r);
	}

	// Invert overlap to find distance for desired fraction
	function distanceForFraction(f, r) {
		let lo = 0, hi = 2 * r;
		for (let i = 0; i < 32; i++) {
			const mid = (lo + hi) / 2;
			const fm = overlapFraction(mid, r);
			if (fm > f) {
				lo = mid;
			} else {
				hi = mid;
			}
		}
		return (lo + hi) / 2;
	}

	// Small inward bias to avoid anti-aliased hairline at terminator
	const epsilon = 0.25;
	const d = Math.min(2 * R, Math.max(0, distanceForFraction(fraction, R) - epsilon));

	// Jakarta: waxing = lit on TOP (cy < center), waning = lit on BOTTOM (cy > center)
	const dir = waxing ? -1 : 1;
	const cy = center + dir * d;
	litCutout.setAttribute("cy", cy.toFixed(3));

	// Apply bright-limb tilt to match real-sky orientation
	const rot = document.getElementById("shadowRotate");
	if (rot) {
		const chi = getBrightLimbAngleJakarta(); // degrees
		rot.setAttribute("transform", `rotate(${chi.toFixed(1)} 50 50)`);
	}
}

