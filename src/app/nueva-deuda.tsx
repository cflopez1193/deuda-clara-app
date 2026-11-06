import { router } from 'expo-router';

import { DebtForm } from '@/components/debt-form';
import { useApp } from '@/providers/app-provider';

export default function NewDebtScreen() {
  const { addDebt } = useApp();

  return (
    <DebtForm
      title="Nueva deuda"
      submitLabel="Guardar deuda"
      onSubmit={async (input) => {
        await addDebt(input);
        router.back();
      }}
    />
  );
}
