export interface WidgetDebt {
  id: string;
  name: string;
  creditor: string | null;
  balance: number;
  color: string;
  isActive: boolean;
}

export interface WidgetData {
  totalDebt: number;
  debts: WidgetDebt[];
  updatedAt: string;
}

export type WidgetTheme = 'light' | 'dark';
