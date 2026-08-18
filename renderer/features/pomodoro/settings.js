const STORAGE_KEY = 'pomodoro.settings.v1';

export const DEFAULT_SETTINGS = Object.freeze({
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
});

const LIMITS = Object.freeze({
  focusMinutes: { min: 1, max: 120 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 60 },
});

function clampInt(value, fallback, { min, max }) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export function normalizeSettings(raw = {}) {
  const normalized = { ...DEFAULT_SETTINGS };
  Object.keys(LIMITS).forEach((key) => {
    normalized[key] = clampInt(raw[key], DEFAULT_SETTINGS[key], LIMITS[key]);
  });
  return normalized;
}

export function loadSettings(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings, storage = localStorage) {
  const normalized = normalizeSettings(settings);
  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}