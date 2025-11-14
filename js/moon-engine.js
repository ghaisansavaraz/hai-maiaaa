/* Moon Rendering Engine - Curvature mappings and vector math */

/**
 * Compute the cutout center (cx, cy) for a given illuminated fraction, radius, and tilt angle.
 * Supports multiple curvature mappings to match different visual references.
 *
 * @param {Object} opts
 * @param {number} opts.fraction - Illuminated fraction [0..1]
 * @param {number} opts.R - Circle radius (cutout and clip radius)
 * @param {number} opts.angleDeg - Direction of the bright limb (degrees). 0 = up, 90 = right.
 * @param {'overlapExact'|'linearChord'|'gammaChord'|'overlapScaled'} [opts.mapping='gammaChord'] - Curvature mapping
 * @param {number} [opts.gamma=0.92] - Gamma used when mapping = 'gammaChord'
 * @param {number} [opts.seamEpsilon=0.25] - Small inward bias to avoid anti-aliased seam
 * @param {number} [opts.center=50] - SVG center coordinate
 * @param {number} [opts.rScale=1] - Terminator radius multiplier (overlapScaled)
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
		center = 50,
		rScale = 1
	} = opts;

	const clamp01 = (x) => x < 0 ? 0 : (x > 1 ? 1 : x);
	const f = clamp01(fraction);

	let d;
	if (mapping === 'linearChord') {
		d = (1 - f) * 2 * R;
	} else if (mapping === 'gammaChord') {
		d = (1 - Math.pow(f, gamma)) * 2 * R;
	} else if (mapping === 'overlapScaled') {
		// Use a larger/smaller terminator radius to control apparent curvature
		const r2 = Math.max(0.01, R * rScale);
		d = distanceForOverlapDifferentR(f, R, r2);
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

/**
 * Generalized distance inversion for two circles of radii r1 (moon) and r2 (terminator).
 * Finds d such that overlap(r1,r2,d) / area(r1) ~= f
 */
function distanceForOverlapDifferentR(f, r1, r2) {
	// Bounds: from full cover (d = max(0, r2 - r1)) to no overlap (d = r1 + r2)
	const minD = Math.max(0, r2 - r1);
	const maxD = r1 + r2;
	if (f >= 1) return minD;
	if (f <= 0) return maxD;

	let lo = minD, hi = maxD;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		const fm = overlapFractionDifferentR(mid, r1, r2);
		if (fm > f) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return (lo + hi) / 2;
}

// Overlap fraction for circles with different radii
function overlapFractionDifferentR(d, r1, r2) {
	const area1 = Math.PI * r1 * r1;
	const overlap = overlapAreaDifferentR(d, r1, r2);
	return overlap / area1;
}

// Overlap area between two circles with radii r1 and r2 separated by distance d
function overlapAreaDifferentR(d, r1, r2) {
	// No overlap
	if (d >= r1 + r2) return 0;
	// One inside the other
	if (d <= Math.abs(r2 - r1)) {
		const rMin = Math.min(r1, r2);
		return Math.PI * rMin * rMin;
	}
	// Clamp to safe ranges to avoid NaNs from floating point
	const clamp = (x) => x < -1 ? -1 : (x > 1 ? 1 : x);
	const a = Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)));
	const b = Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2)));
	const area1 = r1 * r1 * a - r1 * r1 * Math.sin(2 * a) / 2;
	const area2 = r2 * r2 * b - r2 * r2 * Math.sin(2 * b) / 2;
	return area1 + area2;
}


