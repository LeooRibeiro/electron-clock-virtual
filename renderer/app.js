import { initClockView } from './features/clock/clock.view.js';
import { initPomodoroView } from './features/pomodoro/pomodoro.view.js';
import { initTabs } from './core/tabs.js';

if (!window.desktop) {
  document.body.classList.add('is-web');
}

initClockView();
initPomodoroView(document.getElementById('panel-pomodoro'));
initTabs();