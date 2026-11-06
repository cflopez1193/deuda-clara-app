import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, type IoniconName } from '@/components/ui/app-button';
import { MoneyField, PercentField, TextField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

const benefits: { icon: IoniconName; title: string; text: string }[] = [
  {
    icon: 'eye-outline',
    title: 'Mira el panorama',
    text: 'Deuda total, cuotas y lo que realmente te queda cada mes.',
  },
  {
    icon: 'create-outline',
    title: 'Documenta fácil',
    text: 'Registra gastos, ingresos y pagos en pocos segundos.',
  },
  {
    icon: 'flag-outline',
    title: 'Actúa con un plan',
    text: 'Una ruta clara para salir de las deudas paso a paso.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [includeDebt, setIncludeDebt] = useState(true);
  const [debtName, setDebtName] = useState('');
  const [balance, setBalance] = useState(0);
  const [minimumPayment, setMinimumPayment] = useState(0);
  const [annualRateBps, setAnnualRateBps] = useState(0);
  const [dueDayText, setDueDayText] = useState('15');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const goBack = () => {
    if (step === 0) return;
    setErrors({});
    setStep((current) => current - 1);
  };

  const validateProfile = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Escribe tu nombre o apodo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateDebt = () => {
    if (!includeDebt) return true;
    const next: Record<string, string> = {};
    if (!debtName.trim()) next.debtName = 'Escribe el nombre de la deuda.';
    if (balance <= 0) next.balance = 'Ingresa el saldo pendiente.';
    if (minimumPayment <= 0) next.minimumPayment = 'Ingresa la cuota mínima mensual.';
    const dueDay = Number.parseInt(dueDayText, 10);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
      next.dueDay = 'Usa un día entre 1 y 31.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const continueFromProfile = () => {
    if (!validateProfile()) return;
    setStep(2);
  };

  const finish = async () => {
    if (!validateProfile() || !validateDebt()) return;
    setSaving(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        monthlyIncome,
        debt: includeDebt
          ? {
              name: debtName.trim(),
              type: 'credit_card',
              originalBalance: balance,
              currentBalance: balance,
              annualRateBps,
              minimumPayment,
              dueDay: Number.parseInt(dueDayText, 10),
              color: '#E76F51',
            }
          : null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No se pudo guardar tu información.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} bottomPadding={spacing.xxl}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={goBack}
            style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.progress}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                { backgroundColor: index <= step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.backPlaceholder} />
      </View>

      {step === 0 ? (
        <View style={styles.welcome}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Ionicons name="wallet-outline" size={34} color={colors.textInverse} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>DEUDA CLARA</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Tus deudas,{'\n'}con claridad.
          </Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            Primero entiende dónde estás. Después construimos un plan realista para recuperar tu
            tranquilidad.
          </Text>

          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit.title} style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={benefit.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
                  <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                    {benefit.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.privacy, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.success} />
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              Tus datos se guardan en tu teléfono. Sin cuentas ni conexión obligatoria.
            </Text>
          </View>

          <AppButton
            label="Empezar"
            icon="arrow-forward"
            onPress={() => setStep(1)}
            fullWidth
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.form}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Empecemos por ti</Text>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            Esto nos ayuda a calcular cuánto puedes destinar a tus deudas cada mes.
          </Text>

          <TextField
            label="¿Cómo te llamas?"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((current) => ({ ...current, name: '' }));
            }}
            placeholder="Tu nombre o apodo"
            autoFocus
            autoCapitalize="words"
            error={errors.name}
            icon="person-outline"
          />

          <MoneyField
            label="Ingreso mensual aproximado"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
            hint="Puedes dejar 0 si tus ingresos son irregulares. Lo ajustas después."
          />

          <View style={[styles.tip, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              No necesitas conectar tu banco. Solo queremos darte un punto de partida.
            </Text>
          </View>

          <AppButton label="Continuar" icon="arrow-forward" onPress={continueFromProfile} fullWidth />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.form}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Tu deuda principal</Text>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            Si tienes varias, empieza por la que más te preocupa. Puedes agregar las demás después.
          </Text>

          <View style={[styles.choiceRow, { backgroundColor: colors.surfaceMuted }]}>
            <Pressable
              onPress={() => setIncludeDebt(true)}
              style={[
                styles.choice,
                includeDebt && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.choiceText,
                  { color: includeDebt ? colors.text : colors.textSecondary },
                ]}>
                Sí, agregarla
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIncludeDebt(false)}
              style={[
                styles.choice,
                !includeDebt && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.choiceText,
                  { color: !includeDebt ? colors.text : colors.textSecondary },
                ]}>
                Ahora no
              </Text>
            </Pressable>
          </View>

          {includeDebt ? (
            <View style={styles.debtForm}>
              <TextField
                label="Nombre de la deuda"
                value={debtName}
                onChangeText={(value) => {
                  setDebtName(value);
                  if (errors.debtName) setErrors((current) => ({ ...current, debtName: '' }));
                }}
                placeholder="Ej. Tarjeta Bancolombia"
                error={errors.debtName}
                icon="card-outline"
              />
              <MoneyField
                label="Saldo pendiente"
                value={balance}
                onChange={setBalance}
                error={errors.balance}
              />
              <MoneyField
                label="Cuota mínima mensual"
                value={minimumPayment}
                onChange={setMinimumPayment}
                error={errors.minimumPayment}
              />
              <View style={styles.twoColumns}>
                <View style={styles.column}>
                  <PercentField
                    label="Tasa efectiva anual"
                    value={annualRateBps}
                    onChange={setAnnualRateBps}
                    hint="Opcional. Si no la sabes, deja 0."
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
            </View>
          ) : (
            <View style={[styles.skipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={23} color={colors.primary} />
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Podrás agregar tus deudas en cualquier momento desde la pestaña Deudas.
              </Text>
            </View>
          )}

          <AppButton
            label={includeDebt ? 'Ver mi diagnóstico' : 'Entrar a Deuda Clara'}
            icon="checkmark"
            onPress={() => void finish()}
            loading={saving}
            disabled={saving}
            fullWidth
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  progressSegment: {
    flex: 1,
    maxWidth: 74,
    height: 5,
    borderRadius: 3,
  },
  welcome: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 47,
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  heroText: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  benefits: {
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  benefit: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  benefitDescription: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  privacyText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  form: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  stepTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  stepText: {
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: -spacing.sm,
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
    fontWeight: '600',
  },
  choiceRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    gap: 3,
  },
  choice: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  choiceText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  debtForm: {
    gap: spacing.lg,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  skipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  skipText: {
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
});
