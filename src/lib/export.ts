import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Backup, Category, Transaction } from '@/domain/types';

function timestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function shareFile(filename: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle: 'Compartir respaldo de Deuda Clara',
    });
    return;
  }

  throw new Error(`El archivo se creó en ${file.uri}, pero no hay una app para compartirlo.`);
}

export async function shareBackupJson(backup: Backup): Promise<void> {
  await shareFile(
    `deuda-clara-${timestamp()}.json`,
    JSON.stringify(backup, null, 2),
    'application/json'
  );
}

function escapeCsv(value: string | number | null): string {
  if (value == null) return '';
  const text = String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function shareTransactionsCsv(
  transactions: Transaction[],
  categories: Category[]
): Promise<void> {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const header = ['fecha', 'tipo', 'categoria', 'descripcion', 'monto_cop', 'deuda_id'];
  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.type === 'expense'
      ? 'gasto'
      : transaction.type === 'income'
        ? 'ingreso'
        : 'pago_deuda',
    transaction.categoryId ? (categoryNames.get(transaction.categoryId) ?? '') : '',
    transaction.description ?? '',
    transaction.amount,
    transaction.debtId ?? '',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(','))
    .join('\n');

  await shareFile(`movimientos-${timestamp()}.csv`, `\uFEFF${csv}`, 'text/csv');
}
