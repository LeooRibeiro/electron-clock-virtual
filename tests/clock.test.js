import { getGreeting, getTimeSnapshot } from '../renderer/features/clock/clock.js';

describe('clock engine', () => {
  test('getGreeting retorna saudação correta por período', () => {
    expect(getGreeting(0)).toBe('Bom dia!');
    expect(getGreeting(11)).toBe('Bom dia!');
    expect(getGreeting(12)).toBe('Boa tarde!');
    expect(getGreeting(17)).toBe('Boa tarde!');
    expect(getGreeting(18)).toBe('Boa noite!');
    expect(getGreeting(23)).toBe('Boa noite!');
  });

  test('getTimeSnapshot formata hora em pt-BR', () => {
    const snapshot = getTimeSnapshot(new Date(2026, 7, 17, 9, 5, 7));
    expect(snapshot.time).toBe('09:05:07');
    expect(snapshot.greeting).toBe('Bom dia!');
  });

  test('getTimeSnapshot inclui data completa e ISO', () => {
    const snapshot = getTimeSnapshot(new Date(2026, 7, 17, 9, 5, 7));
    expect(snapshot.date).toMatch(/segunda-feira/);
    expect(snapshot.date).toMatch(/agosto/);
    expect(snapshot.timeISO.startsWith('2026-08-17')).toBe(true);
    expect(snapshot.dateISO).toBe('2026-08-17');
  });
});