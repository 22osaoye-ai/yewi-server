import { usePreferencesStore } from '@/store/usePreferencesStore';
import { getTranslation } from '@/constants/i18n';

export interface ThemeTokens {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  headerBg: string;
  cardBg: string;
  primary: string;
  primaryLight: string;
  danger: string;
  dangerBg: string;
}

export function useAppTheme() {
  const { darkMode, language } = usePreferencesStore();

  const colors: ThemeTokens = darkMode
    ? {
        isDark: true,
        background: '#121214',
        surface: '#1A1A1E',
        surfaceAlt: '#232328',
        border: '#2C2C32',
        borderSubtle: '#24242A',
        textPrimary: '#F4F4F5',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
        headerBg: '#18181B',
        cardBg: '#1A1A1E',
        primary: '#D98E28',
        primaryLight: '#312312',
        danger: '#EF4444',
        dangerBg: '#2E1515',
      }
    : {
        isDark: false,
        background: '#F8F8FA',
        surface: '#FFFFFF',
        surfaceAlt: '#FAFAFC',
        border: '#E5E5EA',
        borderSubtle: '#F4F4F6',
        textPrimary: '#18181B',
        textSecondary: '#71717A',
        textMuted: '#9CA3AF',
        headerBg: '#C87D20',
        cardBg: '#FFFFFF',
        primary: '#C87D20',
        primaryLight: '#FEF3C7',
        danger: '#DC2626',
        dangerBg: '#FEE2E2',
      };

  const t = getTranslation(language);

  return {
    colors,
    t,
    isDark: darkMode,
    language,
  };
}
