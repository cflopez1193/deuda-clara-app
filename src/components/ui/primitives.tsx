import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, type IoniconName } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  trackColor?: string;
}

export function ProgressBar({ progress, color, height = 8, trackColor }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const value = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor ?? colors.surfaceMuted, height, borderRadius: height / 2 },
      ]}>
      <View
        style={{
          width: `${value * 100}%`,
          backgroundColor: color ?? colors.primary,
          height,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} icon="add" onPress={onAction} size="sm" />
      ) : null}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Text
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.sectionAction, { color: colors.primary }]}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

interface IconBadgeProps {
  icon: IoniconName;
  color: string;
  backgroundColor?: string;
  size?: number;
}

export function IconBadge({ icon, color, backgroundColor, size = 40 }: IconBadgeProps) {
  return (
    <View
      style={[
        styles.iconBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? `${color}18`,
        },
      ]}>
      <Ionicons name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  icon: IoniconName;
  color: string;
}

export function StatTile({ label, value, icon, color }: StatTileProps) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.small,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 5,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: typography.tiny,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
