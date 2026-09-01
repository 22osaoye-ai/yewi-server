import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedCurrency = 'EUR' | 'USD' | 'GBP';
export type SupportedLanguage = 'es' | 'en';

interface PreferencesState {
  pushNotificationsEnabled: boolean;
  darkMode: boolean;
  currency: SupportedCurrency;
  language: SupportedLanguage;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setLanguage: (language: SupportedLanguage) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      pushNotificationsEnabled: true,
      darkMode: false,
      currency: 'EUR',
      language: 'es',

      setPushNotificationsEnabled: (pushNotificationsEnabled) =>
        set({ pushNotificationsEnabled }),

      setDarkMode: (darkMode) => set({ darkMode }),

      setCurrency: (currency) => set({ currency }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'yewi-app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
