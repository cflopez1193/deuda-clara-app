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
  ensureProfileOwnership,
  getBackup,
  getProfile,
  listCategories,
  listDebts,
  listTransactions,
  registerDebtPayment,
  addDebtCredit,
  toggleDebtActive as toggleDebtActiveRepo,
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
  addCredit: (debtId: string, amount: number) => Promise<void>;
  toggleDebtActive: (debtId: string, isActive: boolean) => Promise<void>;
  removeDebt: (debtId: string) => Promise<void>;
  exportBackup: () => Promise<Backup>;
  resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps extends PropsWithChildren {
  authUserId: string;
}

export function AppProvider({ authUserId, children }: AppProviderProps) {
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
    // Bind the local database to the signed-in account before loading data.
    // A legacy profile is claimed by the first user; a different account
    // starts empty so local financial data is never shared across users.
    void ensureProfileOwnership(db, authUserId)
      .then(() => refresh())
      .catch((cause: unknown) => {
        const message =
          cause instanceof Error ? cause.message : 'No se pudo preparar la información local.';
        setError(message);
        setLoading(false);
      });
  }, [authUserId, db, refresh]);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      await createOnboarding(db, authUserId, input);
      await refresh();
    },
    [authUserId, db, refresh]
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

  const addCredit = useCallback(
    async (debtId: string, amount: number) => {
      await addDebtCredit(db, debtId, amount);
      await refresh();
    },
    [db, refresh]
  );

  const toggleDebtActive = useCallback(
    async (debtId: string, isActive: boolean) => {
      await toggleDebtActiveRepo(db, debtId, isActive);
      await refresh();
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
      addCredit,
      toggleDebtActive,
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
      addCredit,
      toggleDebtActive,
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
