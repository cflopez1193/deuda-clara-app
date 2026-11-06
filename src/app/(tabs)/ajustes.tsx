import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, type IoniconName } from '@/components/ui/app-button';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { formatMoney } from '@/domain/money';
import { shareBackupJson, shareTransactionsCsv } from '@/lib/export';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { profile, debts, transactions, categories, exportBackup, resetData } = useApp();
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [resetting, setResetting] = useState(false);

  const strategyLabel =
    profile?.payoffStrategy === 'snowball' ? 'Bola de nieve' : 'Avalancha';

  const runExport = async (kind: 'json' | 'csv') => {
    setExporting(kind);
    try {
      const backup = await exportBackup();
      if (kind === 'json') {
        await shareBackupJson(backup);
      } else {
        await shareTransactionsCsv(backup.transactions, categories);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo exportar la información.';
      Alert.alert('No se pudo exportar', message);
    } finally {
      setExporting(null);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Borrar todos los datos',
      'Se eliminarán tu perfil, movimientos y deudas de este teléfono. Si no exportaste un respaldo, esta información no se podrá recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            setResetting(true);
            void resetData()
              .then(async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                router.replace('/onboarding');
              })
              .catch((cause: unknown) => {
                const message =
                  cause instanceof Error ? cause.message : 'No se pudieron borrar los datos.';
                Alert.alert('Algo salió mal', message);
              })
              .finally(() => setResetting(false));
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <PageHeader title="Ajustes" subtitle="Tu espacio, tus reglas." />

      <Card
        onPress={() => router.push('/editar-perfil')}
        accessibilityLabel="Editar perfil"
        style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.textInverse }]}>
            {profile?.name?.charAt(0).toUpperCase() ?? 'D'}
          </Text>
        </View>
        <View style={styles.profileText}>
          <Text numberOfLines={1} style={[styles.profileName, { color: colors.text }]}>
            {profile?.name ?? 'Tu perfil'}
          </Text>
          <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>
            Ingreso mensual: {formatMoney(profile?.monthlyIncome ?? 0)}
          </Text>
        </View>
        <View style={[styles.editIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="pencil-outline" size={17} color={colors.textSecondary} />
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PLAN</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="flag-outline"
            color={colors.primary}
            title="Estrategia de pago"
            subtitle={`${strategyLabel} · abono extra ${formatMoney(profile?.extraDebtPayment ?? 0)}`}
            onPress={() => router.push('/(tabs)/plan')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="cash-outline"
            color={colors.success}
            title="Ingreso mensual"
            subtitle={formatMoney(profile?.monthlyIncome ?? 0)}
            onPress={() => router.push('/editar-perfil')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TUS DATOS</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="download-outline"
            color={colors.info}
            title="Exportar respaldo completo"
            subtitle="Archivo JSON con perfil, deudas y movimientos"
            onPress={() => void runExport('json')}
            loading={exporting === 'json'}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="document-text-outline"
            color={colors.info}
            title="Exportar movimientos en CSV"
            subtitle="Ideal para abrir en Excel o Google Sheets"
            onPress={() => void runExport('csv')}
            loading={exporting === 'csv'}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline"
            color={colors.danger}
            title="Borrar todos los datos"
            subtitle="Elimina la información de este teléfono"
            onPress={confirmReset}
            destructive
            loading={resetting}
          />
        </Card>
        <Text style={[styles.dataSummary, { color: colors.textMuted }]}>
          {transactions.length} movimientos · {debts.length} deudas guardadas en este dispositivo
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PRIVACIDAD Y SOPORTE</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="lock-closed-outline"
            color={colors.primary}
            title="Privacidad y datos"
            subtitle="Cómo se guarda y protege tu información"
            onPress={() => router.push('/privacidad')}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="shield-checkmark-outline"
            color={colors.primary}
            title="Asesoría financiera"
            subtitle="Deuda Clara es una herramienta educativa, no una asesoría regulada"
            onPress={() =>
              Alert.alert(
                'Herramienta educativa',
                'Deuda Clara te ayuda a registrar, entender y planificar. No ofrece asesoría financiera regulada, créditos ni inversiones.'
              )
            }
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PRÓXIMAMENTE</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="cloud-outline"
            color={colors.textMuted}
            title="Sincronización en la nube"
            subtitle="Comparte tu espacio con pareja o familia"
            badge="Próximamente"
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="apps-outline"
            color={colors.textMuted}
            title="Widgets de inicio"
            subtitle="Gasto del día y próximos pagos"
            badge="Próximamente"
          />
        </Card>
      </View>

      <View style={[styles.about, { borderTopColor: colors.border }]}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet-outline" size={20} color={colors.textInverse} />
        </View>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>Deuda Clara</Text>
        <Text style={[styles.aboutMeta, { color: colors.textMuted }]}>
          Versión {Constants.expoConfig?.version ?? '1.0.0'} · Hecha para Colombia
        </Text>
        <Text style={[styles.aboutMeta, { color: colors.textMuted }]}>
          Offline primero. Sin banco conectado.
        </Text>
      </View>

      <AppButton
        label="Exportar respaldo antes de cambiar de teléfono"
        variant="ghost"
        icon="download-outline"
        onPress={() => void runExport('json')}
        loading={exporting === 'json'}
        fullWidth
      />
    </Screen>
  );
}

function SettingsRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  badge,
  destructive,
  loading,
}: {
  icon: IoniconName;
  color: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  badge?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  const { colors } = useAppTheme();
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowTitle,
            { color: destructive ? colors.danger : colors.text },
          ]}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      {loading ? (
        <Text style={[styles.rowBadge, { color: colors.textMuted }]}>...</Text>
      ) : badge ? (
        <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.badgeText, { color: colors.textMuted }]}>{badge}</Text>
        </View>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 23,
    fontWeight: '900',
  },
  profileText: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileMeta: {
    fontSize: typography.small,
    fontWeight: '500',
  },
  editIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    paddingVertical: spacing.xs,
  },
  separator: {
    height: 1,
    marginLeft: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    minHeight: 64,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: typography.tiny,
    lineHeight: 16,
  },
  rowBadge: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dataSummary: {
    fontSize: typography.tiny,
    textAlign: 'center',
  },
  about: {
    alignItems: 'center',
    gap: 5,
    paddingTop: spacing.xl,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  aboutTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  aboutMeta: {
    fontSize: typography.tiny,
    textAlign: 'center',
  },
});
