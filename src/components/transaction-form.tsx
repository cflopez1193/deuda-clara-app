import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { AppButton } from '@/components/ui/app-button';
import { CategoryPicker, DateField, MoneyField, TextField } from '@/components/ui/form-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StackScreen } from '@/components/ui/stack-screen';
import { radius, spacing, typography } from '@/constants/theme';
import { todayKey } from '@/domain/dates';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

type MovementType = 'expense' | 'income';

interface NewMovementScreenProps {
  initialType?: MovementType;
}

export function NewMovementScreen({ initialType = 'expense' }: NewMovementScreenProps) {
  const { colors } = useAppTheme();
  const { categories, addTransaction } = useApp();
  const [type, setType] = useState<MovementType>(initialType);
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  const activeCategoryId =
    categoryId && availableCategories.some((category) => category.id === categoryId)
      ? categoryId
      : (availableCategories[0]?.id ?? null);

  const save = async () => {
    setError(null);
    if (amount <= 0) {
      setError('Ingresa un monto mayor que cero.');
      return;
    }
    if (!activeCategoryId) {
      setError('Selecciona una categoría.');
      return;
    }

    setSaving(true);
    try {
      await addTransaction({
        type,
        amount,
        categoryId: activeCategoryId,
        description: description.trim() || null,
        date,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo guardar el movimiento.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title={type === 'expense' ? 'Nuevo gasto' : 'Nuevo ingreso'}
      footer={
        <AppButton
          label={type === 'expense' ? 'Guardar gasto' : 'Guardar ingreso'}
          icon="checkmark"
          onPress={() => void save()}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      }>
      <SegmentedControl
        options={[
          { value: 'expense', label: 'Gasto', icon: 'arrow-up-circle-outline' },
          { value: 'income', label: 'Ingreso', icon: 'arrow-down-circle-outline' },
        ]}
        value={type}
        onChange={(value) => {
          setType(value);
          setError(null);
        }}
      />

      <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.amountEyebrow, { color: colors.textMuted }]}>MONTO EN PESOS</Text>
        <MoneyField
          value={amount}
          onChange={(value) => {
            setAmount(value);
            if (error) setError(null);
          }}
          emphasized
          autoFocus
          placeholder="0"
        />
        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
      </View>

      <CategoryPicker
        categories={categories}
        value={activeCategoryId}
        onChange={setCategoryId}
        type={type}
      />

      <TextField
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder={type === 'expense' ? 'Ej. Mercado de la semana' : 'Ej. Pago de un proyecto'}
        maxLength={90}
        icon="create-outline"
      />

      <DateField label="Fecha" value={date} onChange={setDate} maximumDate={new Date()} />

      <View style={[styles.tip, { backgroundColor: colors.infoSoft }]}>
        <Ionicons name="bulb-outline" size={18} color={colors.info} />
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          {type === 'expense'
            ? `Registrar hoy mismo es la forma más fácil de no olvidar gastos pequeños. Fecha: ${format(new Date(), 'd/MM/yyyy')}.`
            : 'Los ingresos también importan. Registra salario, ventas o cualquier entrada de dinero.'}
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  amountCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  amountEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  errorText: {
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
  },
});
