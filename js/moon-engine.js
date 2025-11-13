/* Moon Rendering Engine - Curvature mappings and vector math */

/**
 * Compute the cutout center (cx, cy) for a given illuminated fraction, radius, and tilt angle.
 * Supports multiple curvature mappings to match different visual references.
 *
 * @param {Object} opts
 * @param {number} opts.fraction - Illuminated fraction [0..1]
 * @param {number} opts.R - Circle radius (cutout and clip radius)
 * @param {number} opts.angleDeg - Direction of the bright limb (degrees). 0 = up, 90 = right.
 * @param {'overlapExact'|'linearChord'|'gammaChord'} [opts.mapping='gammaChord'] - Curvature mapping
 * @param {number} [opts.gamma=0.92] - Gamma used when mapping = 'gammaChord'
 * @param {number} [opts.seamEpsilon=0.25] - Small inward bias to avoid anti-aliased seam
 * @param {number} [opts.center=50] - SVG center coordinate
 * @returns {{cx:number, cy:number, d:number}}
 */
export function computeCutout(opts) {
	const {
		fraction,
		R,
		angleDeg,
		mapping = 'gammaChord',
		gamma = 0.92,
		seamEpsilon = 0.25,
		center = 50
	} = opts;

	const clamp01 = (x) => x < 0 ? 0 : (x > 1 ? 1 : x);
	const f = clamp01(fraction);

	let d;
	if (mapping === 'linearChord') {
		d = (1 - f) * 2 * R;
	} else if (mapping === 'gammaChord') {
		d = (1 - Math.pow(f, gamma)) * 2 * R;
	} else {
		// overlapExact: invert equal-circle overlap area by binary search
		d = distanceForOverlap(f, R);
	}

	// Apply seam protection and clamp
	const dSafe = Math.min(2 * R, Math.max(0, d - seamEpsilon));

	// Direction vector from bright-limb angle
	const rad = angleDeg * Math.PI / 180;
	const vx = Math.sin(rad);
	const vy = -Math.cos(rad); // screen Y goes down
	const cx = center + vx * dSafe;
	const cy = center + vy * dSafe;

	return { cx, cy, d: dSafe };
}

/**
 * Exact overlap mapping for two equal circles separated by distance d.
 * Returns distance d that yields a given overlap fraction f in [0..1].
 */
function distanceForOverlap(f, r) {
	// Edge cases
	if (f >= 1) return 0;
	if (f <= 0) return 2 * r;

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

// Overlap fraction of two equal circles with separation d
function overlapFraction(d, r) {
	if (d <= 0) return 1;
	if (d >= 2 * r) return 0;
	const x = d / (2 * r);
	const a = 2 * r * r * Math.acos(x);
	const b = (d / 2) * Math.sqrt(Math.max(0, 4 * r * r - d * d));
	return (a - b) / (Math.PI * r * r);
}


