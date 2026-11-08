import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import {
  MoneyField,
  PercentField,
  TextField,
} from '@/components/ui/form-field';
import { FilterChips } from '@/components/ui/segmented-control';
import { StackScreen } from '@/components/ui/stack-screen';
import { debtTypeLabels, radius, spacing, typography } from '@/constants/theme';
import type { Debt, DebtType, NewDebtInput } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { impliedAnnualRateBps } from '@/domain/money';

const debtTypeOptions = Object.entries(debtTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

const debtColors: Record<DebtType, string> = {
  credit_card: '#E76F51',
  consumer_loan: '#457B9D',
  vehicle: '#6D597A',
  mortgage: '#2A9D8F',
  informal: '#D9A441',
  family: '#9B5DE5',
  other: '#0E7C66',
};

interface DebtFormProps {
  title: string;
  submitLabel: string;
  initialDebt?: Debt;
  onSubmit: (input: NewDebtInput) => Promise<void>;
}

export function DebtForm({ title, submitLabel, initialDebt, onSubmit }: DebtFormProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState(initialDebt?.name ?? '');
  const [creditor, setCreditor] = useState(initialDebt?.creditor ?? '');
  const [type, setType] = useState<DebtType>(initialDebt?.type ?? 'credit_card');
  const [balance, setBalance] = useState(initialDebt?.currentBalance ?? 0);
  const [minimumPayment, setMinimumPayment] = useState(initialDebt?.minimumPayment ?? 0);
  const [annualRateBps, setAnnualRateBps] = useState(initialDebt?.annualRateBps ?? 0);
  const [monthsText, setMonthsText] = useState('');
  const [dueDayText, setDueDayText] = useState(String(initialDebt?.dueDay ?? 15));
  const [notes, setNotes] = useState(initialDebt?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Escribe un nombre para identificar la deuda.';
    if (balance <= 0) next.balance = 'El saldo debe ser mayor que cero.';
    const dueDay = Number.parseInt(dueDayText, 10);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
      next.dueDay = 'Usa un día entre 1 y 31.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const originalBalance = Math.max(
        initialDebt?.originalBalance ?? 0,
        balance
      );
      // Si el usuario proporciona meses + cuota, calcular el EA implícito.
      const months = Number.parseInt(monthsText, 10);
      let finalRate = annualRateBps;
      if (months > 0 && minimumPayment > 0 && balance > 0) {
        const implied = impliedAnnualRateBps(balance, minimumPayment, months);
        if (implied > 0) finalRate = implied;
      }
      await onSubmit({
        name: name.trim(),
        creditor: creditor.trim() || null,
        type,
        originalBalance,
        currentBalance: balance,
        annualRateBps: finalRate,
        minimumPayment,
        dueDay: Number.parseInt(dueDayText, 10),
        color: debtColors[type],
        notes: notes.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo guardar la deuda.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title={title}
      footer={
        <AppButton
          label={submitLabel}
          icon="checkmark"
          onPress={() => void save()}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      }>
      <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="card-outline" size={20} color={colors.primary} />
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          Mientras más exactos sean la tasa y la cuota, más útil será tu plan.
        </Text>
      </View>

      <TextField
        label="Nombre de la deuda"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (errors.name) setErrors((current) => ({ ...current, name: '' }));
        }}
        placeholder="Ej. Tarjeta Visa, crédito de moto"
        error={errors.name}
        icon="card-outline"
        autoFocus={!initialDebt}
      />

      <TextField
        label="Acreedor (opcional)"
        value={creditor}
        onChangeText={setCreditor}
        placeholder="Banco, tienda o persona"
        icon="business-outline"
      />

      <FilterChips options={debtTypeOptions} value={type} onChange={(value) => setType(value as DebtType)} />

      <MoneyField
        label="Saldo actual"
        value={balance}
        onChange={(value) => {
          setBalance(value);
          if (errors.balance) setErrors((current) => ({ ...current, balance: '' }));
        }}
        error={errors.balance}
      />

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <MoneyField
            label="Cuota mínima"
            value={minimumPayment}
            onChange={setMinimumPayment}
          />
        </View>
        <View style={styles.column}>
          <TextField
            label="Día de pago"
            value={dueDayText}
            onChangeText={(value) => {
              setDueDayText(value.replace(/\D/g, '').slice(0, 2));
              if (errors.dueDay) setErrors((current) => ({ ...current, dueDay: '' }));
            }}
            keyboardType="number-pad"
            placeholder="15"
            error={errors.dueDay}
          />
        </View>
      </View>

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <TextField
            label="Meses para pagar"
            value={monthsText}
            onChangeText={(value) => {
              setMonthsText(value.replace(/\D/g, '').slice(0, 3));
            }}
            keyboardType="number-pad"
            placeholder="Ej. 12, 24, 36"
            hint="Si lo sabes, calculamos la tasa automáticamente."
          />
        </View>
        <View style={styles.column}>
          <PercentField
            label="Tasa EA (opcional)"
            value={annualRateBps}
            onChange={setAnnualRateBps}
            hint="Se calcula si indicas meses."
          />
        </View>
      </View>

      <TextField
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Número de obligación, condiciones, acuerdos..."
        multiline
        maxLength={280}
      />

      <View style={[styles.tip, { backgroundColor: colors.warningSoft }]}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          Si la cuota mínima es 0 y no agregas un abono extra, el simulador no podrá calcular una
          ruta de salida.
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  introText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
    fontWeight: '600',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
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
