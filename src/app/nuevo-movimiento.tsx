import { useLocalSearchParams } from 'expo-router';

import { NewMovementScreen } from '@/components/transaction-form';

export default function NewMovementRoute() {
  const params = useLocalSearchParams<{ type?: string }>();
  return <NewMovementScreen initialType={params.type === 'income' ? 'income' : 'expense'} />;
}
