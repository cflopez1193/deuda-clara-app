import { Ionicons } from '@expo/vector-icons';
import { addMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DebtCard, TransactionRow } from '@/components/finance-rows';
import { AppButton, Card } from '@/components/ui/app-button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, SectionHeader, StatTile } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { primaryGradient, radius, spacing, typography } from '@/constants/theme';
import {
  formatLongDate,
  formatShortDate,
  formatMonthYear,
  daysRemainingInMonth,
} from '@/domain/dates';
import {
  debtPaidRatio,
  getUpcomingPayments,
  summarizeMonth,
  totalDebt,
  totalMinimumPayment,
  totalOriginalDebt,
} from '@/domain/finance';
import { formatMoney } from '@/domain/money';
import { buildPayoffPlan } from '@/domain/payoff';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { profile, categories, transactions, debts } = useApp();
  const now = useMemo(() => new Date(), []);

  const summary = useMemo(() => summarizeMonth(transactions, now), [transactions, now]);
  const debtTotal = useMemo(() => totalDebt(debts), [debts]);
  const originalTotal = useMemo(() => totalOriginalDebt(debts), [debts]);
  const minimum = useMemo(() => totalMinimumPayment(debts), [debts]);
  const paidRatio = debtPaidRatio(debts);
  const paidAmount = Math.max(0, originalTotal - debtTotal);

  const plan = useMemo(
    () =>
      buildPayoffPlan(
        debts.map((debt) => ({
          id: debt.id,
          name: debt.name,
          balance: debt.currentBalance,
          annualRateBps: debt.annualRateBps,
          minimumPayment: debt.minimumPayment,
          color: debt.color,
        })),
        profile?.payoffStrategy ?? 'avalanche',
        profile?.extraDebtPayment ?? 0
      ),
    [debts, profile?.extraDebtPayment, profile?.payoffStrategy]
  );

  const upcoming = useMemo(
    () => getUpcomingPayments(debts, transactions, now, 3),
    [debts, transactions, now]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const recent = transactions.slice(0, 4);
  const firstName = profile?.name.split(' ')[0] || 'de nuevo';
  const expectedIncome =
    (profile?.monthlyIncome ?? 0) > 0 ? (profile?.monthlyIncome ?? 0) : summary.income;
  const committed = summary.expenses + Math.max(summary.debtPayments, minimum);
  const available = expectedIncome - committed;
  const safeDaily = available > 0 ? Math.floor(available / daysRemainingInMonth(now)) : 0;
  const freedomDate =
    plan.feasible && plan.hasDebts ? formatMonthYear(addMonths(now, plan.months)) : null;
  const hasDebts = debts.some((debt) => debt.currentBalance > 0);

  const nextStep = (() => {
    if (!hasDebts) {
      return {
        icon: 'card-outline' as const,
        title: 'Empieza por documentar una deuda',
        text: 'Con el saldo y la cuota mínima ya podemos mostrarte un plan estimado.',
        action: 'Agregar deuda',
        onAction: () => router.push('/nueva-deuda'),
        tone: colors.primarySoft,
        color: colors.primary,
      };
    }
    if (summary.expenses === 0) {
      return {
        icon: 'receipt-outline' as const,
        title: 'Aún no registras gastos este mes',
        text: 'Registra lo que gastes para que tu panorama sea real, no una suposición.',
        action: 'Registrar gasto',
        onAction: () => router.push('/nuevo-movimiento?type=expense'),
        tone: colors.infoSoft,
        color: colors.info,
      };
    }
    if (summary.debtPayments < minimum) {
      return {
        icon: 'time-outline' as const,
        title: 'Tienes cuotas pendientes este mes',
        text: `Te faltan ${formatMoney(Math.max(0, minimum - summary.debtPayments))} para cubrir las cuotas mínimas.`,
        action: 'Ver deudas',
        onAction: () => router.push('/(tabs)/deudas'),
        tone: colors.warningSoft,
        color: colors.warning,
      };
    }
    return {
      icon: 'sparkles-outline' as const,
      title: 'Vas construyendo claridad',
      text: 'Revisa tu plan y ajusta el abono extra para ver cuánto cambia tu fecha de libertad.',
      action: 'Revisar plan',
      onAction: () => router.push('/(tabs)/plan'),
      tone: colors.successSoft,
      color: colors.success,
    };
  })();

  return (
    <Screen>
      <PageHeader
        title={`Hola, ${firstName}`}
        subtitle={formatLongDate(now)}
        right={
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {profile?.name?.charAt(0).toUpperCase() ?? 'D'}
            </Text>
          </View>
        }
      />

      <LinearGradient
        colors={primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroOrbOne} />
        <View style={styles.heroOrbTwo} />
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>DEUDA TOTAL</Text>
          <View style={styles.heroPill}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#DFFFF5" />
            <Text style={styles.heroPillText}>Local y privado</Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>{formatMoney(debtTotal)}</Text>
        <Text style={styles.heroSubtext}>
          {hasDebts
            ? `${debts.filter((debt) => debt.currentBalance > 0).length} deuda${debts.filter((debt) => debt.currentBalance > 0).length === 1 ? '' : 's'} activa${debts.filter((debt) => debt.currentBalance > 0).length === 1 ? '' : 's'}`
            : 'Aún no has agregado deudas'}
        </Text>

        {originalTotal > 0 ? (
          <View style={styles.heroProgressArea}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${paidRatio * 100}%` }]} />
            </View>
            <View style={styles.heroProgressLabels}>
              <Text style={styles.heroProgressText}>
                Has pagado {formatMoney(paidAmount)}
              </Text>
              <Text style={styles.heroProgressPercent}>{Math.round(paidRatio * 100)}%</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.heroFooter}>
          <View>
            <Text style={styles.heroFooterLabel}>CUOTA MÍNIMA MENSUAL</Text>
            <Text style={styles.heroFooterValue}>{formatMoney(minimum)}</Text>
          </View>
          {freedomDate && plan.feasible ? (
            <View style={styles.heroFreedom}>
              <Ionicons name="flag-outline" size={15} color="#DFFFF5" />
              <View>
                <Text style={styles.heroFooterLabel}>LIBERTAD ESTIMADA</Text>
                <Text style={styles.heroFreedomValue}>{freedomDate}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.quickActions}>
        <QuickAction
          icon="remove-circle-outline"
          label="Gasto"
          color={colors.danger}
          backgroundColor={colors.dangerSoft}
          onPress={() => router.push('/nuevo-movimiento?type=expense')}
        />
        <QuickAction
          icon="add-circle-outline"
          label="Ingreso"
          color={colors.success}
          backgroundColor={colors.successSoft}
          onPress={() => router.push('/nuevo-movimiento?type=income')}
        />
        <QuickAction
          icon="people-outline"
          label="Crédito"
          color={colors.info}
          backgroundColor={colors.infoSoft}
          onPress={() => router.push('/credito-rapido' as Href)}
        />
        <QuickAction
          icon="card-outline"
          label="Deuda"
          color={colors.warning}
          backgroundColor={colors.warningSoft}
          onPress={() => router.push('/nueva-deuda')}
        />
      </View>

      <Card style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <View>
            <Text style={[styles.monthEyebrow, { color: colors.textMuted }]}>TU MES</Text>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {formatMonthYear(now)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/movimientos')}
            style={[styles.smallLink, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.smallLinkText, { color: colors.primary }]}>Ver detalle</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatTile
            label="Ingresos"
            value={formatMoney(summary.income)}
            icon="arrow-down-circle-outline"
            color={colors.success}
          />
          <StatTile
            label="Gastos"
            value={formatMoney(summary.expenses)}
            icon="arrow-up-circle-outline"
            color={colors.danger}
          />
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceText}>
            <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>
              BALANCE DEL MES
            </Text>
            <Text
              style={[
                styles.balanceValue,
                { color: summary.balance >= 0 ? colors.success : colors.danger },
              ]}>
              {summary.balance >= 0 ? '+' : ''}
              {formatMoney(summary.balance)}
            </Text>
          </View>
          <Text style={[styles.balanceHint, { color: colors.textSecondary }]}>
            Incluye pagos a deudas por {formatMoney(summary.debtPayments)}
          </Text>
        </View>
      </Card>

      <Card style={[styles.dailyCard, { backgroundColor: colors.surfaceStrong }]}>
        <View style={[styles.dailyIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="cafe-outline" size={22} color="#10201C" />
        </View>
        <View style={styles.dailyText}>
          <Text style={styles.dailyLabel}>PUEDES GASTAR HOY</Text>
          <Text style={styles.dailyAmount}>
            {expectedIncome > 0 ? formatMoney(safeDaily) : 'Configura tu ingreso'}
          </Text>
          <Text style={styles.dailyHint}>
            {expectedIncome > 0
              ? `Quedan ${daysRemainingInMonth(now)} días del mes, reservando tus cuotas.`
              : 'Ajusta tu ingreso mensual para calcular tu disponible diario.'}
          </Text>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Próximos pagos"
          actionLabel="Ver deudas"
          onAction={() => router.push('/(tabs)/deudas')}
        />
        {upcoming.length > 0 ? (
          <Card style={styles.listCard}>
            {upcoming.map((payment, index) => {
              const pending = Math.max(
                0,
                payment.debt.minimumPayment - payment.paidThisMonth
              );
              return (
                <Pressable
                  key={payment.debt.id}
                  onPress={() =>
                    router.push({
                      pathname: '/deuda/[id]',
                      params: { id: payment.debt.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.paymentRow,
                    index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
                    pressed && { opacity: 0.72 },
                  ]}>
                  <View
                    style={[styles.paymentDot, { backgroundColor: payment.debt.color }]}
                  />
                  <View style={styles.paymentInfo}>
                    <Text numberOfLines={1} style={[styles.paymentName, { color: colors.text }]}>
                      {payment.debt.name}
                    </Text>
                    <Text style={[styles.paymentDate, { color: colors.textMuted }]}>
                      {formatShortDate(payment.dueDate)} ·{' '}
                      {payment.isOverdue
                        ? 'Vencido'
                        : payment.daysUntil === 0
                          ? 'Hoy'
                          : payment.daysUntil === 1
                            ? 'Mañana'
                            : `En ${payment.daysUntil} días`}
                    </Text>
                  </View>
                  <View style={styles.paymentAmountBox}>
                    <Text
                      style={[
                        styles.paymentAmount,
                        {
                          color:
                            payment.isOverdue && pending > 0
                              ? colors.danger
                              : colors.text,
                        },
                      ]}>
                      {formatMoney(pending)}
                    </Text>
                    <Text style={[styles.paymentPending, { color: colors.textMuted }]}>
                      {pending === 0 ? 'Cubierto' : 'pendiente'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={hasDebts ? 'checkmark-circle-outline' : 'card-outline'}
              title={hasDebts ? 'No hay pagos próximos' : 'Agrega tu primera deuda'}
              description={
                hasDebts
                  ? 'Tus cuotas de este mes están cubiertas. Buen trabajo.'
                  : 'Con el saldo y la cuota mínima podremos crear tu plan.'
              }
              actionLabel={hasDebts ? undefined : 'Agregar deuda'}
              onAction={hasDebts ? undefined : () => router.push('/nueva-deuda')}
            />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Últimos movimientos"
          actionLabel="Ver todos"
          onAction={() => router.push('/(tabs)/movimientos')}
        />
        <Card style={styles.listCard}>
          {recent.length > 0 ? (
            recent.map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
                ]}>
                <TransactionRow
                  transaction={transaction}
                  category={
                    transaction.categoryId
                      ? categoryMap.get(transaction.categoryId)
                      : undefined
                  }
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="Tu historial está vacío"
              description="Registra tu primer gasto o ingreso para empezar a ver patrones."
              actionLabel="Registrar movimiento"
              onAction={() => router.push('/nuevo-movimiento?type=expense')}
            />
          )}
        </Card>
      </View>

      {debts.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Tus deudas"
            actionLabel="Administrar"
            onAction={() => router.push('/(tabs)/deudas')}
          />
          {debts
            .filter((debt) => debt.currentBalance > 0)
            .slice(0, 2)
            .map((debt) => {
              const paidThisMonth = transactions
                .filter(
                  (transaction) =>
                    transaction.type === 'debt_payment' &&
                    transaction.debtId === debt.id &&
                    transaction.date.startsWith(
                      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                    )
                )
                .reduce((sum, transaction) => sum + transaction.amount, 0);
              return (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  paidThisMonth={paidThisMonth}
                  onPress={() =>
                    router.push({ pathname: '/deuda/[id]', params: { id: debt.id } })
                  }
                />
              );
            })}
        </View>
      ) : null}

      <Card style={[styles.nextStep, { backgroundColor: nextStep.tone }]}>
        <View style={[styles.nextStepIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name={nextStep.icon} size={22} color={nextStep.color} />
        </View>
        <View style={styles.nextStepText}>
          <Text style={[styles.nextStepTitle, { color: colors.text }]}>{nextStep.title}</Text>
          <Text style={[styles.nextStepDescription, { color: colors.textSecondary }]}>
            {nextStep.text}
          </Text>
          <AppButton
            label={nextStep.action}
            variant="ghost"
            size="sm"
            onPress={nextStep.onAction}
            icon="arrow-forward"
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0, borderWidth: 0 }}
          />
        </View>
      </Card>
    </Screen>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

function QuickAction({ icon, label, color, backgroundColor, onPress }: QuickActionProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.76 },
      ]}>
      <View style={[styles.quickIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    gap: 5,
  },
  heroOrbOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(198, 240, 109, 0.12)',
    top: -85,
    right: -60,
  },
  heroOrbTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -55,
    left: -25,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroLabel: {
    color: '#CFF3E8',
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.4,
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
    marginTop: 2,
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
  heroProgressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C6F06D',
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
  heroProgressPercent: {
    color: '#FFFFFF',
    fontSize: typography.tiny,
    fontWeight: '800',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  heroFooterLabel: {
    color: '#BFE9DD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroFooterValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  heroFreedom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroFreedomValue: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '800',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  monthCard: {
    gap: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  monthTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  smallLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  smallLinkText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: spacing.md,
  },
  balanceText: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  balanceHint: {
    fontSize: typography.tiny,
    lineHeight: 16,
    textAlign: 'right',
    flex: 1,
    maxWidth: 190,
  },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 0,
  },
  dailyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyText: {
    flex: 1,
    gap: 2,
  },
  dailyLabel: {
    color: '#A9C8BF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dailyAmount: {
    color: '#FFFFFF',
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dailyHint: {
    color: '#A9C8BF',
    fontSize: typography.tiny,
    lineHeight: 16,
  },
  section: {
    gap: spacing.sm,
  },
  listCard: {
    paddingVertical: spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  paymentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentInfo: {
    flex: 1,
    gap: 3,
  },
  paymentName: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  paymentDate: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  paymentAmountBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  paymentAmount: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  paymentPending: {
    fontSize: 10,
    fontWeight: '500',
  },
  nextStep: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 0,
  },
  nextStepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepText: {
    flex: 1,
    gap: 4,
  },
  nextStepTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  nextStepDescription: {
    fontSize: typography.small,
    lineHeight: 19,
  },
});
