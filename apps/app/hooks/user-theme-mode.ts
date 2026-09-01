import { useThemeStore } from '@/store/themeStore';

export const useTheme = () => {
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === 'dark';
  return {
    theme,
    isDark,
    toggleTheme,
  };
};
