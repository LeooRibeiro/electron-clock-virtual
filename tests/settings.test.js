import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  loadSettings,
  saveSettings,
} from '../renderer/features/pomodoro/settings.js';

function createFakeStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

describe('settings — persistência', () => {
  test('retorna defaults quando vazio', () => {
    const storage = createFakeStorage();
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  test('retorna defaults quando o JSON está corrompido', () => {
    const storage = createFakeStorage();
    storage.setItem('pomodoro.settings.v1', '{{{');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  test('saveSettings persiste e loadSettings recupera (round-trip)', () => {
    const storage = createFakeStorage();
    const saved = saveSettings(
      { focusMinutes: 50, shortBreakMinutes: 7, longBreakMinutes: 20, cyclesBeforeLongBreak: 6 },
      storage
    );
    const loaded = loadSettings(storage);
    expect(loaded).toEqual(saved);
    expect(loaded.focusMinutes).toBe(50);
    expect(loaded.cyclesBeforeLongBreak).toBe(6);
  });
});

describe('settings — normalização', () => {
  test('normalizeSettings aplica limites', () => {
    const normalized = normalizeSettings({
      focusMinutes: 999,
      shortBreakMinutes: 0,
      longBreakMinutes: -5,
      cyclesBeforeLongBreak: 0,
      garbage: 42,
    });
    expect(normalized.focusMinutes).toBe(120);
    expect(normalized.shortBreakMinutes).toBe(1);
    expect(normalized.longBreakMinutes).toBe(1);
    expect(normalized.cyclesBeforeLongBreak).toBe(1);
    expect(normalized.garbage).toBeUndefined();
  });
});