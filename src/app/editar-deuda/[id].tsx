import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { DebtForm } from '@/components/debt-form';
import { useApp } from '@/providers/app-provider';

export default function EditDebtScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { debts, editDebt } = useApp();
  const debt = debts.find((current) => current.id === params.id);

  useEffect(() => {
    if (!debt) router.back();
  }, [debt]);

  if (!debt) return null;

  return (
    <DebtForm
      title="Editar deuda"
      submitLabel="Guardar cambios"
      initialDebt={debt}
      onSubmit={async (input) => {
        await editDebt(debt.id, input);
        router.back();
      }}
    />
  );
}
