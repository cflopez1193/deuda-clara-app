import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseISO } from 'date-fns';

import { AppButton, Card } from '@/components/ui/app-button';
import { DateField, MoneyField, TextField } from '@/components/ui/form-field';
import { EmptyState, IconBadge, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { StackScreen } from '@/components/ui/stack-screen';
import { primaryGradient, radius, spacing, typography } from '@/constants/theme';
import { formatShortDate, nextDueDate, todayKey } from '@/domain/dates';
import { getUpcomingPayments, paidToDebtInMonth } from '@/domain/finance';
import { formatMoney, formatPercentFromBps, monthlyRateFromBps } from '@/domain/money';
import type { Debt, Transaction } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function DebtDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { debts, transactions, payDebt, removeDebt } = useApp();
  const now = useMemo(() => new Date(), []);
  const [showPayment, setShowPayment] = useState(false);

  const debt = debts.find((current) => current.id === params.id);
  const debtPayments = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.type === 'debt_payment' && transaction.debtId === params.id
      ),
    [params.id, transactions]
  );

  if (!debt) {
    return (
      <StackScreen title="Deuda">
        <Card>
          <EmptyState
            icon="help-circle-outline"
            title="No encontramos esta deuda"
            description="Puede que se haya eliminado o que el enlace no sea válido."
            actionLabel="Volver a deudas"
            onAction={() => router.replace('/(tabs)/deudas')}
          />
        </Card>
      </StackScreen>
    );
  }

  const paidThisMonth = paidToDebtInMonth(transactions, debt.id, now);
  const isPaid = debt.currentBalance <= 0;
  const progress =
    debt.originalBalance > 0
      ? Math.min(1, Math.max(0, (debt.originalBalance - debt.currentBalance) / debt.originalBalance))
      : 0;
  const paymentDue = getUpcomingPayments([debt], transactions, now, 1)[0];
  const fallbackDue = nextDueDate(debt.dueDay, now);
  const nextPaymentDate = paymentDue?.dueDate ?? fallbackDue;
  const remainingThisMonth = Math.max(0, debt.minimumPayment - paidThisMonth);
  const totalPaid = debtPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const monthlyInterest = Math.round(debt.currentBalance * monthlyRateFromBps(debt.annualRateBps));

  const handlePayment = async (amount: number, date: string, note: string) => {
    const applied = await payDebt(debt.id, amount, date, note || undefined);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPayment(false);
    Alert.alert(
      'Pago registrado',
      applied < amount
        ? `Se aplicaron ${formatMoney(applied)} porque el saldo era menor.`
        : `Registramos ${formatMoney(applied)} a ${debt.name}.`
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar deuda',
      'La deuda se ocultará de tu panel y de tu plan. Su historial de pagos se conserva. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void removeDebt(debt.id)
              .then(() => {
                router.replace('/(tabs)/deudas');
              })
              .catch((cause: unknown) => {
                const message =
                  cause instanceof Error ? cause.message : 'No se pudo eliminar la deuda.';
                Alert.alert('Algo salió mal', message);
              });
          },
        },
      ]
    );
  };

  return (
    <StackScreen
      title="Detalle de deuda"
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar deuda"
          onPress={() => router.push({ pathname: '/editar-deuda/[id]', params: { id: debt.id } })}
          style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="pencil-outline" size={18} color={colors.text} />
        </Pressable>
      }
      footer={
        isPaid ? (
          <AppButton
            label="Deuda pagada"
            icon="checkmark-circle"
            disabled
            fullWidth
          />
        ) : (
          <AppButton
            label="Registrar pago"
            icon="add"
            onPress={() => setShowPayment(true)}
            fullWidth
          />
        )
      }>
      <LinearGradient
        colors={primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={[styles.debtColorDot, { backgroundColor: debt.color }]} />
          <Text style={styles.heroLabel}>{isPaid ? 'DEUDA PAGADA' : 'SALDO ACTUAL'}</Text>
          <View style={styles.heroSpacer} />
          <View style={styles.heroPill}>
            <Ionicons
              name={isPaid ? 'checkmark-circle' : 'time-outline'}
              size={13}
              color="#DFFFF5"
            />
            <Text style={styles.heroPillText}>{isPaid ? 'Completada' : `${Math.round(progress * 100)}% pagado`}</Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>{formatMoney(debt.currentBalance)}</Text>
        <Text style={styles.heroSubtext}>
          {debt.creditor || 'Sin acreedor'} · {formatPercentFromBps(debt.annualRateBps)} EA
        </Text>
        <View style={styles.heroProgressArea}>
          <ProgressBar
            progress={progress}
            color="#C6F06D"
            trackColor="rgba(255,255,255,0.18)"
            height={8}
          />
          <View style={styles.heroProgressLabels}>
            <Text style={styles.heroProgressText}>
              Original: {formatMoney(debt.originalBalance)}
            </Text>
            <Text style={styles.heroProgressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </LinearGradient>

      <Card style={styles.monthCard}>
        <View style={styles.monthTop}>
          <View style={[styles.monthIcon, { backgroundColor: isPaid || remainingThisMonth === 0 ? colors.successSoft : colors.warningSoft }]}>
            <Ionicons
              name={isPaid || remainingThisMonth === 0 ? 'checkmark-circle' : 'calendar-outline'}
              size={21}
              color={isPaid || remainingThisMonth === 0 ? colors.success : colors.warning}
            />
          </View>
          <View style={styles.monthText}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {isPaid
                ? 'Terminaste esta deuda'
                : remainingThisMonth === 0
                  ? 'Cuota de este mes cubierta'
                  : 'Cuota pendiente este mes'}
            </Text>
            <Text style={[styles.monthDescription, { color: colors.textSecondary }]}>
              {isPaid
                ? 'Puedes editar el saldo o conservarla como historial.'
                : remainingThisMonth === 0
                  ? `Pagaste ${formatMoney(paidThisMonth)} este mes.`
                  : `Faltan ${formatMoney(remainingThisMonth)} para cubrir el mínimo.`}
            </Text>
          </View>
        </View>
        {!isPaid ? (
          <View style={styles.dueRow}>
            <Text style={[styles.dueLabel, { color: colors.textMuted }]}>PRÓXIMO PAGO</Text>
            <Text style={[styles.dueValue, { color: colors.text }]}>
              {formatShortDate(nextPaymentDate)}
              {paymentDue?.isOverdue ? ' · vencido' : paymentDue?.daysUntil === 0 ? ' · hoy' : ''}
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.statsGrid}>
        <InfoTile label="Cuota mínima" value={formatMoney(debt.minimumPayment)} icon="calendar-outline" />
        <InfoTile label="Día de pago" value={`Día ${debt.dueDay}`} icon="today-outline" />
        <InfoTile label="Tasa EA" value={formatPercentFromBps(debt.annualRateBps)} icon="trending-up-outline" />
        <InfoTile label="Interés estimado/mes" value={formatMoney(monthlyInterest)} icon="flash-outline" />
      </View>

      {debt.notes ? (
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.notesTitle, { color: colors.text }]}>Notas</Text>
          </View>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{debt.notes}</Text>
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Historial de pagos" />
        <Card style={styles.paymentList}>
          {debtPayments.length > 0 ? (
            debtPayments.map((payment, index) => (
              <PaymentHistoryRow
                key={payment.id}
                payment={payment}
                isFirst={index === 0}
              />
            ))
          ) : (
            <EmptyState
              icon="cash-outline"
              title="Aún no hay pagos"
              description="Cuando registres un pago, aparecerá aquí y el saldo se actualizará."
            />
          )}
        </Card>
        {debtPayments.length > 0 ? (
          <Text style={[styles.totalPaid, { color: colors.textSecondary }]}>
            Total registrado: {formatMoney(totalPaid)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.disclaimer, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
        <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
          El pago reduce el saldo en la app. Confirma siempre con tu acreedor que el abono quedó
          aplicado correctamente.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Eliminar deuda"
        onPress={confirmDelete}
        style={({ pressed }) => [styles.deleteDebt, pressed && { opacity: 0.65 }]}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={[styles.deleteDebtText, { color: colors.danger }]}>
          Eliminar esta deuda
        </Text>
      </Pressable>

      {showPayment ? (
        <PaymentModal
          debt={debt}
          onClose={() => setShowPayment(false)}
          onPay={handlePayment}
        />
      ) : null}
    </StackScreen>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.infoTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.infoValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function PaymentHistoryRow({ payment, isFirst }: { payment: Transaction; isFirst: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.paymentRow,
        !isFirst && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}>
      <IconBadge icon="cash-outline" color={colors.success} size={38} />
      <View style={styles.paymentInfo}>
        <Text numberOfLines={1} style={[styles.paymentTitle, { color: colors.text }]}>
          {payment.description || 'Pago de deuda'}
        </Text>
        <Text style={[styles.paymentDate, { color: colors.textMuted }]}>
          {formatShortDate(parseISO(payment.date))}
        </Text>
      </View>
      <Text style={[styles.paymentAmount, { color: colors.success }]}>
        - {formatMoney(payment.amount)}
      </Text>
    </View>
  );
}

function PaymentModal({
  debt,
  onClose,
  onPay,
}: {
  debt: Debt;
  onClose: () => void;
  onPay: (amount: number, date: string, note: string) => Promise<void>;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const suggested = Math.min(
    debt.currentBalance,
    debt.minimumPayment > 0 ? debt.minimumPayment : debt.currentBalance
  );
  const [amount, setAmount] = useState(suggested);
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (amount <= 0) {
      setError('El pago debe ser mayor que cero.');
      return;
    }
    if (amount > debt.currentBalance) {
      setError(`El saldo es ${formatMoney(debt.currentBalance)}.`);
      return;
    }
    setSaving(true);
    try {
      await onPay(amount, date, note);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo registrar el pago.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!saving) onClose();
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={() => {
            if (!saving) onClose();
          }}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Registrar pago</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                {debt.name} · saldo {formatMoney(debt.currentBalance)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              disabled={saving}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <MoneyField
            label="Monto del pago"
            value={amount}
            onChange={(value) => {
              setAmount(value);
              if (error) setError(null);
            }}
            emphasized
            autoFocus
          />
          {error ? <Text style={[styles.paymentError, { color: colors.danger }]}>{error}</Text> : null}
          <DateField label="Fecha del pago" value={date} onChange={setDate} maximumDate={new Date()} />
          <TextField
            label="Nota (opcional)"
            value={note}
            onChangeText={setNote}
            placeholder="Ej. Pago por PSE"
            icon="create-outline"
          />

          <View style={styles.sheetActions}>
            <AppButton
              label="Cancelar"
              variant="ghost"
              onPress={onClose}
              disabled={saving}
              style={styles.sheetButton}
            />
            <AppButton
              label="Registrar pago"
              icon="checkmark"
              onPress={() => void submit()}
              loading={saving}
              disabled={saving}
              style={styles.sheetButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    gap: 5,
  },
  heroOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(198,240,109,0.12)',
    right: -80,
    top: -100,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  debtColorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  heroLabel: {
    color: '#CFF3E8',
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroSpacer: {
    flex: 1,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  heroPillText: {
    color: '#DFFFF5',
    fontSize: 10,
    fontWeight: '700',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 37,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginTop: spacing.xs,
  },
  heroSubtext: {
    color: '#CFF3E8',
    fontSize: typography.small,
    fontWeight: '500',
  },
  heroProgressArea: {
    marginTop: spacing.md,
    gap: 6,
  },
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroProgressText: {
    color: '#DFFFF5',
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  monthCard: {
    gap: spacing.md,
  },
  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  monthIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    flex: 1,
    gap: 2,
  },
  monthTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  monthDescription: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.15)',
    paddingTop: spacing.md,
  },
  dueLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dueValue: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  notesCard: {
    gap: spacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitle: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  notesText: {
    fontSize: typography.small,
    lineHeight: 20,
  },
  section: {
    gap: spacing.sm,
  },
  paymentList: {
    paddingVertical: spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentTitle: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  paymentDate: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  totalPaid: {
    fontSize: typography.tiny,
    textAlign: 'right',
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 16,
  },
  deleteDebt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  deleteDebtText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(127,127,127,0.35)',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: typography.small,
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentError: {
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sheetButton: {
    flex: 1,
  },
});
