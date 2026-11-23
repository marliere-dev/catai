import {
  ALL_MATERIALS,
  ALL_QUANTITIES,
  materialOf,
  quantityLabel,
  relativeTime,
  statusLabel,
} from './labels';

describe('materialOf', () => {
  it('mapeia cada MaterialType pra label e ícone', () => {
    expect(materialOf('CARDBOARD')).toEqual({ label: 'papelão', icon: 'paper' });
    expect(materialOf('ALUMINUM')).toEqual({ label: 'alumínio', icon: 'alum' });
    expect(materialOf('COOKING_OIL')).toEqual({ label: 'óleo', icon: 'oil' });
    expect(materialOf('SMALL_ELECTRONICS')).toEqual({ label: 'eletrônico', icon: 'electronic' });
  });

  it('cobre todos os 8 tipos esperados pelo backend', () => {
    expect(ALL_MATERIALS).toHaveLength(8);
  });
});

describe('quantityLabel', () => {
  it('traduz enums em labels do design', () => {
    expect(quantityLabel('SMALL')).toBe('pequena');
    expect(quantityLabel('MEDIUM')).toBe('média');
    expect(quantityLabel('LARGE')).toBe('grande');
    expect(ALL_QUANTITIES).toHaveLength(3);
  });
});

describe('statusLabel', () => {
  it('cobre os 5 status do backend', () => {
    expect(statusLabel('OPEN')).toBe('aberta');
    expect(statusLabel('RESERVED')).toBe('reservada');
    expect(statusLabel('COMPLETED')).toBe('concluida');
    expect(statusLabel('CANCELLED')).toBe('cancelada');
    expect(statusLabel('EXPIRED')).toBe('expirada');
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-05-02T12:00:00Z');

  it('< 1 min vira "agora"', () => {
    const iso = new Date(now.getTime() - 30_000).toISOString();
    expect(relativeTime(iso, now)).toBe('agora');
  });

  it('minutos viram "há Xmin"', () => {
    const iso = new Date(now.getTime() - 18 * 60_000).toISOString();
    expect(relativeTime(iso, now)).toBe('há 18min');
  });

  it('horas viram "há Xh"', () => {
    const iso = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(relativeTime(iso, now)).toBe('há 3h');
  });

  it('1 dia vira "ontem"', () => {
    const iso = new Date(now.getTime() - 26 * 3_600_000).toISOString();
    expect(relativeTime(iso, now)).toBe('ontem');
  });

  it('< 7 dias vira "há X dias"', () => {
    const iso = new Date(now.getTime() - 4 * 86_400_000).toISOString();
    expect(relativeTime(iso, now)).toBe('há 4 dias');
  });

  it('< 14 dias vira "semana passada"', () => {
    const iso = new Date(now.getTime() - 9 * 86_400_000).toISOString();
    expect(relativeTime(iso, now)).toBe('semana passada');
  });
});
