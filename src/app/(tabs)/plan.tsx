import { Ionicons } from '@expo/vector-icons';
import { addMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card } from '@/components/ui/app-button';
import { MoneyField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Screen } from '@/components/ui/screen';
import { primaryGradient, radius, spacing, typography } from '@/constants/theme';
import { formatMonthYear } from '@/domain/dates';
import { totalMinimumPayment } from '@/domain/finance';
import { formatMoney, formatPercentFromBps } from '@/domain/money';
import { buildPayoffPlan, payoffReasonMessage } from '@/domain/payoff';
import type { PayoffStrategy } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

const strategyOptions: { value: PayoffStrategy; label: string; icon: 'trending-down' | 'snow' }[] = [
  { value: 'avalanche', label: 'Avalancha', icon: 'trending-down' },
  { value: 'snowball', label: 'Bola de nieve', icon: 'snow' },
];

const extraSuggestions = [0, 50_000, 100_000, 200_000, 300_000];

export default function PlanScreen() {
  const { colors } = useAppTheme();
  const { debts, profile, saveProfile } = useApp();
  const now = useMemo(() => new Date(), []);

  const [strategy, setStrategy] = useState<PayoffStrategy>(
    profile?.payoffStrategy ?? 'avalanche'
  );
  const [extraPayment, setExtraPayment] = useState(profile?.extraDebtPayment ?? 0);
  const [savingExtra, setSavingExtra] = useState(false);

  const activeDebts = useMemo(
    () => debts.filter((debt) => debt.currentBalance > 0),
    [debts]
  );

  const planInput = useMemo(
    () =>
      activeDebts.map((debt) => ({
        id: debt.id,
        name: debt.name,
        balance: debt.currentBalance,
        annualRateBps: debt.annualRateBps,
        minimumPayment: debt.minimumPayment,
        color: debt.color,
      })),
    [activeDebts]
  );

  const plan = useMemo(
    () => buildPayoffPlan(planInput, strategy, extraPayment),
    [extraPayment, planInput, strategy]
  );

  const boostedPlan = useMemo(
    () => buildPayoffPlan(planInput, strategy, extraPayment + 100_000),
    [extraPayment, planInput, strategy]
  );

  const minimum = totalMinimumPayment(activeDebts);
  const income = profile?.monthlyIncome ?? 0;
  const paymentRatio = income > 0 ? plan.monthlyBudget / income : 0;
  const monthsSaved =
    plan.feasible && boostedPlan.feasible ? Math.max(0, plan.months - boostedPlan.months) : 0;
  const interestSaved =
    plan.feasible && boostedPlan.feasible
      ? Math.max(0, plan.totalInterest - boostedPlan.totalInterest)
      : 0;
  const extraDirty = extraPayment !== (profile?.extraDebtPayment ?? 0);

  const changeStrategy = async (value: PayoffStrategy) => {
    const previous = strategy;
    setStrategy(value);
    try {
      await saveProfile({ payoffStrategy: value });
    } catch (cause) {
      setStrategy(previous);
      const message =
        cause instanceof Error ? cause.message : 'No se pudo guardar la estrategia.';
      Alert.alert('Algo salió mal', message);
    }
  };

  const applyExtra = async () => {
    setSavingExtra(true);
    try {
      await saveProfile({ extraDebtPayment: extraPayment });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo guardar el abono.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSavingExtra(false);
    }
  };

  return (
    <Screen>
      <PageHeader
        title="Tu plan"
        subtitle="Una ruta estimada para recuperar tu libertad financiera."
      />

      {activeDebts.length === 0 ? (
        <Card>
          <EmptyState
            icon="flag-outline"
            title="Tu plan empieza con una deuda"
            description="Agrega el saldo, la tasa y la cuota mínima. Después podremos comparar estrategias y calcular tu fecha estimada de libertad."
            actionLabel="Agregar deuda"
            onAction={() => router.push('/nueva-deuda')}
          />
        </Card>
      ) : (
        <>
          <Card style={styles.strategyCard}>
            <View style={styles.strategyHeader}>
              <View>
                <Text style={[styles.strategyEyebrow, { color: colors.textMuted }]}>
                  ESTRATEGIA
                </Text>
                <Text style={[styles.strategyTitle, { color: colors.text }]}>
                  ¿Cómo quieres atacar tus deudas?
                </Text>
              </View>
              <View style={[styles.strategyIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="git-branch-outline" size={21} color={colors.primary} />
              </View>
            </View>
            <SegmentedControl
              options={strategyOptions}
              value={strategy}
              onChange={(value) => void changeStrategy(value)}
            />
            <View style={[styles.strategyHint, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons
                name={strategy === 'avalanche' ? 'trending-down' : 'snow'}
                size={17}
                color={colors.primary}
              />
              <Text style={[styles.strategyHintText, { color: colors.textSecondary }]}>
                {strategy === 'avalanche'
                  ? 'Avalancha: paga primero la deuda con la tasa más alta. Suele ahorrar más intereses.'
                  : 'Bola de nieve: paga primero la deuda más pequeña. Genera victorias rápidas y motivación.'}
              </Text>
            </View>
          </Card>

          {plan.feasible && plan.hasDebts ? (
            <LinearGradient
              colors={primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}>
              <View style={styles.heroOrb} />
              <View style={styles.heroTop}>
                <Text style={styles.heroLabel}>TU RUTA ESTIMADA</Text>
                <View style={styles.heroPill}>
                  <Ionicons name="sparkles-outline" size={12} color="#DFFFF5" />
                  <Text style={styles.heroPillText}>Plan activo</Text>
                </View>
              </View>
              <Text style={styles.heroMonths}>
                {plan.months} {plan.months === 1 ? 'mes' : 'meses'}
              </Text>
              <Text style={styles.heroSubtext}>
                para quedar libre de estas deudas · {formatMonthYear(addMonths(now, plan.months))}
              </Text>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>PAGO MENSUAL</Text>
                  <Text style={styles.heroStatValue}>{formatMoney(plan.monthlyBudget)}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>INTERESES EST.</Text>
                  <Text style={styles.heroStatValue}>{formatMoney(plan.totalInterest)}</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            <Card style={[styles.warningCard, { backgroundColor: colors.warningSoft }]}>
              <View style={[styles.warningIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="warning-outline" size={24} color={colors.warning} />
              </View>
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, { color: colors.text }]}>
                  Este plan necesita un ajuste
                </Text>
                <Text style={[styles.warningDescription, { color: colors.textSecondary }]}>
                  {payoffReasonMessage(plan.reason)}
                </Text>
              </View>
            </Card>
          )}

          <Card style={styles.extraCard}>
            <View style={styles.extraHeader}>
              <View style={[styles.extraIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="flash-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.extraText}>
                <Text style={[styles.extraTitle, { color: colors.text }]}>
                  Abono extra mensual
                </Text>
                <Text style={[styles.extraDescription, { color: colors.textSecondary }]}>
                  Todo peso extra reduce el tiempo y los intereses.
                </Text>
              </View>
            </View>
            <MoneyField value={extraPayment} onChange={setExtraPayment} />
            <View style={styles.suggestions}>
              {extraSuggestions.map((value) => {
                const selected = extraPayment === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setExtraPayment(value)}
                    style={[
                      styles.suggestion,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.suggestionText,
                        { color: selected ? colors.textInverse : colors.textSecondary },
                      ]}>
                      {value === 0 ? 'Sin extra' : formatMoney(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {extraDirty ? (
              <AppButton
                label="Aplicar abono"
                icon="checkmark"
                onPress={() => void applyExtra()}
                loading={savingExtra}
                disabled={savingExtra}
                fullWidth
              />
            ) : null}
          </Card>

          <Card style={styles.capacityCard}>
            <View style={styles.capacityTop}>
              <View>
                <Text style={[styles.capacityLabel, { color: colors.textMuted }]}>
                  ESFUERZO MENSUAL
                </Text>
                <Text style={[styles.capacityValue, { color: colors.text }]}>
                  {formatMoney(plan.monthlyBudget)}
                </Text>
              </View>
              <Text style={[styles.capacityPercent, { color: colors.primary }]}>
                {income > 0 ? `${Math.round(paymentRatio * 100)}% del ingreso` : 'Sin ingreso registrado'}
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(1, paymentRatio)}
              color={paymentRatio > 0.5 ? colors.warning : colors.primary}
              height={9}
            />
            <Text style={[styles.capacityHint, { color: colors.textSecondary }]}>
              {income <= 0
                ? 'Registra tu ingreso mensual en Ajustes para medir cuánto representa este pago.'
                : paymentRatio > 0.5
                  ? 'Más de la mitad de tu ingreso está comprometido. Considera renegociar plazos o buscar apoyo.'
                  : `Incluye ${formatMoney(minimum)} de cuotas mínimas y ${formatMoney(extraPayment)} de abono extra.`}
            </Text>
          </Card>

          {boostedPlan.feasible && plan.hasDebts ? (
            <Card style={[styles.simulationCard, { backgroundColor: colors.infoSoft }]}>
              <View style={[styles.simulationIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="rocket-outline" size={22} color={colors.info} />
              </View>
              <View style={styles.simulationText}>
                <Text style={[styles.simulationTitle, { color: colors.text }]}>
                  {plan.feasible
                    ? monthsSaved > 0
                      ? `Con ${formatMoney(100_000)} más al mes`
                      : `Con ${formatMoney(100_000)} más al mes`
                    : `Con ${formatMoney(100_000)} extra podrías avanzar`}
                </Text>
                <Text style={[styles.simulationDescription, { color: colors.textSecondary }]}>
                  {plan.feasible
                    ? monthsSaved > 0
                      ? `Terminarías ${monthsSaved} ${monthsSaved === 1 ? 'mes' : 'meses'} antes y ahorrarías ${formatMoney(interestSaved)} en intereses.`
                      : `Tu plan ya es sólido. El extra acortaría levemente el tiempo restante.`
                    : boostedPlan.months > 0
                      ? `La deuda bajaría en ${boostedPlan.months} meses y pagarías ${formatMoney(boostedPlan.totalInterest)} en intereses estimados.`
                      : 'Ajusta el monto para ver el efecto.'}
                </Text>
              </View>
            </Card>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="Orden de pago sugerido" />
            <View style={styles.orderList}>
              {plan.order.map((item, index) => {
                const debt = activeDebts.find((current) => current.id === item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      debt
                        ? router.push({ pathname: '/deuda/[id]', params: { id: debt.id } })
                        : undefined
                    }
                    style={({ pressed }) => [
                      styles.orderCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.78 },
                    ]}>
                    <View style={[styles.orderNumber, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.orderNumberText, { color: colors.primary }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.orderText}>
                      <Text style={[styles.orderName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
                        {formatMoney(item.balance)} · {formatPercentFromBps(item.annualRateBps)} EA
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={[styles.orderInterestLabel, { color: colors.textMuted }]}>
                        interés/mes
                      </Text>
                      <Text style={[styles.orderInterest, { color: colors.textSecondary }]}>
                        {formatMoney(item.monthlyInterest)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.disclaimer, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              Simulación educativa con tasas constantes y pagos puntuales. No incluye comisiones,
              seguros, moras ni cambios de tasa. No es asesoría financiera regulada.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  strategyCard: {
    gap: spacing.md,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  strategyEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  strategyTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  strategyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  strategyHintText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    gap: 4,
  },
  heroOrb: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(198, 240, 109, 0.12)',
    right: -80,
    top: -110,
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
  heroMonths: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: spacing.xs,
  },
  heroSubtext: {
    color: '#CFF3E8',
    fontSize: typography.small,
    lineHeight: 19,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  heroStat: {
    flex: 1,
    gap: 2,
  },
  heroStatLabel: {
    color: '#BFE9DD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  warningCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 0,
  },
  warningIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    flex: 1,
    gap: 3,
  },
  warningTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  warningDescription: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  extraCard: {
    gap: spacing.md,
  },
  extraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  extraIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    flex: 1,
    gap: 2,
  },
  extraTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  extraDescription: {
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestion: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  capacityCard: {
    gap: spacing.md,
  },
  capacityTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  capacityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  capacityValue: {
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  capacityPercent: {
    fontSize: typography.tiny,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: 140,
  },
  capacityHint: {
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  simulationCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 0,
  },
  simulationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulationText: {
    flex: 1,
    gap: 3,
  },
  simulationTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  simulationDescription: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  section: {
    gap: spacing.sm,
  },
  orderList: {
    gap: spacing.sm,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  orderNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberText: {
    fontSize: typography.body,
    fontWeight: '900',
  },
  orderText: {
    flex: 1,
    gap: 2,
  },
  orderName: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  orderMeta: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  orderInterestLabel: {
    fontSize: 8,
    fontWeight: '600',
  },
  orderInterest: {
    fontSize: typography.small,
    fontWeight: '800',
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
});
