import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  archiveDebt,
  createDebt,
  createOnboarding,
  createTransaction,
  deleteTransaction,
  getBackup,
  getProfile,
  listCategories,
  listDebts,
  listTransactions,
  registerDebtPayment,
  resetAllData,
  updateDebt,
  updateProfile,
} from '@/db/repository';
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

interface AppContextValue {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  refresh: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  saveProfile: (update: ProfileUpdate) => Promise<void>;
  addTransaction: (input: NewTransactionInput) => Promise<string>;
  removeTransaction: (transactionId: string) => Promise<void>;
  addDebt: (input: NewDebtInput) => Promise<string>;
  editDebt: (debtId: string, input: NewDebtInput) => Promise<void>;
  payDebt: (
    debtId: string,
    amount: number,
    date: string,
    note?: string
  ) => Promise<number>;
  removeDebt: (debtId: string) => Promise<void>;
  exportBackup: () => Promise<Backup>;
  resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [nextProfile, nextCategories, nextTransactions, nextDebts] = await Promise.all([
        getProfile(db),
        listCategories(db),
        listTransactions(db),
        listDebts(db),
      ]);

      setProfile(nextProfile);
      setCategories(nextCategories);
      setTransactions(nextTransactions);
      setDebts(nextDebts);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo cargar la información.';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    // Initial data load from SQLite; refresh owns the loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => {
      // The provider exposes the error state to the UI.
    });
  }, [refresh]);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      await createOnboarding(db, input);
      await refresh();
    },
    [db, refresh]
  );

  const saveProfile = useCallback(
    async (update: ProfileUpdate) => {
      await updateProfile(db, update);
      await refresh();
    },
    [db, refresh]
  );

  const addTransaction = useCallback(
    async (input: NewTransactionInput) => {
      const id = await createTransaction(db, input);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const removeTransaction = useCallback(
    async (transactionId: string) => {
      await deleteTransaction(db, transactionId);
      await refresh();
    },
    [db, refresh]
  );

  const addDebt = useCallback(
    async (input: NewDebtInput) => {
      const id = await createDebt(db, input);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const editDebt = useCallback(
    async (debtId: string, input: NewDebtInput) => {
      await updateDebt(db, debtId, input);
      await refresh();
    },
    [db, refresh]
  );

  const payDebt = useCallback(
    async (debtId: string, amount: number, date: string, note?: string) => {
      const applied = await registerDebtPayment(db, debtId, amount, date, note);
      await refresh();
      return applied;
    },
    [db, refresh]
  );

  const removeDebt = useCallback(
    async (debtId: string) => {
      await archiveDebt(db, debtId);
      await refresh();
    },
    [db, refresh]
  );

  const exportBackup = useCallback(() => getBackup(db), [db]);

  const resetData = useCallback(async () => {
    await resetAllData(db);
    await refresh();
  }, [db, refresh]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      error,
      profile,
      categories,
      transactions,
      debts,
      refresh,
      completeOnboarding,
      saveProfile,
      addTransaction,
      removeTransaction,
      addDebt,
      editDebt,
      payDebt,
      removeDebt,
      exportBackup,
      resetData,
    }),
    [
      loading,
      error,
      profile,
      categories,
      transactions,
      debts,
      refresh,
      completeOnboarding,
      saveProfile,
      addTransaction,
      removeTransaction,
      addDebt,
      editDebt,
      payDebt,
      removeDebt,
      exportBackup,
      resetData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider.');
  return context;
}
