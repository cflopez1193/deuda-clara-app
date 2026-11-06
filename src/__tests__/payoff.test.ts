import { describe, expect, it } from 'vitest';

import { buildPayoffPlan, payoffReasonMessage, type PayoffDebtInput } from '@/domain/payoff';

function makeDebt(overrides: Partial<PayoffDebtInput> = {}): PayoffDebtInput {
  return {
    id: 'debt-1',
    name: 'Tarjeta',
    balance: 100_000,
    annualRateBps: 0,
    minimumPayment: 10_000,
    ...overrides,
  };
}

describe('buildPayoffPlan', () => {
  it('reports when there are no debts', () => {
    const plan = buildPayoffPlan([], 'avalanche', 0);

    expect(plan).toMatchObject({
      hasDebts: false,
      feasible: false,
      reason: 'no_debts',
      months: 0,
    });
  });

  it('reports when there is no payment capacity', () => {
    const plan = buildPayoffPlan([makeDebt({ minimumPayment: 0 })], 'avalanche', 0);

    expect(plan).toMatchObject({
      hasDebts: true,
      feasible: false,
      reason: 'no_payment',
      monthlyMinimum: 0,
      monthlyBudget: 0,
    });
  });

  it('pays a zero-interest debt in the expected number of months', () => {
    const plan = buildPayoffPlan([makeDebt()], 'avalanche', 0);

    expect(plan.feasible).toBe(true);
    expect(plan.months).toBe(10);
    expect(plan.totalInterest).toBe(0);
    expect(plan.totalPaid).toBe(100_000);
    expect(plan.monthlyBudget).toBe(10_000);
  });

  it('shortens the plan with an extra monthly payment', () => {
    const base = buildPayoffPlan([makeDebt()], 'snowball', 0);
    const boosted = buildPayoffPlan([makeDebt()], 'snowball', 10_000);

    expect(base.months).toBe(10);
    expect(boosted.months).toBe(5);
    expect(boosted.totalPaid).toBe(100_000);
  });

  it('orders avalanche by the highest annual rate first', () => {
    const plan = buildPayoffPlan(
      [
        makeDebt({ id: 'low', name: 'Bajo', balance: 500_000, annualRateBps: 1200, minimumPayment: 50_000 }),
        makeDebt({ id: 'high', name: 'Alto', balance: 200_000, annualRateBps: 2400, minimumPayment: 50_000 }),
      ],
      'avalanche',
      50_000
    );

    expect(plan.order.map((item) => item.id)).toEqual(['high', 'low']);
    expect(plan.order[0]?.rank).toBe(1);
  });

  it('orders snowball by the smallest balance first', () => {
    const plan = buildPayoffPlan(
      [
        makeDebt({ id: 'big', name: 'Grande', balance: 500_000, minimumPayment: 50_000 }),
        makeDebt({ id: 'small', name: 'Pequeña', balance: 100_000, minimumPayment: 50_000 }),
      ],
      'snowball',
      50_000
    );

    expect(plan.order.map((item) => item.id)).toEqual(['small', 'big']);
  });

  it('reports when interest consumes the whole budget', () => {
    const plan = buildPayoffPlan(
      [makeDebt({ balance: 1_000_000, annualRateBps: 10_000, minimumPayment: 1_000 })],
      'avalanche',
      0
    );

    expect(plan).toMatchObject({
      hasDebts: true,
      feasible: false,
      reason: 'not_enough',
      months: 0,
    });
    expect(plan.initialMonthlyInterest).toBeGreaterThan(plan.monthlyBudget);
  });

  it('pays off multiple debts and charges interest', () => {
    const plan = buildPayoffPlan(
      [
        makeDebt({ id: 'a', balance: 300_000, annualRateBps: 2400, minimumPayment: 50_000 }),
        makeDebt({ id: 'b', balance: 150_000, annualRateBps: 1200, minimumPayment: 30_000 }),
      ],
      'avalanche',
      70_000
    );

    expect(plan.feasible).toBe(true);
    expect(plan.months).toBeGreaterThan(0);
    expect(plan.months).toBeLessThan(600);
    expect(plan.totalInterest).toBeGreaterThan(0);
    expect(plan.totalPaid).toBeGreaterThan(450_000);
    expect(plan.monthlyBudget).toBe(150_000);
  });

  it('is feasible with a zero minimum payment when there is extra money', () => {
    const plan = buildPayoffPlan(
      [makeDebt({ minimumPayment: 0 })],
      'avalanche',
      10_000
    );

    expect(plan.feasible).toBe(true);
    expect(plan.months).toBe(10);
  });
});

describe('payoffReasonMessage', () => {
  it('returns a helpful message for each reason', () => {
    expect(payoffReasonMessage('no_debts')).toContain('deuda');
    expect(payoffReasonMessage('no_payment')).toContain('cuota');
    expect(payoffReasonMessage('not_enough')).toContain('intereses');
    expect(payoffReasonMessage('too_long')).toContain('50 años');
    expect(payoffReasonMessage(undefined)).toBe('');
  });
});
