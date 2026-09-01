import { usePreferencesStore } from '@/store/usePreferencesStore';

export function useColorScheme() {
  const darkMode = usePreferencesStore((state) => state.darkMode);
  return darkMode ? 'dark' : 'light';
}
