import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function EntryScreen() {
  const { loading, profile, error, refresh } = useApp();
  const { colors } = useAppTheme();

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>No se pudo abrir la app</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <AppButton label="Intentar de nuevo" icon="refresh" onPress={() => void refresh()} />
      </View>
    );
  }

  if (profile?.onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },
});
