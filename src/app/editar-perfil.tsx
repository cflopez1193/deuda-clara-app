import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { MoneyField, TextField } from '@/components/ui/form-field';
import { StackScreen } from '@/components/ui/stack-screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useApp } from '@/providers/app-provider';

export default function EditProfileScreen() {
  const { colors } = useAppTheme();
  const { profile, saveProfile } = useApp();
  const [name, setName] = useState(profile?.name ?? '');
  const [monthlyIncome, setMonthlyIncome] = useState(profile?.monthlyIncome ?? 0);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setNameError('Escribe tu nombre o apodo.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile({ name: name.trim(), monthlyIncome });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.';
      Alert.alert('Algo salió mal', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title="Editar perfil"
      footer={
        <AppButton
          label="Guardar cambios"
          icon="checkmark"
          onPress={() => void save()}
          loading={saving}
          disabled={saving}
          fullWidth
        />
      }>
      <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="person-outline" size={20} color={colors.primary} />
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          Tu ingreso mensual nos ayuda a calcular qué porcentaje de tu plata está comprometido con
          las deudas.
        </Text>
      </View>

      <TextField
        label="Nombre o apodo"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (nameError) setNameError(null);
        }}
        placeholder="Tu nombre"
        autoCapitalize="words"
        error={nameError ?? undefined}
        icon="person-outline"
      />

      <MoneyField
        label="Ingreso mensual aproximado"
        value={monthlyIncome}
        onChange={setMonthlyIncome}
        hint="Puedes usar un promedio si tus ingresos cambian cada mes."
      />

      <Text style={[styles.note, { color: colors.textMuted }]}>
        Esta información se guarda únicamente en tu teléfono.
      </Text>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  introText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 17,
    fontWeight: '600',
  },
  note: {
    fontSize: typography.tiny,
    lineHeight: 17,
    textAlign: 'center',
  },
});
