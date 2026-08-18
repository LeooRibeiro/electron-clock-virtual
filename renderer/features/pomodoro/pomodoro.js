export const PHASES = Object.freeze({
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
});

export const STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
});

const TICK_MS = 250;

const SESSION_LENGTH = 6;

const SESSION_SEQUENCE = Object.freeze([
  PHASES.FOCUS,
  PHASES.SHORT_BREAK,
  PHASES.FOCUS,
  PHASES.SHORT_BREAK,
  PHASES.FOCUS,
  PHASES.LONG_BREAK,
]);

function durationOfPhase(phase, settings) {
  switch (phase) {
    case PHASES.FOCUS:
      return settings.focusMinutes * 60 * 1000;
    case PHASES.SHORT_BREAK:
      return settings.shortBreakMinutes * 60 * 1000;
    case PHASES.LONG_BREAK:
      return settings.longBreakMinutes * 60 * 1000;
    default:
      return 0;
  }
}

export function createPomodoroEngine(options = {}) {
  const {
    now = Date.now,
    intervalFn = setInterval,
    clearFn = clearInterval,
  } = options;

  let settings = options.settings;

  const listeners = new Set();

  let state = STATE.IDLE;
  let phase = PHASES.FOCUS;
  let completedCycles = 0;
  let cycleIndex = 0;
  let phaseEndAt = 0;
  let remainingMs = durationOfPhase(phase, settings);
  let timerId = null;

  function getSnapshot() {
    return {
      state,
      phase,
      completedCycles,
      cycle: cycleIndex + 1,
      totalCycles: SESSION_LENGTH,
      remainingMs,
      totalMs: durationOfPhase(phase, settings),
    };
  }

  function emit(name, payload) {
    listeners.forEach((listener) => listener(name, payload));
  }

  function startTimer() {
    timerId = intervalFn(tick, TICK_MS);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearFn(timerId);
      timerId = null;
    }
  }

  function tick() {
    const remaining = phaseEndAt - now();

    if (remaining <= 0) {
      completePhase();
      return;
    }

    remainingMs = remaining;
    emit('tick', getSnapshot());
  }

  function completePhase() {
    stopTimer();

    if (phase === PHASES.FOCUS) {
      completedCycles += 1;
    }
    cycleIndex += 1;

    if (cycleIndex >= SESSION_LENGTH) {
      phase = PHASES.FOCUS;
      cycleIndex = 0;
      completedCycles = 0;
      remainingMs = durationOfPhase(phase, settings);
      state = STATE.IDLE;
      emit('complete', getSnapshot());
      return;
    }

    phase = SESSION_SEQUENCE[cycleIndex];
    remainingMs = durationOfPhase(phase, settings);
    state = STATE.IDLE;
    emit('phase-change', getSnapshot());
    start();
  }

  function start() {
    if (state === STATE.RUNNING) return;

    state = STATE.RUNNING;
    phaseEndAt = now() + remainingMs;
    startTimer();
    emit('state-change', getSnapshot());
  }

  function pause() {
    if (state !== STATE.RUNNING) return;

    state = STATE.PAUSED;
    remainingMs = Math.max(0, phaseEndAt - now());
    stopTimer();
    emit('state-change', getSnapshot());
  }

  function resume() {
    if (state !== STATE.PAUSED) return;
    start();
  }

  function skip() {
    stopTimer();
    state = STATE.IDLE;
    cycleIndex += 1;
    if (cycleIndex >= SESSION_LENGTH) {
      phase = PHASES.FOCUS;
      cycleIndex = 0;
      completedCycles = 0;
    } else {
      phase = SESSION_SEQUENCE[cycleIndex];
    }
    remainingMs = durationOfPhase(phase, settings);
    emit('phase-change', getSnapshot());
  }

  function reset() {
    stopTimer();
    state = STATE.IDLE;
    phase = PHASES.FOCUS;
    completedCycles = 0;
    cycleIndex = 0;
    remainingMs = durationOfPhase(phase, settings);
    emit('reset', getSnapshot());
  }

  function on(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function updateSettings(nextSettings) {
    settings = nextSettings;
    if (state === STATE.IDLE) {
      remainingMs = durationOfPhase(phase, settings);
    }
    emit('settings-change', getSnapshot());
  }

  return {
    start,
    pause,
    resume,
    skip,
    reset,
    updateSettings,
    on,
    getSnapshot,
  };
}