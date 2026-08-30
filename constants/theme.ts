// ACED Design System — Pixel-perfect to product spec & mockups

export const Colors = {
  // Brand colors
  blue: '#0055FF',           // ACED Electric Blue
  blueLight: '#EDF3FF',      // Subtle blue background tint
  blueBorder: '#C2D9FF',
  primaryBlack: '#09090A',
  secondaryText: '#6E6E73',
  tertiaryText: '#8E8E93',

  // Backgrounds & Surfaces
  background: '#FFFFFF',
  backgroundSoft: '#F4F4F6',
  cardBg: '#FFFFFF',
  border: '#E8E8ED',

  // Semantic status colors
  green: '#10B981',
  greenLight: '#D1FAE5',
  orange: '#F59E0B',
  orangeLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',

  // Neutrals
  white: '#FFFFFF',
  black: '#09090A',
  gray100: '#F4F4F6',
  gray200: '#E8E8ED',
  gray300: '#D1D1D6',
  gray400: '#A1A1AA',
  gray500: '#6E6E73',
  gray900: '#09090A',

  // Navigation
  tabActive: '#0055FF',
  tabInactive: '#A1A1AA',
} as const;

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const Layout = {
  screenPaddingH: 20,
  tabBarHeight: 84,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Layout,
  Shadows,
};
