import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, useMemo } from 'react';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { migrateDatabase } from '@/db/database';
import { useAppTheme } from '@/hooks/use-app-theme';
import { AppProvider, useApp } from '@/providers/app-provider';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useAppTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(theme.dark ? DarkTheme : DefaultTheme),
      colors: {
        ...(theme.dark ? DarkTheme : DefaultTheme).colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    }),
    [theme]
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <SQLiteProvider databaseName="deuda-clara.db" onInit={migrateDatabase} useSuspense>
            <RootNavigator />
          </SQLiteProvider>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { initializing, user } = useAuth();

  useEffect(() => {
    if (!initializing) {
      void SplashScreen.hideAsync();
    }
  }, [initializing]);

  if (initializing) return <LoadingScreen />;

  if (!user) return <AppStack />;

  return (
    <AppProvider key={user.id} authUserId={user.id}>
      <AuthenticatedContent />
    </AppProvider>
  );
}

function AuthenticatedContent() {
  const { loading } = useApp();
  if (loading) return <LoadingScreen />;
  return <AppStack />;
}

function AppStack() {
  const { user } = useAuth();
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="nuevo-movimiento"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="nueva-deuda"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="editar-deuda/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="deuda/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="editar-perfil"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="privacidad" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
