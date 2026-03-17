// ── Sleep Statistics Module ─────────────────────────────────────────────────
// Tracks user and bunny sleep sessions, persisted to localStorage.

const STORAGE_KEY = 'sleep_statistics';

// ── Data Load / Save ────────────────────────────────────────────────────────

export function loadSleepData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return _defaultData();
    const parsed = JSON.parse(raw);
    return _migrateData(parsed);
  } catch {
    return _defaultData();
  }
}

export function saveSleepData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

function _defaultData() {
  return {
    user: {
      sessions: [],
      currentSleepStart: null,
    },
    bunny: {
      sessions: [],
      currentSleepStart: null,
    },
  };
}

function _migrateData(data) {
  const def = _defaultData();
  return {
    user: {
      sessions: data?.user?.sessions ?? def.user.sessions,
      currentSleepStart: data?.user?.currentSleepStart ?? def.user.currentSleepStart,
    },
    bunny: {
      sessions: data?.bunny?.sessions ?? def.bunny.sessions,
      currentSleepStart: data?.bunny?.currentSleepStart ?? def.bunny.currentSleepStart,
    },
  };
}

// ── User Sleep ───────────────────────────────────────────────────────────────

export function startUserSleep() {
  const data = loadSleepData();
  if (data.user.currentSleepStart) return; // already sleeping
  data.user.currentSleepStart = Date.now();
  saveSleepData(data);
}

export function endUserSleep() {
  const data = loadSleepData();
  if (!data.user.currentSleepStart) return;

  const start = data.user.currentSleepStart;
  const end = Date.now();
  const duration = end - start;

  // Only record if slept at least 5 minutes
  if (duration >= 5 * 60 * 1000) {
    data.user.sessions.push({ startTime: start, endTime: end, duration });
  }
  data.user.currentSleepStart = null;
  saveSleepData(data);
}

export function isUserSleeping() {
  const data = loadSleepData();
  return !!data.user.currentSleepStart;
}

// ── Bunny Sleep ──────────────────────────────────────────────────────────────

export function startBunnySleep() {
  const data = loadSleepData();
  if (data.bunny.currentSleepStart) return; // already sleeping
  data.bunny.currentSleepStart = Date.now();
  saveSleepData(data);
}

export function endBunnySleep() {
  const data = loadSleepData();
  if (!data.bunny.currentSleepStart) return;

  const start = data.bunny.currentSleepStart;
  const end = Date.now();
  const duration = end - start;

  // Record all bunny naps (no minimum)
  data.bunny.sessions.push({ startTime: start, endTime: end, duration });
  data.bunny.currentSleepStart = null;
  saveSleepData(data);
}

// ── Stats Getters ────────────────────────────────────────────────────────────

export function getUserStats() {
  const data = loadSleepData();
  const sessions = data.user.sessions;
  const isSleeping = !!data.user.currentSleepStart;

  if (sessions.length === 0 && !isSleeping) {
    return { sessions: 0, avgDuration: null, lastSleep: null, streak: 0, isSleeping };
  }

  const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgDuration = sessions.length > 0 ? totalMs / sessions.length : null;
  const lastSleep = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const streak = _calculateStreak(sessions);

  return { sessions: sessions.length, avgDuration, lastSleep, streak, isSleeping };
}

export function getBunnyStats() {
  const data = loadSleepData();
  const sessions = data.bunny.sessions;
  const isSleeping = !!data.bunny.currentSleepStart;
  const currentSleepStart = data.bunny.currentSleepStart;

  const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgDuration = sessions.length > 0 ? totalMs / sessions.length : null;
  const lastSleep = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const currentDuration = isSleeping ? Date.now() - currentSleepStart : null;

  return { sessions: sessions.length, totalMs, avgDuration, lastSleep, isSleeping, currentDuration };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(ms) {
  if (ms === null || ms === undefined || ms < 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days === 0 && hours === 0) return 'just now';
  if (days === 0 && hours === 1) return '1 hour ago';
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function _calculateStreak(sessions) {
  if (sessions.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD) that have at least one session
  const dates = new Set(
    sessions.map(s => new Date(s.startTime).toLocaleDateString('en-CA'))
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    if (dates.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today not yet logged — allow streak to count from yesterday
      continue;
    } else {
      break;
    }
  }
  return streak;
}
