/**
 * Fuente única de verdad para medidas de layout.
 * Sustituye a los números "mágicos" repartidos por las pantallas
 * (paddingBottom 90/120/140, SCREEN_WIDTH - 40, marginHorizontal -20...).
 */

// Escala de espaciado (múltiplos de 4)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Padding horizontal estándar de TODAS las pantallas
export const SCREEN_PADDING = SPACING.xl; // 20

// Radios: 5 valores en lugar de 50
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Tipografía: mínimo 12 (accesibilidad). Sin medias (13.5, 14.5...)
export const FONT_SIZE = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLg: 16,
  title: 18,
  h2: 22,
  h1: 28,
} as const;

// Área táctil mínima recomendada (iOS HIG 44pt / Material 48dp)
export const MIN_TOUCH = 44;

// Alturas de controles: 3 en lugar de 8 (40/42/44/46/48/50/52/54)
export const CONTROL_HEIGHT = {
  sm: 40,
  md: 48,
  lg: 56,
} as const;

export const HEADER_HEIGHT = 56;

// Barra de pestañas flotante (debe coincidir con app/(tabs)/_layout.tsx)
export const TAB_BAR = {
  itemHeight: 52, // styles.tabButton.height
  paddingVertical: 6, // styles.dockContainer.paddingVertical
  minBottomOffset: 16, // Math.max(insets.bottom, 16)
  gap: 16, // aire entre el último contenido y la barra
} as const;
export const TAB_BAR_HEIGHT = TAB_BAR.itemHeight + TAB_BAR.paddingVertical * 2; // 64

// En tablets/plegables el contenido no se estira a todo el ancho
export const MAX_CONTENT_WIDTH = 640;
