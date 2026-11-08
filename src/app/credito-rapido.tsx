import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui/app-button';
import { MoneyField } from '@/components/ui/form-field';
import { EmptyState } from '@/components/ui/primitives';
import { StackScreen } from '@/components/ui/stack-screen';
import { radius, spacing, typography } from '@/constants/theme';
import { formatMoney } from '@/domain/money';
import type { Debt } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function QuickCreditScreen() {
  const { colors } = useAppTheme();
  const { debts, addCredit } = useApp();
  const params = useLocalSearchParams<{ debtId?: string }>();

  const sortedDebts = useMemo(
    () =>
      [...debts].sort((left, right) => {
        if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
        if (left.currentBalance !== right.currentBalance) {
          return right.currentBalance - left.currentBalance;
        }
        return left.name.localeCompare(right.name, 'es');
      }),
    [debts]
  );

  const requestedId =
    typeof params.debtId === 'string' ? params.debtId : null;
  const initialId =
    requestedId && debts.some((debt) => debt.id === requestedId)
      ? requestedId
      : (sortedDebts[0]?.id ?? null);

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = debts.find((debt) => debt.id === selectedId) ?? null;
  const nextBalance = selected ? selected.currentBalance + amount : 0;

  const save = async () => {
    setError(null);
    if (!selected) {
      router.replace('/nueva-deuda');
      return;
    }
    if (amount <= 0) {
      setError('Ingresa el monto que te prestaron.');
      return;
    }

    setSaving(true);
    try {
      await addCredit(selected.id, amount);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Crédito registrado',
        `Sumamos ${formatMoney(amount)} a ${selected.creditor?.trim() || selected.name}.`,
        [
          {
            text: 'Listo',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No se pudo registrar el crédito.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title="Crédito rápido"
      footer={
        <AppButton
          label={debts.length > 0 ? 'Guardar crédito' : 'Registrar prestamista'}
          icon={debts.length > 0 ? 'checkmark' : 'add'}
          onPress={() => {
            if (debts.length === 0) {
              router.replace('/nueva-deuda');
            } else {
              void save();
            }
          }}
          loading={saving}
          disabled={saving || (debts.length > 0 && !selected)}
          fullWidth
        />
      }>
      {debts.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Aún no tienes prestamistas"
          description="Registra a quién le debes o a quién podrías pedirle fiado. Después podrás sumar créditos desde el widget en segundos."
          actionLabel="Registrar prestamista"
          onAction={() => router.replace('/nueva-deuda')}
        />
      ) : (
        <>
          <View
            style={[
              styles.amountCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.amountEyebrow, { color: colors.textMuted }]}>
              ¿CUÁNTO TE PRESTARON?
            </Text>
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
            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}
            {selected && amount > 0 ? (
              <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                Nuevo saldo de {selected.creditor?.trim() || selected.name}:{' '}
                <Text style={{ color: colors.primary, fontWeight: '800' }}>
                  {formatMoney(nextBalance)}
                </Text>
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ¿A quién le debes?
            </Text>
            <View style={styles.debtList}>
              {sortedDebts.map((debt) => (
                <DebtOption
                  key={debt.id}
                  debt={debt}
                  selected={debt.id === selectedId}
                  onPress={() => setSelectedId(debt.id)}
                />
              ))}
            </View>
          </View>

          <Card style={styles.tip}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              El crédito aumenta el saldo que debes. No se registra como gasto
              hasta que lo pagues.
            </Text>
          </Card>
        </>
      )}
    </StackScreen>
  );
}

function DebtOption({
  debt,
  selected,
  onPress,
}: {
  debt: Debt;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const name = debt.creditor?.trim() || debt.name;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.debtOption,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.75 },
      ]}>
      <View style={[styles.debtDot, { backgroundColor: debt.color }]} />
      <View style={styles.debtText}>
        <Text numberOfLines={1} style={[styles.debtName, { color: colors.text }]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.debtMeta, { color: colors.textMuted }]}>
          {debt.isActive ? 'Activa' : 'Inactiva'} · saldo {formatMoney(debt.currentBalance)}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.textMuted}
      />
    </Pressable>
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
  previewText: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  debtList: {
    gap: spacing.sm,
  },
  debtOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  debtDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  debtText: {
    flex: 1,
    gap: 2,
  },
  debtName: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  debtMeta: {
    fontSize: typography.tiny,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
  },
});
