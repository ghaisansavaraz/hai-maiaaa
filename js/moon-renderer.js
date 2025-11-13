/* Moon Phase Renderer - DOM/SVG Updates */
import { getBrightLimbAngleJakarta } from './moon-core.js';
import { computeCutout } from './moon-engine.js';
import { MOON_RENDER_CONFIG } from './config.js';

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

	// Update SVG cutout position for shadow mask using calibrated engine
	const litCutout = document.getElementById("litCutout");
	if (!litCutout) return;

	const R = 48;      // cutout radius (matches clip radius)
	const center = 50; // SVG center

	// Determine tilt angle
	let angleDeg;
	if (MOON_RENDER_CONFIG.tilt === 'brightLimb') {
		angleDeg = getBrightLimbAngleJakarta();
	} else {
		angleDeg = MOON_RENDER_CONFIG.fixedAngleDeg || 0;
	}

	// Compute cutout position per selected mapping
	const { cx, cy } = computeCutout({
		fraction,
		R,
		angleDeg,
		mapping: MOON_RENDER_CONFIG.mapping,
		gamma: MOON_RENDER_CONFIG.gamma,
		seamEpsilon: MOON_RENDER_CONFIG.seamEpsilon,
		center
	});

	litCutout.setAttribute("cx", cx.toFixed(3));
	litCutout.setAttribute("cy", cy.toFixed(3));

	// Apply runtime opacity
	const overlay = document.getElementById("shadowOverlay");
	if (overlay && typeof MOON_RENDER_CONFIG.opacity === 'number') {
		overlay.setAttribute("opacity", MOON_RENDER_CONFIG.opacity.toFixed(2));
	}
}

