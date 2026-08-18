import {
  createPomodoroEngine,
  PHASES,
  STATE,
} from '../renderer/features/pomodoro/pomodoro.js';
import { normalizeSettings } from '../renderer/features/pomodoro/settings.js';

const settings = normalizeSettings({
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
});
const F = settings.focusMinutes * 60000;
const S = settings.shortBreakMinutes * 60000;
const L = settings.longBreakMinutes * 60000;

function createFakeClock() {
  let fakeNow = 0;
  let scheduled = null;
  return {
    now: () => fakeNow,
    intervalFn: (fn) => {
      scheduled = fn;
      return 1;
    },
    clearFn: () => {
      scheduled = null;
    },
    advance: (ms) => {
      fakeNow += ms;
      if (scheduled) scheduled();
    },
    passWhilePaused: (ms) => {
      fakeNow += ms;
    },
  };
}

function createEngine(clock) {
  return createPomodoroEngine({
    settings,
    now: clock.now,
    intervalFn: clock.intervalFn,
    clearFn: clock.clearFn,
  });
}

describe('pomodoro engine — estados', () => {
  test('estado inicial: idle, foco, duração cheia', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    const snapshot = engine.getSnapshot();
    expect(snapshot.state).toBe(STATE.IDLE);
    expect(snapshot.phase).toBe(PHASES.FOCUS);
    expect(snapshot.remainingMs).toBe(F);
    expect(snapshot.totalMs).toBe(F);
    expect(snapshot.completedCycles).toBe(0);
  });

  test('start -> running e tick sem drift', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    expect(engine.getSnapshot().state).toBe(STATE.RUNNING);

    clock.advance(60000);
    expect(engine.getSnapshot().remainingMs).toBe(F - 60000);

    clock.advance(180000);
    expect(engine.getSnapshot().remainingMs).toBe(F - 240000);
  });

  test('pausa congela o tempo restante', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(120000);
    engine.pause();

    const before = engine.getSnapshot().remainingMs;
    clock.passWhilePaused(600000);
    const after = engine.getSnapshot().remainingMs;

    expect(engine.getSnapshot().state).toBe(STATE.PAUSED);
    expect(after).toBe(before);
    expect(after).toBe(F - 120000);
  });

  test('resume continua do ponto onde parou', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(60000);
    engine.pause();
    engine.resume();

    expect(engine.getSnapshot().state).toBe(STATE.RUNNING);
    clock.advance(60000);
    expect(engine.getSnapshot().remainingMs).toBe(F - 120000);
  });

  test('skip avança para a próxima fase sem contar ciclo', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    engine.skip();

    const snapshot = engine.getSnapshot();
    expect(snapshot.state).toBe(STATE.IDLE);
    expect(snapshot.phase).toBe(PHASES.SHORT_BREAK);
    expect(snapshot.remainingMs).toBe(S);
    expect(snapshot.completedCycles).toBe(0);
  });

  test('reset volta ao estado inicial', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(60000);
    engine.pause();
    engine.reset();

    const snapshot = engine.getSnapshot();
    expect(snapshot.state).toBe(STATE.IDLE);
    expect(snapshot.phase).toBe(PHASES.FOCUS);
    expect(snapshot.remainingMs).toBe(F);
    expect(snapshot.completedCycles).toBe(0);
  });
});

describe('pomodoro engine — rotação de fases', () => {
  test('fim do foco auto-transiciona para pausa curta e auto-inicia', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(F);

    const snapshot = engine.getSnapshot();
    expect(snapshot.phase).toBe(PHASES.SHORT_BREAK);
    expect(snapshot.remainingMs).toBe(S);
    expect(snapshot.completedCycles).toBe(1);
    expect(snapshot.state).toBe(STATE.RUNNING);
  });

  test('4 ciclos de foco levam à pausa longa', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();

    clock.advance(F);
    expect(engine.getSnapshot().phase).toBe(PHASES.SHORT_BREAK);
    clock.advance(S);
    expect(engine.getSnapshot().phase).toBe(PHASES.FOCUS);

    clock.advance(F);
    clock.advance(S);
    clock.advance(F);
    clock.advance(S);
    clock.advance(F);

    const snapshot = engine.getSnapshot();
    expect(snapshot.phase).toBe(PHASES.LONG_BREAK);
    expect(snapshot.remainingMs).toBe(L);
    expect(snapshot.completedCycles).toBe(4);
  });

  test('pausa longa finaliza de volta para o foco', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(F);
    clock.advance(S);
    clock.advance(F);
    clock.advance(S);
    clock.advance(F);
    clock.advance(S);
    clock.advance(F);
    clock.advance(S);
    clock.advance(F);
    clock.advance(L);

    expect(engine.getSnapshot().phase).toBe(PHASES.FOCUS);
  });
});

describe('pomodoro engine — configurações e eventos', () => {
  test('updateSettings em idle atualiza o tempo da fase atual', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.updateSettings({ ...settings, focusMinutes: 40 });
    expect(engine.getSnapshot().remainingMs).toBe(40 * 60000);
  });

  test('updateSettings em sessão preserva o tempo da fase atual', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    engine.start();
    clock.advance(60000);
    engine.updateSettings({ ...settings, focusMinutes: 40 });

    expect(engine.getSnapshot().remainingMs).toBe(F - 60000);
  });

  test('emite eventos tick e phase-change', () => {
    const clock = createFakeClock();
    const engine = createEngine(clock);
    const events = [];
    engine.on((name, snapshot) => events.push({ name, phase: snapshot.phase }));

    engine.start();
    clock.advance(60000);
    clock.advance(F - 60000);

    expect(events.some((e) => e.name === 'tick')).toBe(true);
    const phaseChange = events.filter((e) => e.name === 'phase-change');
    expect(phaseChange).toHaveLength(1);
    expect(phaseChange[0].phase).toBe(PHASES.SHORT_BREAK);
  });
});