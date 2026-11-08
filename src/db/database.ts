import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryType } from '@/domain/types';

const DATABASE_VERSION = 3;

interface SeedCategory {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sortOrder: number;
}

const seedCategories: SeedCategory[] = [
  { id: 'food', name: 'Alimentación', type: 'expense', icon: 'restaurant-outline', color: '#E76F51', sortOrder: 1 },
  { id: 'transport', name: 'Transporte', type: 'expense', icon: 'car-outline', color: '#457B9D', sortOrder: 2 },
  { id: 'home', name: 'Hogar', type: 'expense', icon: 'home-outline', color: '#6D597A', sortOrder: 3 },
  { id: 'services', name: 'Servicios', type: 'expense', icon: 'flash-outline', color: '#D9A441', sortOrder: 4 },
  { id: 'health', name: 'Salud', type: 'expense', icon: 'medkit-outline', color: '#2A9D8F', sortOrder: 5 },
  { id: 'education', name: 'Educación', type: 'expense', icon: 'school-outline', color: '#4D908E', sortOrder: 6 },
  { id: 'leisure', name: 'Ocio', type: 'expense', icon: 'game-controller-outline', color: '#F4A261', sortOrder: 7 },
  { id: 'shopping', name: 'Compras', type: 'expense', icon: 'bag-handle-outline', color: '#B56576', sortOrder: 8 },
  { id: 'other_expense', name: 'Otros', type: 'expense', icon: 'ellipsis-horizontal', color: '#8D99AE', sortOrder: 9 },
  { id: 'salary', name: 'Salario', type: 'income', icon: 'briefcase-outline', color: '#2A9D8F', sortOrder: 1 },
  { id: 'sales', name: 'Ventas', type: 'income', icon: 'storefront-outline', color: '#43AA8B', sortOrder: 2 },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: 'laptop-outline', color: '#577590', sortOrder: 3 },
  { id: 'gift', name: 'Regalos', type: 'income', icon: 'gift-outline', color: '#9B5DE5', sortOrder: 4 },
  { id: 'other_income', name: 'Otros ingresos', type: 'income', icon: 'add-circle-outline', color: '#8D99AE', sortOrder: 5 },
];

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        monthly_income INTEGER NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
        extra_debt_payment INTEGER NOT NULL DEFAULT 0 CHECK (extra_debt_payment >= 0),
        payoff_strategy TEXT NOT NULL DEFAULT 'avalanche'
          CHECK (payoff_strategy IN ('avalanche', 'snowball')),
        currency TEXT NOT NULL DEFAULT 'COP',
        locale TEXT NOT NULL DEFAULT 'es-CO',
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        creditor TEXT,
        type TEXT NOT NULL,
        original_balance INTEGER NOT NULL DEFAULT 0 CHECK (original_balance >= 0),
        current_balance INTEGER NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
        annual_rate_bps INTEGER NOT NULL DEFAULT 0 CHECK (annual_rate_bps >= 0),
        minimum_payment INTEGER NOT NULL DEFAULT 0 CHECK (minimum_payment >= 0),
        due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
        color TEXT NOT NULL,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'debt_payment')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        category_id TEXT REFERENCES categories(id),
        debt_id TEXT REFERENCES debts(id),
        description TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date
        ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_debt
        ON transactions(debt_id);
      CREATE INDEX IF NOT EXISTS idx_debts_active
        ON debts(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_categories_type
        ON categories(type, sort_order);

      PRAGMA user_version = 1;
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN auth_user_id TEXT;
      PRAGMA user_version = 2;
    `);
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      ALTER TABLE debts ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
      PRAGMA user_version = 3;
    `);
  }

  for (const category of seedCategories) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, type, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      category.id,
      category.name,
      category.type,
      category.icon,
      category.color,
      category.sortOrder
    );
  }
}

export { DATABASE_VERSION };
