import { openDatabaseAsync } from 'expo-sqlite';

import { migrateDatabase } from '@/db/database';
import { listDebts } from '@/db/repository';
import type { Debt } from '@/domain/types';

import type { WidgetData, WidgetDebt } from './types';

export function toWidgetData(debts: Debt[]): WidgetData {
  const widgetDebts: WidgetDebt[] = debts
    .map((debt) => ({
      id: debt.id,
      name: debt.name,
      creditor: debt.creditor,
      balance: debt.currentBalance,
      color: debt.color,
      isActive: debt.isActive,
    }))
    .sort((left, right) => {
      if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
      if (left.balance !== right.balance) return right.balance - left.balance;
      return left.name.localeCompare(right.name, 'es');
    });

  return {
    totalDebt: debts.reduce((total, debt) => total + Math.max(0, debt.currentBalance), 0),
    debts: widgetDebts,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadWidgetData(): Promise<WidgetData> {
  const db = await openDatabaseAsync('deuda-clara.db');
  try {
    await migrateDatabase(db);
    const debts = await listDebts(db);
    return toWidgetData(debts);
  } finally {
    await db.closeAsync();
  }
}

export const emptyWidgetData: WidgetData = {
  totalDebt: 0,
  debts: [],
  updatedAt: new Date(0).toISOString(),
};
