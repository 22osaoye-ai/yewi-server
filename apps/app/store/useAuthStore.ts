import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/domain/auth/auth.types';
import {
  clearTokens,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  registerAuthFailureHandler,
} from '@/services/apiClient';

export { UserProfile };

const ONBOARDING_STORAGE_KEY = '@yewi_has_seen_onboarding';
const USER_PROFILE_STORAGE_KEY = '@yewi_user_profile';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  needsProfileCompletion: boolean;
  initializeAuthState: () => Promise<void>;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  setAuth: (user: UserProfile, accessToken?: string, refreshToken?: string) => Promise<void>;
  setNeedsProfileCompletion: (value: boolean) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,
  needsProfileCompletion: false,

  initializeAuthState: async () => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    // Safety fallback: Ensure isLoading is never permanently stuck
    const safetyTimer = setTimeout(() => {
      if (get().isLoading) {
        set({ isLoading: false });
      }
    }, 1500);

    try {
      const [storedOnboarding, storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY),
        getAccessToken(),
      ]);

      const hasSeen = storedOnboarding === 'true';
      let restoredUser: UserProfile | null = null;

      if (storedUser) {
        try {
          restoredUser = JSON.parse(storedUser);
        } catch {}
      }

      set({
        hasSeenOnboarding: hasSeen,
        user: restoredUser,
        isAuthenticated: Boolean(restoredUser && storedToken),
        isLoading: false,
      });
    } catch (e) {
      console.warn('Error restoring auth state:', e);
      set({ isLoading: false });
    } finally {
      clearTimeout(safetyTimer);
    }
  },

  setHasSeenOnboarding: async (seen: boolean) => {
    try {
      if (seen) {
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Error saving onboarding status:', e);
    }
    set({ hasSeenOnboarding: seen });
  },

  setAuth: async (user, accessToken, refreshToken) => {
    if (accessToken) await setAccessToken(accessToken);
    if (refreshToken) await setRefreshToken(refreshToken);
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Error persisting user profile:', e);
    }

    // Sincronizar bóveda biométrica si el acceso por huella está activado
    try {
      const { usePreferencesStore } = await import('@/store/usePreferencesStore');
      if (usePreferencesStore.getState().biometricsEnabled) {
        const { biometricService } = await import('@/services/biometricService');
        await biometricService.saveCredentials(user, accessToken, refreshToken);
      }
    } catch {}

    set({
      user,
      isAuthenticated: true,
      hasSeenOnboarding: true,
      isLoading: false,
    });
  },

  setNeedsProfileCompletion: (needsProfileCompletion: boolean) => {
    set({ needsProfileCompletion });
  },

  updateUser: (partialUser) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...partialUser } : null;
      if (updatedUser) {
        AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedUser)).catch(() => {});
      }
      return { user: updatedUser };
    });
  },

  logout: async () => {
    await clearTokens();
    try {
      await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      await AsyncStorage.removeItem('@yewi_cached_my_requests');
    } catch {}
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      needsProfileCompletion: false,
      hasSeenOnboarding: true,
    });
  },
}));

// Auto-register apiClient 401 callback to enforce logout and immediate redirect
registerAuthFailureHandler(() => {
  useAuthStore.getState().logout().catch(() => {});
});

// Run auth initialization on boot (guarded for SSR)
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuthState();
}
