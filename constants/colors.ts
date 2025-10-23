export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  success: string;
  successDark: string;
  warning: string;
  warningDark: string;
  error: string;
  errorDark: string;
  background: string;
  backgroundDark: string;
  surface: string;
  surfaceDark: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  borderLight: string;
  disabled: string;
}

export const LightColors: ThemeColors = {
  primary: '#4A90E2',
  primaryDark: '#357ABD',
  primaryLight: '#7AB3E8',

  success: '#6BCF7F',
  successDark: '#4CAF5A',

  warning: '#FFA726',
  warningDark: '#F57C00',

  error: '#FF6B6B',
  errorDark: '#E53935',

  background: '#F8F9FA',
  backgroundDark: '#E9ECEF',

  surface: '#FFFFFF',
  surfaceDark: '#F5F5F5',

  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',

  border: '#DEE2E6',
  borderLight: '#E9ECEF',

  disabled: '#CED4DA',
};

export const DarkColors: ThemeColors = {
  primary: '#5A9BFF',
  primaryDark: '#3370C8',
  primaryLight: '#8AB8FF',

  success: '#5EC473',
  successDark: '#3A9D51',

  warning: '#FFB347',
  warningDark: '#FF9100',

  error: '#FF7B7B',
  errorDark: '#E74C3C',

  background: '#0F141A',
  backgroundDark: '#1A2028',

  surface: '#1C242E',
  surfaceDark: '#222C38',

  text: '#E6ECF3',
  textSecondary: '#A9B4C1',
  textLight: '#7A8592',

  border: '#2A323C',
  borderLight: '#353F4B',

  disabled: '#3E4650',
};

export const Colors = LightColors;

export const HighContrastColors = {
  background: '#000000',
  text: '#FFFFFF',
  primary: '#FFD700',
  border: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const FontSizesAccessible = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  xxl: 36,
  xxxl: 44,
};
