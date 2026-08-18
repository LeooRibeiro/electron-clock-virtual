export function getGreeting(hour) {
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

export function getTimeSnapshot(date = new Date()) {
  return {
    time: date.toLocaleTimeString('pt-BR'),
    timeISO: date.toISOString(),
    date: date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    dateISO: date.toISOString().slice(0, 10),
    greeting: getGreeting(date.getHours()),
  };
}