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
		const R = 48;      // cutout radius (matches clip radius)
		const center = 50; // SVG center
		
		// Jakarta view: Waning = lit at BOTTOM, Waxing = lit at TOP
		// The cutout (white circle) reveals the lit area by blocking shadow
		// When cutout overlaps moon center, it reveals that side
		
		// Calculate how far the cutout center should be from moon center
		// At fraction=0 (new): cutout far away, no overlap (all shadowed)
		// At fraction=0.5 (half): cutout at edge, half overlap (half lit)
		// At fraction=1 (full): cutout at center, full overlap (all lit)
		
		// Distance from center: 0% -> 2R away, 50% -> R away, 100% -> 0 (at center)
		const distanceFromCenter = (1 - fraction) * 2 * R;
		
		// Direction: waning moves DOWN from center (cy > 50, reveals bottom), waxing moves UP (cy < 50, reveals top)
		const dir = waxing ? -1 : 1;
		const cy = center + dir * distanceFromCenter;
		
		litCutout.setAttribute("cy", cy.toFixed(2));
	}
}

