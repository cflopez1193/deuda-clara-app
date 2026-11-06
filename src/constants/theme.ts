import { Platform, useColorScheme } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: 38,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  small: 13,
  tiny: 11,
} as const;

export type AppColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
};

export type AppTheme = {
  dark: boolean;
  colors: AppColors;
};

const lightColors: AppColors = {
  background: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F1',
  surfaceStrong: '#0B2B26',
  text: '#10201C',
  textSecondary: '#52605B',
  textMuted: '#87938F',
  textInverse: '#F5FFFC',
  primary: '#0E7C66',
  primaryDark: '#075E4E',
  primarySoft: '#DDF4ED',
  accent: '#C6F06D',
  accentSoft: '#F0FAD6',
  border: '#E2E9E6',
  borderStrong: '#C8D3CF',
  success: '#12805F',
  successSoft: '#DDF4ED',
  danger: '#C2413B',
  dangerSoft: '#FBE9E7',
  warning: '#A9650A',
  warningSoft: '#FFF2D9',
  info: '#27659B',
  infoSoft: '#E6F0FA',
  overlay: 'rgba(4, 31, 26, 0.48)',
};

const darkColors: AppColors = {
  background: '#07110F',
  surface: '#0D1B18',
  surfaceMuted: '#142521',
  surfaceStrong: '#DDF4ED',
  text: '#EAF5F1',
  textSecondary: '#A3B5AF',
  textMuted: '#748681',
  textInverse: '#07110F',
  primary: '#4FD1AE',
  primaryDark: '#2FB894',
  primarySoft: '#123A31',
  accent: '#C6F06D',
  accentSoft: '#273A14',
  border: '#1E302C',
  borderStrong: '#2D433D',
  success: '#5AD3A9',
  successSoft: '#123A31',
  danger: '#FF8D86',
  dangerSoft: '#3D1E1C',
  warning: '#F1B75C',
  warningSoft: '#352713',
  info: '#84BCEB',
  infoSoft: '#142B3E',
  overlay: 'rgba(0, 0, 0, 0.62)',
};

export const lightTheme: AppTheme = { dark: false, colors: lightColors };
export const darkTheme: AppTheme = { dark: true, colors: darkColors };

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0B2B26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  android: {
    elevation: 2,
  },
  default: {},
});

export const primaryGradient = ['#0E7C66', '#075E4E'] as const;

export const debtTypeLabels: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  consumer_loan: 'Crédito de consumo',
  vehicle: 'Vehículo',
  mortgage: 'Hipoteca',
  informal: 'Préstamo informal',
  family: 'Familia o amigos',
  other: 'Otra deuda',
};
