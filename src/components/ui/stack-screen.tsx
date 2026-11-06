import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/ui/page-header';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface StackScreenProps extends PropsWithChildren {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}

export function StackScreen({
  title,
  right,
  onBack,
  contentContainerStyle,
  footer,
  children,
}: StackScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: colors.background }]}>
      <StackHeader title={title} right={right} onBack={onBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets>
          {children}
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
