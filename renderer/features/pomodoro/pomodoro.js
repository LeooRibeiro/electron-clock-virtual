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
    settings,
    now = Date.now,
    intervalFn = setInterval,
    clearFn = clearInterval,
  } = options;

  const listeners = new Set();

  let state = STATE.IDLE;
  let phase = PHASES.FOCUS;
  let completedCycles = 0;
  let phaseEndAt = 0;
  let remainingMs = durationOfPhase(phase, settings);
  let timerId = null;

  function getSnapshot() {
    return {
      state,
      phase,
      completedCycles,
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
      phase = completedCycles % settings.cyclesBeforeLongBreak === 0
        ? PHASES.LONG_BREAK
        : PHASES.SHORT_BREAK;
    } else {
      phase = PHASES.FOCUS;
    }

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
    phase = phase === PHASES.FOCUS ? PHASES.SHORT_BREAK : PHASES.FOCUS;
    remainingMs = durationOfPhase(phase, settings);
    emit('phase-change', getSnapshot());
  }

  function reset() {
    stopTimer();
    state = STATE.IDLE;
    phase = PHASES.FOCUS;
    completedCycles = 0;
    remainingMs = durationOfPhase(phase, settings);
    emit('reset', getSnapshot());
  }

  function on(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    start,
    pause,
    resume,
    skip,
    reset,
    on,
    getSnapshot,
  };
}