'use no memo';

import React from 'react';
import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget';

import { formatMoney } from '@/domain/money';

import type { WidgetData, WidgetDebt, WidgetTheme } from './types';

interface DebtClaraWidgetProps {
  data: WidgetData;
  theme: WidgetTheme;
  maxDebts?: number;
}

interface Palette {
  background: ColorProp;
  surface: ColorProp;
  border: ColorProp;
  text: ColorProp;
  textMuted: ColorProp;
  brand: ColorProp;
  brandSoft: ColorProp;
  danger: ColorProp;
  dangerSoft: ColorProp;
  success: ColorProp;
  successSoft: ColorProp;
  credit: ColorProp;
  creditSoft: ColorProp;
}

const palettes: Record<WidgetTheme, Palette> = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F7F6',
    border: '#E2E9E6',
    text: '#10201C',
    textMuted: '#6B7974',
    brand: '#0E7C66',
    brandSoft: '#DDF4ED',
    danger: '#B33B35',
    dangerSoft: '#FBE9E7',
    success: '#0F7055',
    successSoft: '#DDF4ED',
    credit: '#8A5608',
    creditSoft: '#FFF2D9',
  },
  dark: {
    background: '#07110F',
    surface: '#0D1B18',
    border: '#1E302C',
    text: '#EAF5F1',
    textMuted: '#8FA19B',
    brand: '#4FD1AE',
    brandSoft: '#123A31',
    danger: '#FF8D86',
    dangerSoft: '#3D1E1C',
    success: '#5AD3A9',
    successSoft: '#123A31',
    credit: '#F1B75C',
    creditSoft: '#352713',
  },
};

function quickActionUri(type: 'expense' | 'income' | 'credit'): string {
  if (type === 'credit') return 'deudaclara://credito-rapido';
  return `deudaclara://nuevo-movimiento?type=${type}`;
}

function QuickAction({
  label,
  color,
  backgroundColor,
  uri,
  marginRight,
}: {
  label: string;
  color: ColorProp;
  backgroundColor: ColorProp;
  uri: string;
  marginRight?: number;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight,
      }}>
      <TextWidget
        text={label}
        style={{ fontSize: 12, fontWeight: '700', color }}
      />
    </FlexWidget>
  );
}

function DebtRow({
  debt,
  palette,
}: {
  debt: WidgetDebt;
  palette: Palette;
}) {
  const displayName = debt.creditor?.trim() || debt.name;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{
        uri: `deudaclara://credito-rapido?debtId=${encodeURIComponent(debt.id)}`,
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 10,
        paddingHorizontal: 9,
        paddingVertical: 6,
        marginTop: 5,
      }}>
      <FlexWidget
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: debt.color as ColorProp,
          marginRight: 8,
        }}
      />
      <FlexWidget style={{ flex: 1, marginRight: 6 }}>
        <TextWidget
          text={displayName}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 11, fontWeight: '600', color: palette.text }}
        />
      </FlexWidget>
      <TextWidget
        text={formatMoney(debt.balance)}
        maxLines={1}
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: palette.textMuted,
          adjustsFontSizeToFit: true,
        }}
      />
    </FlexWidget>
  );
}

export function DebtClaraWidget({
  data,
  theme,
  maxDebts = 3,
}: DebtClaraWidgetProps) {
  const palette = palettes[theme];
  const visibleDebts = data.debts.slice(0, Math.max(1, maxDebts));

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.background,
        borderRadius: 20,
        padding: 13,
        flexDirection: 'column',
      }}>
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}>
        <FlexWidget style={{ flex: 1, marginRight: 8 }}>
          <TextWidget
            text="DEUDA CLARA"
            style={{
              fontSize: 9,
              fontWeight: '800',
              letterSpacing: 1.1,
              color: palette.brand,
            }}
          />
          <TextWidget
            text={formatMoney(data.totalDebt)}
            maxLines={1}
            style={{
              fontSize: 21,
              fontWeight: '800',
              color: palette.text,
              marginTop: 1,
              adjustsFontSizeToFit: true,
            }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            backgroundColor: palette.brandSoft,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 5,
          }}>
          <TextWidget
            text="Abrir"
            style={{ fontSize: 9, fontWeight: '700', color: palette.brand }}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          marginTop: 10,
        }}>
        <QuickAction
          label="Gasto"
          color={palette.danger}
          backgroundColor={palette.dangerSoft}
          uri={quickActionUri('expense')}
          marginRight={6}
        />
        <QuickAction
          label="Ingreso"
          color={palette.success}
          backgroundColor={palette.successSoft}
          uri={quickActionUri('income')}
          marginRight={6}
        />
        <QuickAction
          label="Crédito"
          color={palette.credit}
          backgroundColor={palette.creditSoft}
          uri={quickActionUri('credit')}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginTop: 10,
        }}>
        <TextWidget
          text="PRESTAMISTAS"
          style={{
            fontSize: 8,
            fontWeight: '800',
            letterSpacing: 0.8,
            color: palette.textMuted,
          }}
        />
        <TextWidget
          text="Toca para sumar un crédito"
          style={{ fontSize: 8, color: palette.textMuted }}
        />
      </FlexWidget>

      {visibleDebts.length > 0 ? (
        visibleDebts.map((debt) => (
          <DebtRow key={debt.id} debt={debt} palette={palette} />
        ))
      ) : (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'deudaclara://nueva-deuda' }}
          style={{
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginTop: 5,
          }}>
          <TextWidget
            text="Aún no hay prestamistas. Toca aquí para registrar uno."
            maxLines={2}
            style={{ fontSize: 10, color: palette.textMuted }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
