/* Netlify Function: Moon Phase Proxy for Jakarta (with Open‑Meteo fallback) */

const TIMEANDDATE_URL = 'https://www.timeanddate.com/moon/indonesia/jakarta';
const OM_URL = 'https://api.open-meteo.com/v1/astronomy?latitude=-6.2088&longitude=106.8456&daily=moon_phase&timezone=Asia%2FJakarta';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

let cachedData = null;
let cacheTime = 0;

function fractionFromCycle(p) {
	const a = 2 * Math.PI * p;
	return 0.5 * (1 - Math.cos(a)); // 0=new, 1=full
}

function nameFromCycle(p) {
	const eps = 0.02;
	if (p < eps || p > 1 - eps) return 'New Moon';
	if (Math.abs(p - 0.25) < eps) return 'First Quarter';
	if (Math.abs(p - 0.5) < eps) return 'Full Moon';
	if (Math.abs(p - 0.75) < eps) return 'Last Quarter';
	if (p < 0.5) return p < 0.25 ? 'Waxing Crescent' : 'Waxing Gibbous';
	return p < 0.75 ? 'Waning Gibbous' : 'Waning Crescent';
}

/**
 * Parse moon phase from timeanddate.com HTML
 */
function parseMoonPhase(html) {
	try {
		const percentMatch = html.match(/Moon:\s*(\d+\.?\d*)%/i);
		const phaseMatch = html.match(/(Waning|Waxing)\s+(Crescent|Gibbous|Quarter)|(New|Full)\s+Moon/i);
		if (!percentMatch || !phaseMatch) return null;
		const fraction = Math.max(0, Math.min(1, parseFloat(percentMatch[1]) / 100));
		const name = phaseMatch[0];
		const waxing = /Waxing/i.test(name);
		return { fraction, name, waxing, source: 'timeanddate' };
	} catch (error) {
		console.error('Error parsing HTML:', error);
		return null;
	}
}

async function viaTimeAndDate() {
	const response = await fetch(TIMEANDDATE_URL, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MoonPhaseBot/1.0)' }
	});
	if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	const html = await response.text();
	const data = parseMoonPhase(html);
	if (!data) throw new Error('parse tad');
	return data;
}

async function viaOpenMeteo() {
	const response = await fetch(OM_URL);
	if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	const json = await response.json();
	const p = Array.isArray(json?.daily?.moon_phase) ? json.daily.moon_phase[0] : null; // 0..1
	if (typeof p !== 'number') throw new Error('open-meteo bad payload');
	const fraction = fractionFromCycle(p);
	const name = nameFromCycle(p);
	const waxing = p < 0.5;
	return { fraction, name, waxing, source: 'open-meteo' };
}

exports.handler = async (event, context) => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Content-Type': 'application/json',
		'Cache-Control': 'public, max-age=900' // 15 minutes
	};

	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 200, headers, body: '' };
	}

	// Serve fresh cache if valid
	const now = Date.now();
	if (cachedData && (now - cacheTime) < CACHE_DURATION) {
		return { statusCode: 200, headers, body: JSON.stringify(cachedData) };
	}

	try {
		let payload;
		try {
			payload = await viaTimeAndDate();
		} catch (e) {
			console.warn('timeanddate failed, falling back to open-meteo:', e?.message || e);
			payload = await viaOpenMeteo();
		}

		cachedData = payload;
		cacheTime = now;
		return { statusCode: 200, headers, body: JSON.stringify(payload) };
	} catch (error) {
		console.error('Proxy error:', error);
		if (cachedData) {
			return { statusCode: 200, headers, body: JSON.stringify(cachedData) };
		}
		return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch moon phase data' }) };
	}
};
