import { monthlyRateFromBps } from '@/domain/money';
import type { PayoffStrategy } from '@/domain/types';

export interface PayoffDebtInput {
  id: string;
  name: string;
  balance: number;
  annualRateBps: number;
  minimumPayment: number;
  color?: string;
}

export interface PayoffOrderItem {
  id: string;
  name: string;
  balance: number;
  annualRateBps: number;
  monthlyInterest: number;
  color?: string;
  rank: number;
}

export type PayoffReason = 'no_debts' | 'no_payment' | 'not_enough' | 'too_long';

export interface PayoffPlan {
  hasDebts: boolean;
  feasible: boolean;
  reason?: PayoffReason;
  months: number;
  monthlyMinimum: number;
  monthlyBudget: number;
  initialMonthlyInterest: number;
  totalInterest: number;
  totalPaid: number;
  order: PayoffOrderItem[];
}

interface SimulationDebt extends PayoffDebtInput {
  monthlyRate: number;
  current: number;
}

const MAX_MONTHS = 600;

function sortForStrategy(debts: SimulationDebt[], strategy: PayoffStrategy): SimulationDebt[] {
  return [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      if (b.annualRateBps !== a.annualRateBps) return b.annualRateBps - a.annualRateBps;
      return a.current - b.current;
    }
    if (a.current !== b.current) return a.current - b.current;
    return b.annualRateBps - a.annualRateBps;
  });
}

function emptyPlan(reason?: PayoffReason): PayoffPlan {
  return {
    hasDebts: false,
    feasible: reason == null,
    reason,
    months: 0,
    monthlyMinimum: 0,
    monthlyBudget: 0,
    initialMonthlyInterest: 0,
    totalInterest: 0,
    totalPaid: 0,
    order: [],
  };
}

/**
 * Simulates a fixed monthly payment budget using either avalanche (highest rate
 * first) or snowball (smallest balance first). Payments are allocated to
 * minimums first and the remaining budget goes to the current target debt.
 * This is an educational estimate, not a financial product or guarantee.
 */
export function buildPayoffPlan(
  debts: PayoffDebtInput[],
  strategy: PayoffStrategy,
  extraPayment: number
): PayoffPlan {
  const active = debts.filter((debt) => debt.balance > 0);
  if (active.length === 0) return emptyPlan('no_debts');

  const monthlyMinimum = active.reduce(
    (sum, debt) => sum + Math.max(0, Math.round(debt.minimumPayment)),
    0
  );
  const monthlyBudget = monthlyMinimum + Math.max(0, Math.round(extraPayment));
  if (monthlyBudget <= 0) {
    return {
      ...emptyPlan('no_payment'),
      hasDebts: true,
      monthlyMinimum,
      monthlyBudget,
    };
  }

  const simulation: SimulationDebt[] = active.map((debt) => ({
    ...debt,
    balance: Math.max(0, Math.round(debt.balance)),
    minimumPayment: Math.max(0, Math.round(debt.minimumPayment)),
    annualRateBps: Math.max(0, debt.annualRateBps),
    monthlyRate: monthlyRateFromBps(debt.annualRateBps),
    current: Math.max(0, Math.round(debt.balance)),
  }));

  const initialMonthlyInterest = simulation.reduce(
    (sum, debt) => sum + debt.current * debt.monthlyRate,
    0
  );

  const order = sortForStrategy(simulation, strategy).map((debt, index) => ({
    id: debt.id,
    name: debt.name,
    balance: Math.round(debt.balance),
    annualRateBps: debt.annualRateBps,
    monthlyInterest: Math.round(debt.current * debt.monthlyRate),
    color: debt.color,
    rank: index + 1,
  }));

  if (initialMonthlyInterest >= monthlyBudget) {
    return {
      hasDebts: true,
      feasible: false,
      reason: 'not_enough',
      months: 0,
      monthlyMinimum,
      monthlyBudget,
      initialMonthlyInterest: Math.round(initialMonthlyInterest),
      totalInterest: 0,
      totalPaid: 0,
      order,
    };
  }

  let totalInterest = 0;
  let totalPaid = 0;

  for (let month = 1; month <= MAX_MONTHS; month += 1) {
    const balanceBeforeInterest = simulation.reduce((sum, debt) => sum + debt.current, 0);

    for (const debt of simulation) {
      if (debt.current <= 0) continue;
      const interest = debt.current * debt.monthlyRate;
      debt.current += interest;
      totalInterest += interest;
    }

    let budgetRemaining = monthlyBudget;

    for (const debt of simulation) {
      if (debt.current <= 0 || debt.minimumPayment <= 0) continue;
      const payment = Math.min(debt.minimumPayment, debt.current, budgetRemaining);
      debt.current -= payment;
      budgetRemaining -= payment;
      totalPaid += payment;
    }

    for (const debt of sortForStrategy(simulation, strategy)) {
      if (budgetRemaining <= 0) break;
      if (debt.current <= 0) continue;
      const payment = Math.min(debt.current, budgetRemaining);
      debt.current -= payment;
      budgetRemaining -= payment;
      totalPaid += payment;
    }

    const remaining = simulation.reduce((sum, debt) => sum + Math.max(0, debt.current), 0);
    if (remaining < 0.5) {
      return {
        hasDebts: true,
        feasible: true,
        months: month,
        monthlyMinimum,
        monthlyBudget,
        initialMonthlyInterest: Math.round(initialMonthlyInterest),
        totalInterest: Math.round(totalInterest),
        totalPaid: Math.round(totalPaid),
        order,
      };
    }

    // If a full month did not reduce the principal at all, the payment budget
    // can never amortize this debt with constant rates.
    if (remaining >= balanceBeforeInterest - 0.5) {
      return {
        hasDebts: true,
        feasible: false,
        reason: 'not_enough',
        months: 0,
        monthlyMinimum,
        monthlyBudget,
        initialMonthlyInterest: Math.round(initialMonthlyInterest),
        totalInterest: Math.round(totalInterest),
        totalPaid: Math.round(totalPaid),
        order,
      };
    }
  }

  return {
    hasDebts: true,
    feasible: false,
    reason: 'too_long',
    months: 0,
    monthlyMinimum,
    monthlyBudget,
    initialMonthlyInterest: Math.round(initialMonthlyInterest),
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    order,
  };
}

export function payoffReasonMessage(reason?: PayoffReason): string {
  switch (reason) {
    case 'no_debts':
      return 'Agrega una deuda para calcular tu plan.';
    case 'no_payment':
      return 'Necesitas registrar al menos una cuota mensual para empezar a bajar la deuda.';
    case 'not_enough':
      return 'Con el pago actual los intereses consumen casi todo. Aumenta el abono mensual o revisa las condiciones con tu acreedor.';
    case 'too_long':
      return 'El plan supera 50 años. Necesitas un pago mensual más alto o renegociar las condiciones.';
    default:
      return '';
  }
}
