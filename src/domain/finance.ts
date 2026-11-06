import { addMonths, isSameMonth, parseISO, startOfDay } from 'date-fns';

import { dueDateForMonth, daysUntil } from '@/domain/dates';
import type { Debt, Transaction } from '@/domain/types';

export interface MonthSummary {
  income: number;
  expenses: number;
  debtPayments: number;
  outflow: number;
  balance: number;
}

export interface UpcomingPayment {
  debt: Debt;
  dueDate: Date;
  daysUntil: number;
  isOverdue: boolean;
  paidThisMonth: number;
}

export function transactionsForMonth(
  transactions: Transaction[],
  reference: Date
): Transaction[] {
  return transactions.filter((transaction) => isSameMonth(parseISO(transaction.date), reference));
}

export function summarizeMonth(
  transactions: Transaction[],
  reference: Date
): MonthSummary {
  const summary: MonthSummary = {
    income: 0,
    expenses: 0,
    debtPayments: 0,
    outflow: 0,
    balance: 0,
  };

  for (const transaction of transactionsForMonth(transactions, reference)) {
    if (transaction.type === 'income') summary.income += transaction.amount;
    if (transaction.type === 'expense') summary.expenses += transaction.amount;
    if (transaction.type === 'debt_payment') summary.debtPayments += transaction.amount;
  }

  summary.outflow = summary.expenses + summary.debtPayments;
  summary.balance = summary.income - summary.outflow;
  return summary;
}

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + Math.max(0, debt.currentBalance), 0);
}

export function totalOriginalDebt(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + Math.max(0, debt.originalBalance), 0);
}

export function totalMinimumPayment(debts: Debt[]): number {
  return debts.reduce(
    (sum, debt) => sum + (debt.currentBalance > 0 ? Math.max(0, debt.minimumPayment) : 0),
    0
  );
}

export function paidToDebtInMonth(
  transactions: Transaction[],
  debtId: string,
  reference: Date
): number {
  return transactionsForMonth(transactions, reference)
    .filter((transaction) => transaction.type === 'debt_payment' && transaction.debtId === debtId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function debtPaidRatio(debts: Debt[]): number {
  const original = totalOriginalDebt(debts);
  if (original <= 0) return 0;
  return Math.min(1, Math.max(0, (original - totalDebt(debts)) / original));
}

export function getUpcomingPayments(
  debts: Debt[],
  transactions: Transaction[],
  from: Date = new Date(),
  limit = 4
): UpcomingPayment[] {
  const today = startOfDay(from);

  return debts
    .filter((debt) => debt.currentBalance > 0)
    .map((debt) => {
      const currentMonthDue = dueDateForMonth(debt.dueDay, today);
      const paidThisMonth = paidToDebtInMonth(transactions, debt.id, today);
      const minimumCovered =
        debt.minimumPayment > 0
          ? paidThisMonth >= debt.minimumPayment
          : paidThisMonth > 0;
      const dueDate = minimumCovered
        ? dueDateForMonth(debt.dueDay, addMonths(today, 1))
        : currentMonthDue;
      const days = daysUntil(dueDate, today);

      return {
        debt,
        dueDate,
        daysUntil: days,
        isOverdue: days < 0,
        paidThisMonth,
      };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, limit);
}

export function spendingByCategory(
  transactions: Transaction[],
  reference: Date
): { categoryId: string; total: number }[] {
  const totals = new Map<string, number>();

  for (const transaction of transactionsForMonth(transactions, reference)) {
    if (transaction.type !== 'expense' || !transaction.categoryId) continue;
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }

  return [...totals.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}
