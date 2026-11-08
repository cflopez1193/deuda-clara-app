export type TransactionType = 'expense' | 'income' | 'debt_payment';

export type CategoryType = 'expense' | 'income';

export type PayoffStrategy = 'avalanche' | 'snowball';

export type DebtType =
  | 'credit_card'
  | 'consumer_loan'
  | 'vehicle'
  | 'mortgage'
  | 'microcredit'
  | 'store_loan'
  | 'personal_loan'
  | 'informal'
  | 'family'
  | 'other';

export interface Profile {
  id: number;
  authUserId: string | null;
  name: string;
  monthlyIncome: number;
  extraDebtPayment: number;
  payoffStrategy: PayoffStrategy;
  currency: 'COP';
  locale: 'es-CO';
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  debtId: string | null;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string | null;
  type: DebtType;
  originalBalance: number;
  currentBalance: number;
  annualRateBps: number;
  minimumPayment: number;
  dueDay: number;
  color: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewDebtInput {
  name: string;
  creditor?: string | null;
  type: DebtType;
  originalBalance: number;
  currentBalance: number;
  annualRateBps: number;
  minimumPayment: number;
  dueDay: number;
  color?: string;
  notes?: string | null;
  isActive?: boolean;
}

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  debtId?: string | null;
  description?: string | null;
  date: string;
}

export interface OnboardingInput {
  name: string;
  monthlyIncome: number;
  debt?: NewDebtInput | null;
}

export interface ProfileUpdate {
  name?: string;
  monthlyIncome?: number;
  extraDebtPayment?: number;
  payoffStrategy?: PayoffStrategy;
}

export interface Backup {
  exportedAt: string;
  app: 'Deuda Clara';
  version: 1;
  profile: Profile | null;
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
}
