import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/app-button';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const steps = [
  'Crea un proyecto gratuito en supabase.com.',
  'Copia .env.example a .env y agrega la URL del proyecto y la clave anon.',
  'En Authentication → Emails, incluye {{ .Token }} en las plantillas de confirmación y enlace mágico.',
  'Reinicia el servidor con npx expo start --clear.',
];

export function SupabaseSetupScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen edges={['top', 'bottom']} bottomPadding={spacing.xxl}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet-outline" size={32} color={colors.textInverse} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>DEUDA CLARA</Text>
        <Text style={[styles.title, { color: colors.text }]}>Falta conectar Supabase</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          La app necesita el proyecto de autenticación para enviar códigos a tu correo. Esta
          pantalla solo aparece cuando faltan las variables de entorno.
        </Text>
      </View>

      <Card style={styles.card}>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.stepNumberText, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
          </View>
        ))}
      </Card>

      <View style={[styles.envCard, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.envTitle, { color: colors.text }]}>Variables requeridas</Text>
        <Text style={[styles.envCode, { color: colors.textSecondary }]}>
          EXPO_PUBLIC_SUPABASE_URL{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY
        </Text>
      </View>

      <View style={[styles.note, { borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={19} color={colors.info} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          La clave anon es pública y está diseñada para usarse en la app. Nunca pongas la clave
          service_role en el teléfono.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 23,
  },
  card: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
    paddingTop: 4,
  },
  envCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 7,
  },
  envTitle: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  envCode: {
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
  },
});
