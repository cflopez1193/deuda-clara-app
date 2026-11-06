import { Ionicons } from '@expo/vector-icons';
import { addMonths, isAfter, isSameMonth, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TransactionRow } from '@/components/finance-rows';
import { Card } from '@/components/ui/app-button';
import { FilterChips } from '@/components/ui/segmented-control';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { formatDayLabel, formatMonthYear } from '@/domain/dates';
import { summarizeMonth } from '@/domain/finance';
import { formatMoney } from '@/domain/money';
import type { Transaction, TransactionType } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

type Filter = 'all' | TransactionType;

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'debt_payment', label: 'Pagos' },
];

export default function TransactionsScreen() {
  const { colors } = useAppTheme();
  const { transactions, categories, removeTransaction } = useApp();
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [filter, setFilter] = useState<Filter>('all');

  const summary = useMemo(
    () => summarizeMonth(transactions, selectedMonth),
    [selectedMonth, transactions]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const groups = useMemo(() => {
    const filtered = transactions
      .filter((transaction) => isSameMonth(parseISO(transaction.date), selectedMonth))
      .filter((transaction) => filter === 'all' || transaction.type === filter);

    const map = new Map<string, Transaction[]>();
    for (const transaction of filtered) {
      const current = map.get(transaction.date) ?? [];
      current.push(transaction);
      map.set(transaction.date, current);
    }

    return [...map.entries()].map(([date, items]) => ({ date, items }));
  }, [filter, selectedMonth, transactions]);

  const isCurrentMonth = isSameMonth(selectedMonth, now);
  const nextDisabled = isCurrentMonth || isAfter(selectedMonth, now);

  const confirmDelete = (transaction: Transaction) => {
    Alert.alert(
      'Eliminar movimiento',
      transaction.type === 'debt_payment'
        ? 'Se eliminará el pago y el saldo de la deuda volverá a subir.'
        : 'Esta acción quitará el movimiento de tu historial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void removeTransaction(transaction.id)
              .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
              .catch((cause: unknown) => {
                const message =
                  cause instanceof Error ? cause.message : 'No se pudo eliminar el movimiento.';
                Alert.alert('Algo salió mal', message);
              });
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <PageHeader
        title="Movimientos"
        subtitle="Cada registro te da más claridad."
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar movimiento"
            onPress={() => router.push('/nuevo-movimiento?type=expense')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </Pressable>
        }
      />

      <View style={styles.monthNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => setSelectedMonth((current) => addMonths(current, -1))}
          style={[styles.monthButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={19} color={colors.text} />
        </Pressable>
        <View style={styles.monthCenter}>
          <Text style={[styles.monthEyebrow, { color: colors.textMuted }]}>HISTORIAL DE</Text>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {formatMonthYear(selectedMonth)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          disabled={nextDisabled}
          onPress={() => setSelectedMonth((current) => addMonths(current, 1))}
          style={[
            styles.monthButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: nextDisabled ? 0.35 : 1,
            },
          ]}>
          <Ionicons name="chevron-forward" size={19} color={colors.text} />
        </Pressable>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>BALANCE DEL MES</Text>
            <Text
              style={[
                styles.summaryBalance,
                { color: summary.balance >= 0 ? colors.success : colors.danger },
              ]}>
              {summary.balance >= 0 ? '+' : ''}
              {formatMoney(summary.balance)}
            </Text>
          </View>
          <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          </View>
        </View>
        <View style={styles.summaryDivider}>
          <SummaryItem label="Ingresos" value={formatMoney(summary.income)} color={colors.success} />
          <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
          <SummaryItem label="Gastos" value={formatMoney(summary.expenses)} color={colors.danger} />
          <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
          <SummaryItem
            label="Pagos"
            value={formatMoney(summary.debtPayments)}
            color={colors.warning}
          />
        </View>
      </Card>

      <FilterChips options={filters} value={filter} onChange={(value) => setFilter(value as Filter)} />

      {groups.length > 0 ? (
        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.date} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: colors.text }]}>
                  {formatDayLabel(parseISO(group.date))}
                </Text>
                <Text style={[styles.groupCount, { color: colors.textMuted }]}>
                  {group.items.length} movimiento{group.items.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Card style={styles.groupCard}>
                {group.items.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}>
                    <TransactionRow
                      transaction={transaction}
                      category={
                        transaction.categoryId
                          ? categoryMap.get(transaction.categoryId)
                          : undefined
                      }
                      onPress={
                        transaction.debtId
                          ? () =>
                              router.push({
                                pathname: '/deuda/[id]',
                                params: { id: transaction.debtId as string },
                              })
                          : undefined
                      }
                      onLongPress={() => confirmDelete(transaction)}
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>
      ) : (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title={
              filter === 'all'
                ? 'Sin movimientos este mes'
                : 'No hay registros con ese filtro'
            }
            description={
              filter === 'all'
                ? 'Registra un gasto o ingreso para empezar a construir tu historial.'
                : 'Prueba con otro filtro o cambia de mes.'
            }
            actionLabel={filter === 'all' ? 'Registrar movimiento' : undefined}
            onAction={
              filter === 'all'
                ? () => router.push('/nuevo-movimiento?type=expense')
                : undefined
            }
          />
        </Card>
      )}

      {groups.length > 0 ? (
        <Pressable
          onPress={() => router.push('/nuevo-movimiento?type=expense')}
          style={({ pressed }) => [
            styles.bottomAction,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}>
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={[styles.bottomActionText, { color: colors.textInverse }]}>
            Registrar movimiento
          </Text>
        </Pressable>
      ) : null}

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Mantén presionado un movimiento para eliminarlo.
      </Text>
    </Screen>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryItemLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.summaryItemValue, { color }]}>
        {value}
      </Text>
    </View>
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: {
    alignItems: 'center',
    gap: 1,
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
  summaryCard: {
    gap: spacing.md,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryBalance: {
    fontSize: typography.h1,
    fontWeight: '900',
    letterSpacing: -1,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.13)',
    paddingTop: spacing.md,
  },
  verticalDivider: {
    width: 1,
  },
  summaryItem: {
    flex: 1,
    gap: 3,
  },
  summaryItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryItemValue: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  groups: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  groupTitle: {
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  groupCount: {
    fontSize: typography.tiny,
    fontWeight: '500',
  },
  groupCard: {
    paddingVertical: spacing.xs,
  },
  bottomAction: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomActionText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  hint: {
    textAlign: 'center',
    fontSize: typography.tiny,
    paddingBottom: spacing.md,
  },
});
