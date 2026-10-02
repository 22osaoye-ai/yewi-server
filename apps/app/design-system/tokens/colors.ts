export const colors = {
  // Fondos y Superficies Monocromáticas Dark-First
  background: '#0B0F0F',
  surface: '#121818',
  surfaceElevated: '#171E1E',
  surfaceHighlight: '#1E2626',
  surfaceInput: '#151C1C',

  // Bordes y Divisores Translúcidos (Subtle White Overlays)
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.14)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
  borderFocus: '#24D5C4',

  // Tipografía
  textPrimary: '#F5F7F7',
  textSecondary: '#8F9B9B',
  textMuted: '#626D6D',
  textInverse: '#0B0F0F',

  // Acento Distintivo Yewi Pro (Turquesa / Cian Eléctrico)
  accent: '#24D5C4',
  accentDark: '#1AA89A',
  accentSoft: 'rgba(36, 213, 196, 0.12)',
  accentGlow: 'rgba(36, 213, 196, 0.25)',

  // Estados Semánticos
  success: '#39D98A',
  successSoft: 'rgba(57, 217, 138, 0.12)',
  warning: '#E5B94E',
  warningSoft: 'rgba(229, 185, 78, 0.12)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.12)',
  info: '#4FA3FF',
  infoSoft: 'rgba(79, 163, 255, 0.12)',
} as const;

export type ColorToken = keyof typeof colors;
