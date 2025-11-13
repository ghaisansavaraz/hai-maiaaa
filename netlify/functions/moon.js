/* Netlify Function: Moon Phase Proxy for Jakarta */

const TIMEANDDATE_URL = 'https://www.timeanddate.com/moon/indonesia/jakarta';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let cachedData = null;
let cacheTime = 0;

/**
 * Parse moon phase from timeanddate.com HTML
 */
function parseMoonPhase(html) {
	try {
		// Look for "Moon: XX.X%" pattern
		const percentMatch = html.match(/Moon:\s*(\d+\.?\d*)%/i);
		if (!percentMatch) {
			return null;
		}
		const percent = parseFloat(percentMatch[1]);
		const fraction = Math.max(0, Math.min(1, percent / 100));

		// Look for phase name
		const phaseMatch = html.match(/(Waning|Waxing)\s+(Crescent|Gibbous|Quarter)|(New|Full)\s+Moon/i);
		if (!phaseMatch) {
			return null;
		}
		const name = phaseMatch[0];

		return { fraction, name };
	} catch (error) {
		console.error('Error parsing HTML:', error);
		return null;
	}
}

exports.handler = async (event, context) => {
	// CORS headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Content-Type': 'application/json',
		'Cache-Control': 'public, max-age=1800' // 30 minutes
	};

	// Handle OPTIONS request
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers,
			body: ''
		};
	}

	// Check cache
	const now = Date.now();
	if (cachedData && (now - cacheTime) < CACHE_DURATION) {
		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(cachedData)
		};
	}

	try {
		// Fetch from timeanddate.com
		const response = await fetch(TIMEANDDATE_URL, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; MoonPhaseBot/1.0)'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const html = await response.text();
		const moonData = parseMoonPhase(html);

		if (!moonData) {
			throw new Error('Failed to parse moon phase data');
		}

		// Cache result
		cachedData = moonData;
		cacheTime = now;

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(moonData)
		};
	} catch (error) {
		console.error('Proxy error:', error);
		
		// Return cached data even if stale, or error
		if (cachedData) {
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify(cachedData)
			};
		}

		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: 'Failed to fetch moon phase data' })
		};
	}
};

