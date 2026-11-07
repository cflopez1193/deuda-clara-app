import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SupabaseSetupScreen } from '@/components/auth/supabase-setup';
import { AppButton, Card } from '@/components/ui/app-button';
import { TextField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { isValidEmail, normalizeEmail } from '@/lib/auth';
import { useAuth } from '@/providers/auth-provider';

const RESEND_SECONDS = 60;

type Step = 'email' | 'code';

export default function AuthScreen() {
  const { colors } = useAppTheme();
  const { configured, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!resendAt) return;

    const update = () => {
      const next = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) clearInterval(timer);
    };

    const timer = setInterval(update, 1000);
    update();

    return () => clearInterval(timer);
  }, [resendAt]);

  const requestCode = async () => {
    const target = normalizeEmail(email);
    if (!isValidEmail(target)) {
      setError('Escribe un correo válido, por ejemplo nombre@gmail.com.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendOtp(target);
      setEmail(target);
      setCode('');
      setStep('code');
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No pudimos enviar el código. Intenta de nuevo.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const resendCode = async () => {
    if (remaining > 0 || sending) return;

    setSending(true);
    setError(null);

    try {
      await sendOtp(email);
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No pudimos reenviar el código. Intenta de nuevo.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Escribe el código de 6 dígitos que enviamos a tu correo.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      await verifyOtp(email, code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'No pudimos verificar el código. Intenta de nuevo.';
      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  const changeEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setResendAt(0);
  };

  if (!configured) return <SupabaseSetupScreen />;

  const isCodeStep = step === 'code';

  return (
    <Screen edges={['top', 'bottom']} bottomPadding={spacing.xxl}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet-outline" size={32} color={colors.textInverse} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>DEUDA CLARA</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {isCodeStep ? 'Revisa tu correo' : 'Entra a tu espacio'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isCodeStep
            ? 'Enviamos un código de 6 dígitos. Escríbelo aquí para confirmar que eres tú.'
            : 'Usa tu Gmail, Outlook o cualquier correo. Sin contraseñas: te enviamos un código de 6 dígitos.'}
        </Text>
      </View>

      <Card style={styles.card}>
        {isCodeStep ? (
          <>
            <View style={[styles.emailPill, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.emailPillText, { color: colors.text }]}>
                {email}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Usar otro correo"
                onPress={changeEmail}
                hitSlop={10}>
                <Text style={[styles.changeLink, { color: colors.primary }]}>Cambiar</Text>
              </Pressable>
            </View>

            <TextField
              label="Código de 6 dígitos"
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, '').slice(0, 6));
                if (error) setError(null);
              }}
              placeholder="000000"
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
              error={error ?? undefined}
              style={styles.codeInput}
            />

            <AppButton
              label="Entrar a Deuda Clara"
              icon="arrow-forward"
              onPress={() => void confirmCode()}
              loading={verifying}
              disabled={verifying || code.length !== 6}
              fullWidth
            />

            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>¿No llegó?</Text>
              <Pressable
                accessibilityRole="button"
                disabled={remaining > 0 || sending}
                onPress={() => void resendCode()}
                hitSlop={8}>
                <Text
                  style={[
                    styles.resendLink,
                    { color: remaining > 0 || sending ? colors.textMuted : colors.primary },
                  ]}>
                  {sending
                    ? 'Enviando...'
                    : remaining > 0
                      ? `Reenviar en ${remaining} s`
                      : 'Reenviar código'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <TextField
              label="Correo electrónico"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError(null);
              }}
              placeholder="tu@gmail.com"
              keyboardType="email-address"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void requestCode()}
              editable={!sending}
              autoFocus
              error={error ?? undefined}
              icon="mail-outline"
            />

            <AppButton
              label="Enviar código"
              icon="paper-plane-outline"
              onPress={() => void requestCode()}
              loading={sending}
              disabled={sending}
              fullWidth
            />

            <View style={styles.resendRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={[styles.resendText, { color: colors.textMuted }]}>
                Tu correo solo se usa para confirmar tu identidad.
              </Text>
            </View>
          </>
        )}
      </Card>

      <View style={[styles.localNote, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="phone-portrait-outline" size={19} color={colors.primary} />
        <Text style={[styles.localNoteText, { color: colors.text }]}>
          Tus datos financieros siguen guardados en este teléfono. La cuenta solo protege el
          acceso.
        </Text>
      </View>

      <View style={[styles.note, { borderTopColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
        <Text style={[styles.noteText, { color: colors.textMuted }]}>
          Si ya usaste esta app antes de crear tu cuenta, tus datos locales se vincularán a la
          primera cuenta que inicie sesión.
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
    width: 68,
    height: 68,
    borderRadius: 22,
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
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.3,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 23,
  },
  card: {
    gap: spacing.lg,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  emailPillText: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
  },
  changeLink: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  resendLink: {
    fontSize: typography.tiny,
    fontWeight: '800',
  },
  localNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  localNoteText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
    fontWeight: '600',
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
