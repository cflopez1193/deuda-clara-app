import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatNumberInput,
  formatPercentFromBps,
  clamp,
  monthlyRateFromBps,
  parseMoneyInput,
  parsePercentInput,
} from '@/domain/money';

describe('formatMoney', () => {
  it('formats positive amounts in Colombian pesos', () => {
    expect(formatMoney(1234567)).toBe('$ 1.234.567');
    expect(formatMoney(0)).toBe('$ 0');
    expect(formatMoney(999)).toBe('$ 999');
  });

  it('keeps the sign for negative amounts', () => {
    expect(formatMoney(-45000)).toBe('-$ 45.000');
  });

  it('rounds decimals to whole pesos', () => {
    expect(formatMoney(1234.6)).toBe('$ 1.235');
  });
});

describe('money input helpers', () => {
  it('parses formatted input into integer COP', () => {
    expect(parseMoneyInput('$ 1.234.567')).toBe(1234567);
    expect(parseMoneyInput('1.234.567')).toBe(1234567);
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });

  it('formats positive values for inputs', () => {
    expect(formatNumberInput(1234567)).toBe('1.234.567');
    expect(formatNumberInput(0)).toBe('');
    expect(formatNumberInput(-5)).toBe('');
  });

  it('parses percentages into basis points', () => {
    expect(parsePercentInput('24,5')).toBe(2450);
    expect(parsePercentInput('12.5')).toBe(1250);
    expect(parsePercentInput('')).toBe(0);
    expect(parsePercentInput('-3')).toBe(0);
  });

  it('formats basis points as percentages', () => {
    expect(formatPercentFromBps(2450)).toBe('24,5%');
    expect(formatPercentFromBps(1200)).toBe('12%');
    expect(formatPercentFromBps(0)).toBe('0%');
  });
});

describe('monthlyRateFromBps', () => {
  it('returns zero for zero annual rate', () => {
    expect(monthlyRateFromBps(0)).toBe(0);
  });

  it('converts an effective annual rate to a monthly rate', () => {
    const monthly = monthlyRateFromBps(1200);
    expect(monthly).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1, 10);
    expect(monthly).toBeGreaterThan(0.0094);
    expect(monthly).toBeLessThan(0.0095);
  });
});

describe('clamp', () => {
  it('limits values to the range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
