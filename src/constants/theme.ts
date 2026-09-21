import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#FF7A33',
  primaryText: '#C24A0F',
  primaryPressed: '#E85D1F',
  primaryTint: '#FFE7D6',
  secondary: '#2B2D42',
  secondaryTint: '#E9EAF0',
  accent: '#FFC145',
  success: '#4CAF6D',
  warning: '#F2A93C',
  danger: '#E5484D',
  info: '#3B82C4',
  bg: '#FFFFFF',
  bgAlt: '#FAFAFA',
  border: '#E7E7EC',
  textMuted: '#8A8B99',
  text: '#2B2D42',
  white: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 38 },
  h1: { fontFamily: fonts.semiBold, fontSize: 22, lineHeight: 30 },
  h2: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 22 },
} as const satisfies Record<string, TextStyle>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const cardShadow = {
  shadowColor: '#2B2D42',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const satisfies ViewStyle;
