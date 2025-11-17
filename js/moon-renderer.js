/* Moon Phase Renderer - DOM/SVG Updates */

/**
 * Render moon phase visualization and label
 * @param {{fraction: number, waxing: boolean, name: string}} phaseData - Moon phase data
 */
export function renderMoon(phaseData) {
	const { fraction, waxing, name } = phaseData;

	// Update label (inline with greeting)
	const label = document.getElementById("moonPhaseLabel");
	if (label) {
		label.textContent = `${name} · ${(fraction * 100).toFixed(0)}%`;
		label.setAttribute(
			"aria-label",
			`${name}, ${(fraction * 100).toFixed(0)}% illuminated`
		);
	}

	// Update SVG cutout position for shadow mask
	const litCutout = document.getElementById("litCutout");
	if (litCutout) {
		const R = 48;      // close to clip radius
		const center = 50; // SVG center
		// Offset mapping: 0% -> 2R (no overlap -> new), 50% -> R (half), 100% -> 0 (full)
		const offset = (1 - fraction) * 2 * R;
		// Direction: waning -> move downward (bottom lit), waxing -> move upward (top lit)
		const dir = waxing ? -1 : 1;
		const cy = center + dir * (offset - R);
		litCutout.setAttribute("cy", cy.toFixed(2));
	}
}

