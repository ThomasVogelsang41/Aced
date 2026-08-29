// ACED Design System — Theme Tokens

export const Colors = {
  // Core backgrounds
  background: '#FFFFFF',
  backgroundSoft: '#F7F7F5',

  // Primary text
  primaryBlack: '#09090A',
  secondaryText: '#6B6B70',

  // Borders & dividers
  border: '#E7E7E9',

  // ACED Electric Blue (brand)
  blue: '#145CFF',
  bluePressed: '#0D46D9',
  blueLight: '#EBF0FF',  // subtle blue tint for badges/backgrounds

  // Semantic colors
  green: '#16A34A',       // birdie / positive
  greenLight: '#DCFCE7',
  orange: '#EA580C',      // bogey / caution
  orangeLight: '#FFF0E6',
  red: '#DC2626',         // error / OB / double bogey+
  redLight: '#FEE2E2',

  // Neutrals
  white: '#FFFFFF',
  black: '#09090A',
  gray100: '#F7F7F5',
  gray200: '#E7E7E9',
  gray300: '#D1D1D6',
  gray400: '#B0B0BA',
  gray500: '#6B6B70',
  gray600: '#4A4A52',
  gray700: '#2E2E35',
  gray900: '#09090A',

  // Tab bar
  tabActive: '#145CFF',
  tabInactive: '#B0B0BA',
} as const;

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
  },

  // Font sizes
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

  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.3,
    wider: 0.8,
    widest: 1.5,
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
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#09090A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#09090A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#09090A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const Layout = {
  screenPaddingH: 20,
  tabBarHeight: 84,
  headerHeight: 60,
  cardRadius: 14,
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
};
