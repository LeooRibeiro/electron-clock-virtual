// Elementos do relógio
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

// Saudação de acordo com o horário
function getGreeting(hour) {
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

// Atualiza hora, data e saudação na tela
function updateClock() {
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

// Atualiza na carga e a cada segundo
updateClock();
setInterval(updateClock, 1000);