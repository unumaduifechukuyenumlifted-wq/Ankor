import { Platform, TextStyle } from 'react-native';

/**
 * Anchor design system — cream / navy / gold.
 * Single visual language across all 27 screens.
 */
export const C = {
  bg: '#F7F2E8', // cream background
  bgDeep: '#EFE8D8', // deeper cream (page sections)
  card: '#FFFFFF',
  navy: '#16283F', // primary
  navySoft: '#243B5C', // lighter navy (rows on dark cards)
  navy10: 'rgba(22,40,63,0.10)',
  navy06: 'rgba(22,40,63,0.06)',
  gold: '#C99A3B', // accent
  goldDeep: '#A87F2C',
  goldSoft: '#F3E5C3', // soft gold tint
  terracotta: '#C1573B', // emergency / warnings / negative
  terracottaSoft: '#F2DCD2',
  green: '#4F6F52', // success
  greenSoft: '#DFE8DD',
  border: '#E4DCC9',
  gray: '#7A7A72', // secondary text
  graySoft: '#B8B4A6',
  ink: '#22303F', // body text on light
  brown: '#6E5A36', // banner text (navy/brown)
  banner: '#F1E7D2', // info banner bg
  onNavy: '#F7F2E8', // text on navy
  onNavyDim: 'rgba(247,242,232,0.66)',
  white: '#FFFFFF',
} as const;

export const R = {
  card: 20,
  input: 14,
  button: 16,
  banner: 14,
  chip: 999,
  xs: 8,
  s: 12,
} as const;

export const FONT = {
  serif: 'PlayfairDisplay_700Bold',
  serif600: 'PlayfairDisplay_600SemiBold',
  serifItalic: 'PlayfairDisplay_500Medium_Italic',
  sans: 'Inter_400Regular',
  sans500: 'Inter_500Medium',
  sans600: 'Inter_600SemiBold',
  sans700: 'Inter_700Bold',
};

/** Typography presets. */
export const T: Record<string, TextStyle> = {
  display: { fontFamily: FONT.serif, fontSize: 32, lineHeight: 40, color: C.navy },
  h1: { fontFamily: FONT.serif, fontSize: 26, lineHeight: 34, color: C.navy },
  h2: { fontFamily: FONT.serif, fontSize: 21, lineHeight: 28, color: C.navy },
  h3: { fontFamily: FONT.sans600, fontSize: 17, lineHeight: 24, color: C.navy },
  body: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 22, color: C.ink },
  body500: { fontFamily: FONT.sans500, fontSize: 15, lineHeight: 22, color: C.ink },
  small: { fontFamily: FONT.sans, fontSize: 13, lineHeight: 18, color: C.gray },
  small500: { fontFamily: FONT.sans500, fontSize: 13, lineHeight: 18, color: C.gray },
  label: {
    fontFamily: FONT.sans600,
    fontSize: 11,
    lineHeight: 14,
    color: C.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  money: { fontFamily: FONT.sans700, fontSize: 22, lineHeight: 28, color: C.navy },
  moneyLg: { fontFamily: FONT.serif, fontSize: 34, lineHeight: 42, color: C.navy },
};

export const SHADOW = Platform.select({
  web: { boxShadow: '0px 10px 30px rgba(22,40,63,0.08)' } as any,
  default: {
    shadowColor: '#16283F',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});

export const SHADOW_SM = Platform.select({
  web: { boxShadow: '0px 4px 14px rgba(22,40,63,0.07)' } as any,
  default: {
    shadowColor: '#16283F',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

export const P = { screen: 20 } as const;
