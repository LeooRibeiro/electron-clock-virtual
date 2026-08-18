import { createPomodoroEngine, PHASES, STATE } from './pomodoro.js';
import { loadSettings, saveSettings } from './settings.js';
import {
  NOTIFICATION_PERMISSION,
  getNotificationPermission,
  notify,
  requestNotificationPermission,
} from '../../core/notify.js';

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PHASE_META = {
  [PHASES.FOCUS]: { label: 'Foco', mod: 'pomodoro--focus' },
  [PHASES.SHORT_BREAK]: { label: 'Pausa curta', mod: 'pomodoro--break' },
  [PHASES.LONG_BREAK]: { label: 'Pausa longa', mod: 'pomodoro--break' },
};

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function template() {
  return `
    <div class="pomodoro">
      <aside class="pomodoro__settings" aria-label="Configurações do Pomodoro">
        <h2 class="pomodoro__settings-title">Períodos</h2>
        <label class="pomodoro__field">
          <span>Foco (min)</span>
          <input type="number" data-setting="focusMinutes" min="1" max="120" value="25">
        </label>
        <label class="pomodoro__field">
          <span>Pausa curta (min)</span>
          <input type="number" data-setting="shortBreakMinutes" min="1" max="60" value="5">
        </label>
        <label class="pomodoro__field">
          <span>Pausa longa (min)</span>
          <input type="number" data-setting="longBreakMinutes" min="1" max="60" value="15">
        </label>

        <div class="pomodoro__notify">
          <h2 class="pomodoro__settings-title">Notificações</h2>
          <button class="pomodoro__btn" type="button" data-action="enable-notifications">
            Ativar notificações
          </button>
          <p class="pomodoro__notify-status" data-notify-status role="status"></p>
        </div>
      </aside>

      <div class="pomodoro__timer">
        <header class="card__header">
          <svg class="card__icon" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="#ff9d6f" stroke-width="1.4">
              <path d="M12 4C8 4 5 7 5 11c0 4 2.5 7 5.5 8.4a2 2 0 0 0 3 0C16.5 18 19 15 19 11c0-4-3-7-7-7z"/>
              <path d="M9.5 10.5 12 13l2.5-2.5"/>
              <circle cx="12" cy="11" r="6.5"/>
            </g>
            <circle cx="12" cy="11" r="1.8" fill="#ff9d6f"/>
          </svg>
          <h1 class="card__title">Pomodoro</h1>
        </header>

        <div class="card__separator" aria-hidden="true"></div>

        <p class="pomodoro__phase" role="status" aria-live="polite">Foco</p>

        <div class="pomodoro__ring">
          <svg viewBox="0 0 120 120" role="img" aria-label="Progresso do Pomodoro">
            <circle class="pomodoro__ring-track" cx="60" cy="60" r="54"></circle>
            <circle class="pomodoro__ring-progress" cx="60" cy="60" r="54"></circle>
          </svg>
          <span class="pomodoro__time" role="timer">25:00</span>
        </div>

        <p class="pomodoro__cycles" aria-live="polite">Ciclo 0 de 4</p>

        <div class="pomodoro__controls">
          <button class="pomodoro__btn pomodoro__btn--primary" type="button" data-action="primary">Iniciar</button>
          <button class="pomodoro__btn" type="button" data-action="skip">Pular</button>
          <button class="pomodoro__btn" type="button" data-action="reset">Resetar</button>
        </div>
      </div>
    </div>
  `;
}

export function initPomodoroView(container) {
  container.innerHTML = template();

  const root = container.querySelector('.pomodoro');
  const phaseEl = root.querySelector('.pomodoro__phase');
  const timeEl = root.querySelector('.pomodoro__time');
  const cyclesEl = root.querySelector('.pomodoro__cycles');
  const ringEl = root.querySelector('.pomodoro__ring-progress');
  const primaryBtn = root.querySelector('[data-action="primary"]');
  const skipBtn = root.querySelector('[data-action="skip"]');
  const resetBtn = root.querySelector('[data-action="reset"]');
  const inputs = [...root.querySelectorAll('[data-setting]')];
  const notifyBtn = root.querySelector('[data-action="enable-notifications"]');
  const notifyStatusEl = root.querySelector('[data-notify-status]');

  const settings = loadSettings();
  const engine = createPomodoroEngine({ settings });

  ringEl.style.strokeDasharray = String(RING_CIRCUMFERENCE);
  inputs.forEach((input) => {
    input.value = settings[input.dataset.setting];
  });

  function render() {
    const snapshot = engine.getSnapshot();
    const meta = PHASE_META[snapshot.phase];

    phaseEl.textContent = meta.label;
    root.classList.remove('pomodoro--focus', 'pomodoro--break');
    root.classList.add(meta.mod);

    timeEl.textContent = formatTime(snapshot.remainingMs);

    const progress = snapshot.totalMs > 0 ? snapshot.remainingMs / snapshot.totalMs : 0;
    ringEl.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));

    cyclesEl.textContent = `Ciclo ${snapshot.cycle} de ${snapshot.totalCycles}`;

    primaryBtn.textContent =
      snapshot.state === STATE.RUNNING ? 'Pausar'
      : snapshot.state === STATE.PAUSED ? 'Retomar'
      : 'Iniciar';

    const locked = snapshot.state !== STATE.IDLE;
    inputs.forEach((input) => {
      input.disabled = locked;
    });
  }

  primaryBtn.addEventListener('click', () => {
    const snapshot = engine.getSnapshot();
    if (snapshot.state === STATE.RUNNING) {
      engine.pause();
    } else {
      engine.start();
    }
  });

  skipBtn.addEventListener('click', () => engine.skip());
  resetBtn.addEventListener('click', () => engine.reset());

  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      const next = Object.fromEntries(
        inputs.map((field) => [field.dataset.setting, Number(field.value)])
      );
      const normalized = saveSettings(next);
      engine.updateSettings(normalized);
    });
  });

  function renderNotificationStatus() {
    if (window.desktop && typeof window.desktop.notify === 'function') {
      notifyStatusEl.textContent = 'Notificações nativas do sistema';
      notifyBtn.hidden = true;
      return;
    }

    const permission = getNotificationPermission();
    if (permission === NOTIFICATION_PERMISSION.GRANTED) {
      notifyStatusEl.textContent = 'Notificações ativadas!';
      notifyBtn.hidden = true;
    } else if (permission === NOTIFICATION_PERMISSION.DENIED) {
      notifyStatusEl.textContent = 'Bloqueadas — libere nas configurações do navegador';
      notifyBtn.disabled = true;
    } else if (permission === NOTIFICATION_PERMISSION.UNSUPPORTED) {
      notifyStatusEl.textContent = 'Navegador não suporta notificações';
      notifyBtn.hidden = true;
    } else {
      notifyStatusEl.textContent = 'Permita para receber alertas ao fim de cada fase';
    }
  }

  notifyBtn.addEventListener('click', async () => {
    const result = await requestNotificationPermission();
    if (result === NOTIFICATION_PERMISSION.GRANTED) {
      const shown = await notify({ title: 'Clock Virtual 🔔', body: 'Notificações ativadas!' });
      if (!shown) return;
    }
    renderNotificationStatus();
  });

  engine.on((name, snapshot) => {
    render();
    if (name === 'phase-change') {
      notifyPhaseChange(snapshot);
    }
    if (name === 'complete') {
      notify({ title: 'Sessão concluída 🏆', body: '6 ciclos finalizados! Bora focar? 🎯' });
    }
  });
  render();
  renderNotificationStatus();
}

const PHASE_NOTIFICATION = {
  [PHASES.FOCUS]: { title: 'Pausa concluída ⏰', body: 'Bora focar! 🎯' },
  [PHASES.SHORT_BREAK]: { title: 'Foco concluído 🍅', body: 'Hora da pausa curta ☕' },
  [PHASES.LONG_BREAK]: { title: 'Foco concluído 🍅', body: 'Hora da pausa longa 🧘' },
};

function notifyPhaseChange(snapshot) {
  const message = PHASE_NOTIFICATION[snapshot.phase];
  if (message) {
    notify(message);
  }
}