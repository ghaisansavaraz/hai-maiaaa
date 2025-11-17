/* Moon Phase Sync - Fetch from timeanddate.com via proxy */

import { getJakartaPhase } from './moon-core.js';
import { renderMoon } from './moon-renderer.js';
import { debugLog, debugError } from './config.js';

let lastSyncTime = 0;
let cachedPhase = null;
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
const PROXY_URL = '/api/moon?loc=jakarta';

/**
 * Parse moon phase data from timeanddate.com HTML
 * @param {string} html - HTML content from timeanddate.com
 * @returns {{fraction: number, name: string} | null}
 */
function parseTimeAndDate(html) {
	try {
		// Look for "Moon: XX.X%" pattern
		const percentMatch = html.match(/Moon:\s*(\d+\.?\d*)%/i);
		if (!percentMatch) {
			debugError("Could not find moon percentage in HTML");
			return null;
		}
		const percent = parseFloat(percentMatch[1]);
		const fraction = percent / 100;

		// Look for phase name (Waning Crescent, Waxing Gibbous, etc.)
		const phaseMatch = html.match(/(Waning|Waxing)\s+(Crescent|Gibbous|Quarter)|(New|Full)\s+Moon/i);
		if (!phaseMatch) {
			debugError("Could not find moon phase name in HTML");
			return null;
		}
		const name = phaseMatch[0];

		return { fraction, name };
	} catch (error) {
		debugError("Error parsing timeanddate.com HTML:", error);
		return null;
	}
}

/**
 * Fetch moon phase from proxy
 * @returns {Promise<{fraction: number, name: string} | null>}
 */
async function fetchFromProxy() {
	try {
		const response = await fetch(PROXY_URL, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			},
			cache: 'no-cache'
		});

		if (!response.ok) {
			debugError(`Proxy returned ${response.status}: ${response.statusText}`);
			return null;
		}

		const data = await response.json();
		if (data && typeof data.fraction === 'number' && data.name) {
			return { fraction: data.fraction, name: data.name };
		}
		debugError("Invalid proxy response format:", data);
		return null;
	} catch (error) {
		debugError("Error fetching from proxy:", error);
		return null;
	}
}

/**
 * Sync moon phase from external source and render
 * Falls back to local calculation if proxy fails
 */
export async function syncAndRenderMoon(now = new Date()) {
	const timeSinceLastSync = Date.now() - lastSyncTime;
	
	// Use cache if recent
	if (cachedPhase && timeSinceLastSync < SYNC_INTERVAL) {
		debugLog("Using cached moon phase");
		renderMoon(cachedPhase);
		return;
	}

	// Try proxy first
	debugLog("Fetching moon phase from proxy...");
	const proxyData = await fetchFromProxy();
	
	let phaseData;
	if (proxyData) {
		// Use proxy data, reconcile with local calc
		const localData = getJakartaPhase(now);
		const diff = Math.abs(proxyData.fraction - localData.fraction);
		
		if (diff > 0.02) {
			debugLog(`Proxy differs from local by ${(diff * 100).toFixed(1)}%, using proxy`);
		}
		
		// Determine waxing/waning from phase name or use local calc
		let waxing = localData.waxing;
		if (proxyData.name.includes('Waxing')) {
			waxing = true;
		} else if (proxyData.name.includes('Waning')) {
			waxing = false;
		}
		
		phaseData = {
			fraction: proxyData.fraction,
			waxing: waxing,
			name: proxyData.name,
			...localData // Include other fields from local calc
		};
	} else {
		// Fallback to local calculation
		debugLog("Proxy failed, using local calculation");
		phaseData = getJakartaPhase(now);
	}

	// Cache and render
	cachedPhase = phaseData;
	lastSyncTime = Date.now();
	renderMoon(phaseData);
}

/**
 * Render moon using cached data or local calculation (no network call)
 * Use this for frequent updates (e.g., every second from clock)
 */
export function renderMoonFromCache(now = new Date()) {
	if (cachedPhase) {
		renderMoon(cachedPhase);
	} else {
		// Fallback to local calc if no cache yet
		const localData = getJakartaPhase(now);
		renderMoon(localData);
	}
}

/**
 * Initialize moon sync on page load
 */
export function initMoonSync() {
	debugLog("Initializing moon phase sync...");
	syncAndRenderMoon();
	
	// Sync every 30 minutes
	setInterval(() => {
		syncAndRenderMoon();
	}, SYNC_INTERVAL);
}

