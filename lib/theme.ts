export type ThemeColors = {
  mode: 'light' | 'dark';
  bg: string;
  bgAlt: string;
  card: string;
  cardAlt: string;
  text: string;
  sub: string;
  faint: string;
  primary: string;
  primaryDark: string;
  accent: string;
  border: string;
  success: string;
  danger: string;
  onPrimary: string;
};

export const lightPalette: ThemeColors = {
  mode: 'light',
  bg: '#FFF6F8',
  bgAlt: '#FFE9F0',
  card: '#FFFFFF',
  cardAlt: '#FFF0F5',
  text: '#2C1220',
  sub: '#9A6B7E',
  faint: '#C9A3B2',
  primary: '#FF4D80',
  primaryDark: '#E63A6B',
  accent: '#FFB3C6',
  border: '#FFDDE7',
  success: '#21A366',
  danger: '#E5484D',
  onPrimary: '#FFFFFF',
};

export const darkPalette: ThemeColors = {
  mode: 'dark',
  bg: '#150A11',
  bgAlt: '#24121C',
  card: '#22101A',
  cardAlt: '#2C1522',
  text: '#FFE9F0',
  sub: '#C79AAC',
  faint: '#7C5464',
  primary: '#FF6B94',
  primaryDark: '#FF4D80',
  accent: '#7A2E4A',
  border: '#3A1E2C',
  success: '#3DDC97',
  danger: '#FF6369',
  onPrimary: '#2A0812',
};

export const F = {
  regular: 'NotoSansMalayalam_400Regular',
  medium: 'NotoSansMalayalam_500Medium',
  semibold: 'NotoSansMalayalam_600SemiBold',
  bold: 'NotoSansMalayalam_700Bold',
} as const;

export type Gradient = readonly [string, string, ...string[]];

export const HEART_GRADIENT: Gradient = ['#FF8FAC', '#FF4D80', '#E63A6B'];
export const SOFT_GRADIENT: Gradient = ['#FFE3EC', '#FFF6F8'];
export const SOFT_GRADIENT_DARK: Gradient = ['#2C1522', '#150A11'];

export function makeShadow(color: string, dark: boolean, radius = 16) {
  return {
    shadowColor: color,
    shadowOpacity: dark ? 0.45 : 0.28,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  };
}
