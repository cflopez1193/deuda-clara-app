import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState, type PropsWithChildren } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

import { AppButton, type IoniconName } from '@/components/ui/app-button';
import { radius, spacing, typography } from '@/constants/theme';
import {
  formatNumberInput,
  formatPercentInput,
  parseMoneyInput,
  parsePercentInput,
} from '@/domain/money';
import type { Category } from '@/domain/types';
import { useAppTheme } from '@/hooks/use-app-theme';

interface FieldShellProps extends PropsWithChildren {
  label?: string;
  hint?: string;
  error?: string;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldShell}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      {children}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftText?: string;
  rightText?: string;
  emphasized?: boolean;
  icon?: IoniconName;
}

export function TextField({
  label,
  hint,
  error,
  leftText,
  rightText,
  emphasized = false,
  icon,
  style,
  multiline,
  ...props
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          },
          multiline && styles.multilineContainer,
        ]}>
        {icon ? <Ionicons name={icon} size={19} color={colors.textMuted} /> : null}
        {leftText ? (
          <Text style={[styles.affix, { color: colors.textSecondary }]}>{leftText}</Text>
        ) : null}
        <TextInput
          {...props}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[
            styles.input,
            emphasized && styles.inputEmphasized,
            multiline && styles.multilineInput,
            { color: colors.text },
            style,
          ]}
        />
        {rightText ? (
          <Text style={[styles.affix, { color: colors.textSecondary }]}>{rightText}</Text>
        ) : null}
      </View>
    </FieldShell>
  );
}

interface MoneyFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  emphasized?: boolean;
  placeholder?: string;
}

export function MoneyField({
  label,
  value,
  onChange,
  error,
  hint,
  autoFocus,
  emphasized,
  placeholder = '0',
}: MoneyFieldProps) {
  return (
    <TextField
      label={label}
      value={formatNumberInput(value)}
      onChangeText={(text) => onChange(parseMoneyInput(text))}
      keyboardType="number-pad"
      inputMode="numeric"
      placeholder={placeholder}
      leftText="$"
      error={error}
      hint={hint}
      autoFocus={autoFocus}
      emphasized={emphasized}
    />
  );
}

interface PercentFieldProps {
  label?: string;
  value: number;
  onChange: (bps: number) => void;
  error?: string;
  hint?: string;
}

export function PercentField({ label, value, onChange, error, hint }: PercentFieldProps) {
  const [text, setText] = useState(formatPercentInput(value));

  return (
    <TextField
      label={label}
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChange(parsePercentInput(next));
      }}
      keyboardType="decimal-pad"
      inputMode="decimal"
      placeholder="0"
      rightText="% EA"
      error={error}
      hint={hint}
    />
  );
}

function eventDate(event: DateTimePickerEvent, selected?: Date): Date | null {
  if (event.type === 'dismissed' || !selected) return null;
  return selected;
}

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const { colors } = useAppTheme();
  const [showIOS, setShowIOS] = useState(false);
  const date = parseISO(value);

  const handleChange = (selected: Date | null) => {
    if (selected) onChange(format(selected, 'yyyy-MM-dd'));
  };

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event, selected) => handleChange(eventDate(event, selected)),
      });
      return;
    }
    setShowIOS(true);
  };

  return (
    <>
      <FieldShell label={label}>
        <Pressable
          accessibilityRole="button"
          onPress={open}
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Ionicons name="calendar-outline" size={19} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
          <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
        </Pressable>
      </FieldShell>

      <Modal
        visible={showIOS}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIOS(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dateModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dateModalTitle, { color: colors.text }]}>Selecciona la fecha</Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={(_, selected) => handleChange(selected ?? date)}
              themeVariant={colors.text === '#EAF5F1' ? 'dark' : 'light'}
            />
            <AppButton label="Listo" onPress={() => setShowIOS(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </>
  );
}

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  type: 'expense' | 'income';
}

export function CategoryPicker({ categories, value, onChange, type }: CategoryPickerProps) {
  const { colors } = useAppTheme();
  const filtered = categories.filter((category) => category.type === type);

  return (
    <FieldShell label="Categoría">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}>
        {filtered.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(category.id)}
              style={[
                styles.category,
                {
                  backgroundColor: selected ? category.color : colors.surface,
                  borderColor: selected ? category.color : colors.border,
                },
              ]}>
              <Ionicons
                name={category.icon as IoniconName}
                size={17}
                color={selected ? '#FFFFFF' : category.color}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  { color: selected ? '#FFFFFF' : colors.textSecondary },
                ]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  fieldShell: {
    gap: 7,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    paddingVertical: 0,
    minHeight: 24,
  },
  inputEmphasized: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  multilineInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  affix: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  hint: {
    fontSize: typography.tiny,
    lineHeight: 16,
  },
  error: {
    fontSize: typography.tiny,
    fontWeight: '600',
    lineHeight: 16,
  },
  dateText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dateModal: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dateModalTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    textAlign: 'center',
  },
  categories: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  category: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: typography.small,
    fontWeight: '700',
  },
});
