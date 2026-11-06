import { describe, expect, it } from 'vitest';

import {
  daysRemainingInMonth,
  daysUntil,
  dueDateForMonth,
  nextDueDate,
  todayKey,
} from '@/domain/dates';

describe('todayKey', () => {
  it('formats a local date as yyyy-MM-dd', () => {
    expect(todayKey(new Date(2026, 10, 6))).toBe('2026-11-06');
    expect(todayKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('dueDateForMonth', () => {
  it('builds the due date inside the month', () => {
    const due = dueDateForMonth(15, new Date(2026, 10, 6));
    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(10);
    expect(due.getDate()).toBe(15);
  });

  it('clamps to the last day of short months', () => {
    const due = dueDateForMonth(31, new Date(2026, 1, 10));
    expect(due.getMonth()).toBe(1);
    expect(due.getDate()).toBe(28);
  });

  it('clamps the due day to a valid range', () => {
    expect(dueDateForMonth(0, new Date(2026, 10, 6)).getDate()).toBe(1);
    expect(dueDateForMonth(99, new Date(2026, 10, 6)).getDate()).toBe(30);
  });
});

describe('nextDueDate', () => {
  it('returns this month when the due date is still ahead', () => {
    const due = nextDueDate(15, new Date(2026, 10, 6));
    expect(due.getMonth()).toBe(10);
    expect(due.getDate()).toBe(15);
  });

  it('moves to the next month when the due date already passed', () => {
    const due = nextDueDate(1, new Date(2026, 10, 6));
    expect(due.getMonth()).toBe(11);
    expect(due.getDate()).toBe(1);
  });

  it('returns today when the due day is today', () => {
    const due = nextDueDate(6, new Date(2026, 10, 6));
    expect(due.getMonth()).toBe(10);
    expect(due.getDate()).toBe(6);
  });
});

describe('daysUntil', () => {
  it('counts calendar days from a reference date', () => {
    expect(daysUntil(new Date(2026, 10, 10), new Date(2026, 10, 6))).toBe(4);
    expect(daysUntil(new Date(2026, 10, 6), new Date(2026, 10, 6))).toBe(0);
    expect(daysUntil(new Date(2026, 10, 1), new Date(2026, 10, 6))).toBe(-5);
  });
});

describe('daysRemainingInMonth', () => {
  it('includes the current day', () => {
    expect(daysRemainingInMonth(new Date(2026, 10, 6))).toBe(25);
    expect(daysRemainingInMonth(new Date(2026, 10, 30))).toBe(1);
  });
});
