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
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  accent: string;
  accentBg: string;
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
        headerBg: '#121214',
        cardBg: '#1A1A1E',
        primary: '#38BDF8',
        primaryLight: '#082F49',
        danger: '#EF4444',
        dangerBg: '#2E1515',
        success: '#22C55E',
        successBg: '#132B1B',
        warning: '#F59E0B',
        warningBg: '#2F210B',
        info: '#38BDF8',
        infoBg: '#0C2D48',
        accent: '#0EA5E9',
        accentBg: '#082F49',
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
        headerBg: '#F8F8FA',
        cardBg: '#FFFFFF',
        primary: '#0284C7',
        primaryLight: '#E0F2FE',
        danger: '#DC2626',
        dangerBg: '#FEE2E2',
        success: '#16A34A',
        successBg: '#DCFCE7',
        warning: '#D97706',
        warningBg: '#FEF3C7',
        info: '#0284C7',
        infoBg: '#EFF6FF',
        accent: '#0EA5E9',
        accentBg: '#F0F9FF',
      };

  const t = getTranslation(language);

  return {
    colors,
    t,
    isDark: darkMode,
    language,
  };
}
