import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Backup,
  Category,
  Debt,
  NewDebtInput,
  NewTransactionInput,
  OnboardingInput,
  Profile,
  ProfileUpdate,
  Transaction,
} from '@/domain/types';

interface ProfileRow {
  id: number;
  authUserId: string | null;
  name: string;
  monthlyIncome: number;
  extraDebtPayment: number;
  payoffStrategy: Profile['payoffStrategy'];
  currency: 'COP';
  locale: 'es-CO';
  onboardingCompleted: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryRow {
  id: string;
  name: string;
  type: Category['type'];
  icon: string;
  color: string;
  sortOrder: number;
}

interface TransactionRow {
  id: string;
  type: Transaction['type'];
  amount: number;
  categoryId: string | null;
  debtId: string | null;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface DebtRow {
  id: string;
  name: string;
  creditor: string | null;
  type: Debt['type'];
  originalBalance: number;
  currentBalance: number;
  annualRateBps: number;
  minimumPayment: number;
  dueDay: number;
  color: string;
  notes: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_SELECT = `
  SELECT id, auth_user_id AS authUserId, name, monthly_income AS monthlyIncome,
    extra_debt_payment AS extraDebtPayment,
    payoff_strategy AS payoffStrategy, currency, locale,
    onboarding_completed AS onboardingCompleted,
    created_at AS createdAt, updated_at AS updatedAt
  FROM profile WHERE id = 1
`;

const CATEGORY_SELECT = `
  SELECT id, name, type, icon, color, sort_order AS sortOrder
  FROM categories
`;

const TRANSACTION_SELECT = `
  SELECT id, type, amount, category_id AS categoryId, debt_id AS debtId,
    description, date, created_at AS createdAt, updated_at AS updatedAt
  FROM transactions
`;

const DEBT_SELECT = `
  SELECT id, name, creditor, type,
    original_balance AS originalBalance, current_balance AS currentBalance,
    annual_rate_bps AS annualRateBps, minimum_payment AS minimumPayment,
    due_day AS dueDay, color, notes, is_active AS isActive,
    created_at AS createdAt, updated_at AS updatedAt
  FROM debts
`;

function mapProfile(row: ProfileRow | null): Profile | null {
  if (!row) return null;
  return {
    ...row,
    onboardingCompleted: row.onboardingCompleted === 1,
  };
}

function mapDebt(row: DebtRow): Debt {
  return { ...row, isActive: row.isActive === 1 };
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return Crypto.randomUUID();
}

function clampDueDay(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(31, Math.max(1, Math.round(value)));
}

export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  const row = await db.getFirstAsync<ProfileRow>(PROFILE_SELECT);
  return mapProfile(row);
}

export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<CategoryRow>(
    `${CATEGORY_SELECT} ORDER BY type DESC, sort_order ASC, name ASC`
  );
}

export async function listTransactions(
  db: SQLiteDatabase,
  limit = 500
): Promise<Transaction[]> {
  return db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE deleted_at IS NULL
     ORDER BY date DESC, created_at DESC
     LIMIT ?`,
    limit
  );
}

export async function listDebts(db: SQLiteDatabase): Promise<Debt[]> {
  const rows = await db.getAllAsync<DebtRow>(
    `${DEBT_SELECT}
     WHERE deleted_at IS NULL
     ORDER BY current_balance DESC, created_at ASC`
  );
  return rows.map(mapDebt);
}

export async function getDebtById(
  db: SQLiteDatabase,
  debtId: string
): Promise<Debt | null> {
  const row = await db.getFirstAsync<DebtRow>(
    `${DEBT_SELECT} WHERE id = ? AND deleted_at IS NULL`,
    debtId
  );
  return row ? mapDebt(row) : null;
}

export async function listDebtPayments(
  db: SQLiteDatabase,
  debtId: string
): Promise<Transaction[]> {
  return db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE debt_id = ? AND type = 'debt_payment' AND deleted_at IS NULL
     ORDER BY date DESC, created_at DESC`,
    debtId
  );
}

async function insertDebtRow(
  db: SQLiteDatabase,
  input: NewDebtInput,
  timestamp: string
): Promise<string> {
  const id = newId();
  const currentBalance = Math.max(0, Math.round(input.currentBalance));
  const originalBalance = Math.max(
    currentBalance,
    Math.round(input.originalBalance || currentBalance)
  );

  await db.runAsync(
    `INSERT INTO debts (
      id, name, creditor, type, original_balance, current_balance,
      annual_rate_bps, minimum_payment, due_day, color, notes,
      is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    input.creditor?.trim() || null,
    input.type,
    originalBalance,
    currentBalance,
    Math.max(0, Math.round(input.annualRateBps)),
    Math.max(0, Math.round(input.minimumPayment)),
    clampDueDay(input.dueDay),
    input.color ?? '#0E7C66',
    input.notes?.trim() || null,
    input.isActive === false ? 0 : 1,
    timestamp,
    timestamp
  );

  return id;
}

export type ProfileOwnershipResult = 'empty' | 'same' | 'claimed' | 'wiped';

/**
 * Keeps the local database bound to a single authenticated account.
 * A legacy profile without an owner is claimed by the first user; any other
 * account starts with a clean local database so financial data never leaks
 * between users sharing the same phone.
 */
export async function ensureProfileOwnership(
  db: SQLiteDatabase,
  authUserId: string
): Promise<ProfileOwnershipResult> {
  const row = await db.getFirstAsync<{ authUserId: string | null }>(
    'SELECT auth_user_id AS authUserId FROM profile WHERE id = 1'
  );

  if (!row) return 'empty';
  if (row.authUserId === authUserId) return 'same';

  if (row.authUserId == null) {
    await db.runAsync(
      'UPDATE profile SET auth_user_id = ?, updated_at = ? WHERE id = 1',
      authUserId,
      nowIso()
    );
    return 'claimed';
  }

  await resetAllData(db);
  return 'wiped';
}

export async function createOnboarding(
  db: SQLiteDatabase,
  authUserId: string,
  input: OnboardingInput
): Promise<void> {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO profile (
        id, auth_user_id, name, monthly_income, extra_debt_payment, payoff_strategy,
        currency, locale, onboarding_completed, created_at, updated_at
      ) VALUES (1, ?, ?, ?, 0, 'avalanche', 'COP', 'es-CO', 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        auth_user_id = excluded.auth_user_id,
        name = excluded.name,
        monthly_income = excluded.monthly_income,
        onboarding_completed = 1,
        updated_at = excluded.updated_at`,
      authUserId,
      input.name.trim(),
      Math.max(0, Math.round(input.monthlyIncome)),
      timestamp,
      timestamp
    );

    if (input.debt && input.debt.currentBalance > 0) {
      await insertDebtRow(db, input.debt, timestamp);
    }
  });
}

export async function updateProfile(
  db: SQLiteDatabase,
  update: ProfileUpdate
): Promise<void> {
  await db.runAsync(
    `UPDATE profile SET
      name = COALESCE(?, name),
      monthly_income = COALESCE(?, monthly_income),
      extra_debt_payment = COALESCE(?, extra_debt_payment),
      payoff_strategy = COALESCE(?, payoff_strategy),
      updated_at = ?
     WHERE id = 1`,
    update.name?.trim() || null,
    update.monthlyIncome == null ? null : Math.max(0, Math.round(update.monthlyIncome)),
    update.extraDebtPayment == null ? null : Math.max(0, Math.round(update.extraDebtPayment)),
    update.payoffStrategy ?? null,
    nowIso()
  );
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: NewTransactionInput
): Promise<string> {
  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error('El monto debe ser mayor que cero.');

  const id = newId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO transactions (
      id, type, amount, category_id, debt_id, description, date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.type,
    amount,
    input.categoryId ?? null,
    input.debtId ?? null,
    input.description?.trim() || null,
    input.date,
    timestamp,
    timestamp
  );

  return id;
}

export async function deleteTransaction(
  db: SQLiteDatabase,
  transactionId: string
): Promise<void> {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    const transaction = await db.getFirstAsync<TransactionRow>(
      `${TRANSACTION_SELECT} WHERE id = ? AND deleted_at IS NULL`,
      transactionId
    );
    if (!transaction) return;

    await db.runAsync(
      'UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?',
      timestamp,
      timestamp,
      transactionId
    );

    if (transaction.type === 'debt_payment' && transaction.debtId) {
      await db.runAsync(
        `UPDATE debts SET current_balance = current_balance + ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
        transaction.amount,
        timestamp,
        transaction.debtId
      );
    }
  });
}

export async function createDebt(
  db: SQLiteDatabase,
  input: NewDebtInput
): Promise<string> {
  const timestamp = nowIso();
  if (!input.name.trim()) throw new Error('Escribe un nombre para la deuda.');
  if (input.currentBalance <= 0) throw new Error('El saldo debe ser mayor que cero.');
  return insertDebtRow(db, input, timestamp);
}

export async function updateDebt(
  db: SQLiteDatabase,
  debtId: string,
  input: NewDebtInput
): Promise<void> {
  await db.runAsync(
    `UPDATE debts SET
      name = ?, creditor = ?, type = ?, original_balance = ?, current_balance = ?,
      annual_rate_bps = ?, minimum_payment = ?, due_day = ?, color = ?, notes = ?,
      is_active = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    input.name.trim(),
    input.creditor?.trim() || null,
    input.type,
    Math.max(0, Math.round(input.originalBalance)),
    Math.max(0, Math.round(input.currentBalance)),
    Math.max(0, Math.round(input.annualRateBps)),
    Math.max(0, Math.round(input.minimumPayment)),
    clampDueDay(input.dueDay),
    input.color ?? '#0E7C66',
    input.notes?.trim() || null,
    input.isActive === false ? 0 : 1,
    nowIso(),
    debtId
  );
}

export async function toggleDebtActive(
  db: SQLiteDatabase,
  debtId: string,
  isActive: boolean
): Promise<void> {
  await db.runAsync(
    `UPDATE debts SET is_active = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
    isActive ? 1 : 0,
    nowIso(),
    debtId
  );
}

export async function addDebtCredit(
  db: SQLiteDatabase,
  debtId: string,
  amount: number
): Promise<void> {
  const timestamp = nowIso();
  const applied = Math.max(0, Math.round(amount));
  if (applied <= 0) throw new Error('El monto debe ser mayor que cero.');

  await db.withTransactionAsync(async () => {
    const debt = await db.getFirstAsync<DebtRow>(
      `${DEBT_SELECT} WHERE id = ? AND deleted_at IS NULL`,
      debtId
    );
    if (!debt) throw new Error('La deuda no existe.');

    await db.runAsync(
      `UPDATE debts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?`,
      applied,
      timestamp,
      debtId
    );

    // Also update original balance if it's less than current
    await db.runAsync(
      `UPDATE debts SET original_balance = current_balance WHERE id = ? AND original_balance < current_balance`,
      debtId
    );
  });
}

export async function registerDebtPayment(
  db: SQLiteDatabase,
  debtId: string,
  amount: number,
  date: string,
  note?: string
): Promise<number> {
  let applied = 0;
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    const debt = await db.getFirstAsync<DebtRow>(
      `${DEBT_SELECT} WHERE id = ? AND deleted_at IS NULL`,
      debtId
    );
    if (!debt) throw new Error('La deuda no existe.');
    if (debt.currentBalance <= 0) throw new Error('Esta deuda ya está pagada.');

    applied = Math.min(Math.round(amount), debt.currentBalance);
    if (applied <= 0) throw new Error('El pago debe ser mayor que cero.');

    await db.runAsync(
      `INSERT INTO transactions (
        id, type, amount, category_id, debt_id, description, date,
        created_at, updated_at
      ) VALUES (?, 'debt_payment', ?, NULL, ?, ?, ?, ?, ?)`,
      newId(),
      applied,
      debtId,
      note?.trim() || 'Pago de deuda',
      date,
      timestamp,
      timestamp
    );

    await db.runAsync(
      `UPDATE debts SET current_balance = MAX(0, current_balance - ?), updated_at = ?
       WHERE id = ?`,
      applied,
      timestamp,
      debtId
    );
  });

  return applied;
}

export async function archiveDebt(db: SQLiteDatabase, debtId: string): Promise<void> {
  const timestamp = nowIso();
  await db.runAsync(
    'UPDATE debts SET deleted_at = ?, updated_at = ? WHERE id = ?',
    timestamp,
    timestamp,
    debtId
  );
}

export async function getBackup(db: SQLiteDatabase): Promise<Backup> {
  const [profile, categories, transactions, debts] = await Promise.all([
    getProfile(db),
    listCategories(db),
    db.getAllAsync<TransactionRow>(
      `${TRANSACTION_SELECT} WHERE deleted_at IS NULL ORDER BY date ASC, created_at ASC`
    ),
    listDebts(db),
  ]);

  return {
    exportedAt: nowIso(),
    app: 'Deuda Clara',
    version: 1,
    profile,
    categories,
    transactions,
    debts,
  };
}

export async function resetAllData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM debts;
      DELETE FROM profile;
    `);
  });
}
