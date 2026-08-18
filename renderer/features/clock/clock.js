function getGreeting(hour) {
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

function updateClock(clockEl, dateEl, greetingEl) {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString('pt-BR');
  clockEl.dateTime = now.toISOString();

  dateEl.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  dateEl.dateTime = now.toISOString().slice(0, 10);

  greetingEl.textContent = getGreeting(now.getHours());
}

export function initClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');

  const tick = () => updateClock(clockEl, dateEl, greetingEl);
  tick();
  setInterval(tick, 1000);
}