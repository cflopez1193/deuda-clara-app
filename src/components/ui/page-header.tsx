import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

interface StackHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}

export function StackHeader({ title, right, onBack }: StackHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stackHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={10}
        onPress={onBack ?? (() => router.back())}
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="chevron-back" size={21} color={colors.text} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.stackTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackTitle: {
    flex: 1,
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
