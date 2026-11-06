import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IoniconName } from '@/components/ui/app-button';
import { IconBadge, ProgressBar } from '@/components/ui/primitives';
import { radius, spacing, typography } from '@/constants/theme';
import { formatMoney, formatPercentFromBps } from '@/domain/money';
import type { Category, Debt, Transaction } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  onLongPress?: () => void;
  showDate?: boolean;
}

export function TransactionRow({
  transaction,
  category,
  onPress,
  onLongPress,
  showDate,
}: TransactionRowProps) {
  const { colors } = useAppTheme();

  const isIncome = transaction.type === 'income';
  const isDebtPayment = transaction.type === 'debt_payment';
  const icon: IoniconName = isDebtPayment
    ? 'card-outline'
    : ((category?.icon as IoniconName | undefined) ?? 'ellipsis-horizontal');
  const color = isDebtPayment ? colors.warning : (category?.color ?? colors.textMuted);
  const title = isDebtPayment
    ? (transaction.description ?? 'Pago de deuda')
    : (transaction.description ?? category?.name ?? 'Movimiento');
  const subtitle = isDebtPayment
    ? 'Pago a deuda'
    : isIncome
      ? 'Ingreso'
      : (category?.name ?? 'Gasto');
  const amountColor = isIncome ? colors.success : isDebtPayment ? colors.warning : colors.text;

  const content = (
    <>
      <IconBadge icon={icon} color={color} />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          {subtitle}
          {showDate ? ` · ${transaction.date}` : ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {isIncome ? '+' : '-'} {formatMoney(transaction.amount)}
      </Text>
    </>
  );

  if (!onPress && !onLongPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]}>
      {content}
    </Pressable>
  );
}

interface DebtCardProps {
  debt: Debt;
  paidThisMonth: number;
  onPress: () => void;
}

export function DebtCard({ debt, paidThisMonth, onPress }: DebtCardProps) {
  const { colors } = useAppTheme();
  const progress =
    debt.originalBalance > 0
      ? Math.min(1, Math.max(0, (debt.originalBalance - debt.currentBalance) / debt.originalBalance))
      : 0;
  const covered = debt.minimumPayment > 0 ? paidThisMonth >= debt.minimumPayment : paidThisMonth > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.debtCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={styles.debtTop}>
        <View style={[styles.debtColor, { backgroundColor: debt.color }]} />
        <View style={styles.debtText}>
          <Text numberOfLines={1} style={[styles.debtName, { color: colors.text }]}>
            {debt.name}
          </Text>
          <Text numberOfLines={1} style={[styles.debtMeta, { color: colors.textMuted }]}>
            {debt.creditor || 'Sin acreedor'} · {formatPercentFromBps(debt.annualRateBps)} EA
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>

      <View style={styles.debtBalanceRow}>
        <View>
          <Text style={[styles.debtBalanceLabel, { color: colors.textMuted }]}>Saldo actual</Text>
          <Text style={[styles.debtBalance, { color: colors.text }]}>
            {formatMoney(debt.currentBalance)}
          </Text>
        </View>
        <View style={styles.debtMinBox}>
          <Text style={[styles.debtBalanceLabel, { color: colors.textMuted }]}>Cuota mínima</Text>
          <Text style={[styles.debtMin, { color: colors.textSecondary }]}>
            {formatMoney(debt.minimumPayment)}
          </Text>
        </View>
      </View>

      <View style={styles.debtProgressRow}>
        <ProgressBar progress={progress} color={debt.color} height={7} />
        <Text style={[styles.debtProgressLabel, { color: colors.textMuted }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <View style={styles.debtFooter}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: covered ? colors.successSoft : colors.warningSoft },
          ]}>
          <Ionicons
            name={covered ? 'checkmark-circle' : 'time-outline'}
            size={13}
            color={covered ? colors.success : colors.warning}
          />
          <Text
            style={[
              styles.statusText,
              { color: covered ? colors.success : colors.warning },
            ]}>
            {covered ? 'Cuota del mes cubierta' : 'Cuota pendiente este mes'}
          </Text>
        </View>
        <Text style={[styles.dueDay, { color: colors.textMuted }]}>
          Día de pago: {debt.dueDay}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  amount: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  debtCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  debtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  debtColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  debtText: {
    flex: 1,
    gap: 2,
  },
  debtName: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  debtMeta: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  debtBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  debtBalanceLabel: {
    fontSize: typography.tiny,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  debtBalance: {
    fontSize: typography.h2,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  debtMinBox: {
    alignItems: 'flex-end',
  },
  debtMin: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  debtProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  debtProgressLabel: {
    fontSize: typography.tiny,
    fontWeight: '700',
    width: 34,
    textAlign: 'right',
  },
  debtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  dueDay: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
});
