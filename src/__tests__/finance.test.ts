import { describe, expect, it } from 'vitest';

import {
  debtPaidRatio,
  getUpcomingPayments,
  paidToDebtInMonth,
  spendingByCategory,
  summarizeMonth,
  totalDebt,
  totalMinimumPayment,
  totalOriginalDebt,
} from '@/domain/finance';
import type { Debt, Transaction } from '@/domain/types';

const reference = new Date(2026, 10, 6); // 6 de noviembre de 2026

function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'debt-1',
    name: 'Tarjeta',
    creditor: 'Banco',
    type: 'credit_card',
    originalBalance: 1_000_000,
    currentBalance: 600_000,
    annualRateBps: 2400,
    minimumPayment: 100_000,
    dueDay: 10,
    color: '#E76F51',
    notes: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 100_000,
    categoryId: 'food',
    debtId: null,
    description: null,
    date: '2026-11-02',
    createdAt: '2026-11-02T12:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
    ...overrides,
  };
}

describe('summarizeMonth', () => {
  it('adds income, expenses and debt payments for the month', () => {
    const transactions = [
      makeTransaction({ id: 'a', type: 'income', amount: 3_000_000, categoryId: 'salary', date: '2026-11-01' }),
      makeTransaction({ id: 'b', type: 'expense', amount: 500_000, date: '2026-11-02' }),
      makeTransaction({
        id: 'c',
        type: 'debt_payment',
        amount: 300_000,
        categoryId: null,
        debtId: 'debt-1',
        date: '2026-11-03',
      }),
    ];

    expect(summarizeMonth(transactions, reference)).toEqual({
      income: 3_000_000,
      expenses: 500_000,
      debtPayments: 300_000,
      outflow: 800_000,
      balance: 2_200_000,
    });
  });

  it('ignores transactions from other months', () => {
    const transactions = [
      makeTransaction({ id: 'a', type: 'income', amount: 1_000_000, date: '2026-10-31' }),
      makeTransaction({ id: 'b', type: 'expense', amount: 200_000, date: '2026-11-30' }),
    ];

    expect(summarizeMonth(transactions, reference)).toMatchObject({
      income: 0,
      expenses: 200_000,
      balance: -200_000,
    });
  });

  it('handles an empty ledger', () => {
    expect(summarizeMonth([], reference)).toEqual({
      income: 0,
      expenses: 0,
      debtPayments: 0,
      outflow: 0,
      balance: 0,
    });
  });
});

describe('debt totals', () => {
  const debts = [
    makeDebt({ id: 'a', currentBalance: 600_000, originalBalance: 1_000_000, minimumPayment: 100_000 }),
    makeDebt({ id: 'b', currentBalance: 0, originalBalance: 400_000, minimumPayment: 50_000 }),
    makeDebt({ id: 'c', currentBalance: 250_000, originalBalance: 250_000, minimumPayment: 25_000 }),
  ];

  it('sums active balances', () => {
    expect(totalDebt(debts)).toBe(850_000);
  });

  it('sums original balances', () => {
    expect(totalOriginalDebt(debts)).toBe(1_650_000);
  });

  it('only counts minimum payments for debts with a balance', () => {
    expect(totalMinimumPayment(debts)).toBe(125_000);
  });

  it('calculates the paid ratio from original balances', () => {
    const ratio = debtPaidRatio(debts);
    expect(ratio).toBeCloseTo((1_650_000 - 850_000) / 1_650_000, 10);
  });

  it('returns zero ratio when there are no original balances', () => {
    expect(debtPaidRatio([])).toBe(0);
    expect(debtPaidRatio([makeDebt({ originalBalance: 0, currentBalance: 0 })])).toBe(0);
  });
});

describe('paidToDebtInMonth', () => {
  it('only sums payments for the requested debt and month', () => {
    const transactions = [
      makeTransaction({ id: 'a', type: 'debt_payment', amount: 80_000, categoryId: null, debtId: 'debt-1', date: '2026-11-03' }),
      makeTransaction({ id: 'b', type: 'debt_payment', amount: 20_000, categoryId: null, debtId: 'debt-1', date: '2026-11-20' }),
      makeTransaction({ id: 'c', type: 'debt_payment', amount: 50_000, categoryId: null, debtId: 'debt-2', date: '2026-11-05' }),
      makeTransaction({ id: 'd', type: 'debt_payment', amount: 30_000, categoryId: null, debtId: 'debt-1', date: '2026-10-05' }),
      makeTransaction({ id: 'e', type: 'expense', amount: 30_000, debtId: 'debt-1', date: '2026-11-06' }),
    ];

    expect(paidToDebtInMonth(transactions, 'debt-1', reference)).toBe(100_000);
  });
});

describe('getUpcomingPayments', () => {
  it('returns the next due date for each active debt', () => {
    const payments = getUpcomingPayments(
      [makeDebt({ id: 'a', dueDay: 10, minimumPayment: 100_000 })],
      [],
      reference
    );

    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      daysUntil: 4,
      isOverdue: false,
      paidThisMonth: 0,
    });
    expect(payments[0]?.dueDate.getDate()).toBe(10);
  });

  it('keeps an unpaid past due date visible as overdue', () => {
    const payments = getUpcomingPayments(
      [makeDebt({ id: 'a', dueDay: 1, minimumPayment: 100_000 })],
      [],
      reference
    );

    expect(payments[0]?.dueDate.getMonth()).toBe(10);
    expect(payments[0]?.daysUntil).toBe(-5);
    expect(payments[0]?.isOverdue).toBe(true);
  });

  it('advances to next month when the minimum was covered', () => {
    const payments = getUpcomingPayments(
      [makeDebt({ id: 'a', dueDay: 10, minimumPayment: 100_000 })],
      [
        makeTransaction({
          type: 'debt_payment',
          amount: 100_000,
          categoryId: null,
          debtId: 'a',
          date: '2026-11-05',
        }),
      ],
      reference
    );

    expect(payments[0]?.dueDate.getMonth()).toBe(11);
    expect(payments[0]?.paidThisMonth).toBe(100_000);
  });

  it('sorts by nearest due date and respects the limit', () => {
    const payments = getUpcomingPayments(
      [
        makeDebt({ id: 'a', dueDay: 20 }),
        makeDebt({ id: 'b', dueDay: 8 }),
        makeDebt({ id: 'c', dueDay: 15 }),
      ],
      [],
      reference,
      2
    );

    expect(payments.map((payment) => payment.debt.id)).toEqual(['b', 'c']);
  });

  it('ignores debts with zero balance', () => {
    const payments = getUpcomingPayments(
      [makeDebt({ id: 'a', currentBalance: 0 })],
      [],
      reference
    );

    expect(payments).toEqual([]);
  });
});

describe('spendingByCategory', () => {
  it('groups expenses by category for the month, largest first', () => {
    const transactions = [
      makeTransaction({ id: 'a', categoryId: 'food', amount: 120_000, date: '2026-11-02' }),
      makeTransaction({ id: 'b', categoryId: 'transport', amount: 80_000, date: '2026-11-03' }),
      makeTransaction({ id: 'c', categoryId: 'food', amount: 30_000, date: '2026-11-04' }),
      makeTransaction({ id: 'd', categoryId: 'food', amount: 999_000, date: '2026-10-04' }),
      makeTransaction({ id: 'e', type: 'income', categoryId: 'salary', amount: 999_000, date: '2026-11-05' }),
      makeTransaction({ id: 'f', categoryId: null, amount: 50_000, date: '2026-11-06' }),
    ];

    expect(spendingByCategory(transactions, reference)).toEqual([
      { categoryId: 'food', total: 150_000 },
      { categoryId: 'transport', total: 80_000 },
    ]);
  });
});
