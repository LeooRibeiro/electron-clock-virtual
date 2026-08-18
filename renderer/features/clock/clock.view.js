import { getTimeSnapshot } from './clock.js';

function scheduleNextTick(render) {
  const delay = 1000 - new Date().getMilliseconds();
  setTimeout(() => {
    render();
    scheduleNextTick(render);
  }, delay);
}

export function initClockView() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');

  function render() {
    const snapshot = getTimeSnapshot();

    clockEl.textContent = snapshot.time;
    clockEl.dateTime = snapshot.timeISO;

    dateEl.textContent = snapshot.date;
    dateEl.dateTime = snapshot.dateISO;

    greetingEl.textContent = snapshot.greeting;
  }

  render();
  scheduleNextTick(render);
}