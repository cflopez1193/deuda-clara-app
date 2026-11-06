import { Ionicons } from '@expo/vector-icons';
import { addMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DebtCard } from '@/components/finance-rows';
import { AppButton, Card } from '@/components/ui/app-button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { primaryGradient, radius, spacing, typography } from '@/constants/theme';
import { formatMonthYear } from '@/domain/dates';
import {
  debtPaidRatio,
  paidToDebtInMonth,
  totalDebt,
  totalMinimumPayment,
  totalOriginalDebt,
} from '@/domain/finance';
import { formatMoney } from '@/domain/money';
import { buildPayoffPlan } from '@/domain/payoff';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function DebtsScreen() {
  const { colors } = useAppTheme();
  const { debts, transactions, profile } = useApp();
  const now = useMemo(() => new Date(), []);

  const activeDebts = debts.filter((debt) => debt.currentBalance > 0);
  const paidDebts = debts.filter((debt) => debt.currentBalance <= 0);
  const total = totalDebt(debts);
  const original = totalOriginalDebt(debts);
  const minimum = totalMinimumPayment(debts);
  const ratio = debtPaidRatio(debts);

  const plan = useMemo(
    () =>
      buildPayoffPlan(
        activeDebts.map((debt) => ({
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
    [activeDebts, profile?.extraDebtPayment, profile?.payoffStrategy]
  );

  const paidByDebt = useMemo(() => {
    const map = new Map<string, number>();
    for (const debt of debts) {
      map.set(debt.id, paidToDebtInMonth(transactions, debt.id, now));
    }
    return map;
  }, [debts, now, transactions]);

  return (
    <Screen>
      <PageHeader
        title="Deudas"
        subtitle="Documenta cada obligación y mira el avance real."
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar deuda"
            onPress={() => router.push('/nueva-deuda')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />

      {debts.length === 0 ? (
        <Card>
          <EmptyState
            icon="card-outline"
            title="Aún no tienes deudas registradas"
            description="Agrega el saldo, la cuota mínima y la tasa. Con eso creamos tu mapa y tu plan de pago."
            actionLabel="Agregar mi primera deuda"
            onAction={() => router.push('/nueva-deuda')}
          />
        </Card>
      ) : (
        <>
          <LinearGradient
            colors={primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <View style={styles.heroOrb} />
            <Text style={styles.heroLabel}>DEUDA TOTAL</Text>
            <Text style={styles.heroAmount}>{formatMoney(total)}</Text>
            <View style={styles.heroProgressRow}>
              <ProgressBar
                progress={ratio}
                color="#C6F06D"
                trackColor="rgba(255,255,255,0.18)"
                height={8}
              />
              <Text style={styles.heroProgressText}>{Math.round(ratio * 100)}%</Text>
            </View>
            <Text style={styles.heroProgressCaption}>
              Has pagado {formatMoney(Math.max(0, original - total))} de{' '}
              {formatMoney(original)}
            </Text>
            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.heroFooterLabel}>CUOTAS MENSUALES</Text>
                <Text style={styles.heroFooterValue}>{formatMoney(minimum)}</Text>
              </View>
              <View style={styles.heroFooterRight}>
                <Text style={styles.heroFooterLabel}>ACTIVAS</Text>
                <Text style={styles.heroFooterValue}>{activeDebts.length}</Text>
              </View>
            </View>
          </LinearGradient>

          <Card
            onPress={() => router.push('/(tabs)/plan')}
            accessibilityLabel="Ver plan de pago"
            style={styles.planCard}>
            <View style={[styles.planIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="flag-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.planText}>
              <Text style={[styles.planTitle, { color: colors.text }]}>
                Plan {profile?.payoffStrategy === 'snowball' ? 'bola de nieve' : 'avalancha'}
              </Text>
              <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                {plan.feasible && plan.hasDebts
                  ? `Libre de estas deudas en ${plan.months} meses (${formatMonthYear(addMonths(now, plan.months))}).`
                  : plan.hasDebts
                    ? 'Tu pago actual no alcanza a bajar el saldo. Revisa el plan.'
                    : 'Agrega una deuda activa para calcular el plan.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
          </Card>

          {activeDebts.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Deudas activas" />
              <View style={styles.debtList}>
                {activeDebts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    paidThisMonth={paidByDebt.get(debt.id) ?? 0}
                    onPress={() =>
                      router.push({ pathname: '/deuda/[id]', params: { id: debt.id } })
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {paidDebts.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Deudas pagadas" />
              <View style={styles.debtList}>
                {paidDebts.map((debt) => (
                  <Card
                    key={debt.id}
                    onPress={() =>
                      router.push({ pathname: '/deuda/[id]', params: { id: debt.id } })
                    }
                    style={styles.paidCard}>
                    <View style={[styles.paidIcon, { backgroundColor: colors.successSoft }]}>
                      <Ionicons name="checkmark" size={19} color={colors.success} />
                    </View>
                    <View style={styles.paidText}>
                      <Text style={[styles.paidName, { color: colors.text }]}>{debt.name}</Text>
                      <Text style={[styles.paidMeta, { color: colors.textMuted }]}>
                        Saldo en cero · {debt.creditor || 'Sin acreedor'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          <AppButton
            label="Agregar otra deuda"
            variant="secondary"
            icon="add"
            onPress={() => router.push('/nueva-deuda')}
            fullWidth
          />

          <View style={[styles.disclaimer, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              Los cálculos son estimaciones educativas. No constituyen asesoría financiera
              regulada.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(198,240,109,0.12)',
    right: -80,
    top: -90,
  },
  heroLabel: {
    color: '#CFF3E8',
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 37,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroProgressText: {
    color: '#FFFFFF',
    fontSize: typography.tiny,
    fontWeight: '800',
    width: 34,
    textAlign: 'right',
  },
  heroProgressCaption: {
    color: '#CFF3E8',
    fontSize: typography.tiny,
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
  heroFooterRight: {
    alignItems: 'flex-end',
  },
  heroFooterLabel: {
    color: '#BFE9DD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroFooterValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    flex: 1,
    gap: 3,
  },
  planTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  planDescription: {
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  section: {
    gap: spacing.sm,
  },
  debtList: {
    gap: spacing.md,
  },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paidIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidText: {
    flex: 1,
    gap: 2,
  },
  paidName: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  paidMeta: {
    fontSize: typography.tiny,
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
