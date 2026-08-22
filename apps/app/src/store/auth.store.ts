import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  activeRole: 'CLIENT' | 'PROFESSIONAL';
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  switchRole: (role: 'CLIENT' | 'PROFESSIONAL') => void;
  logout: () => Promise<void>;
  loadPersistedAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  activeRole: 'CLIENT',
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.setItem('@yewi_access_token', accessToken);
    await AsyncStorage.setItem('@yewi_refresh_token', refreshToken);
    await AsyncStorage.setItem('@yewi_user', JSON.stringify(user));

    const initialRole = user.roles.includes('PROFESSIONAL') ? 'PROFESSIONAL' : 'CLIENT';

    set({
      user,
      accessToken,
      activeRole: initialRole,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateUser: async (user) => {
    await AsyncStorage.setItem('@yewi_user', JSON.stringify(user));
    set({ user });
  },

  switchRole: (role) => {
    set({ activeRole: role });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      '@yewi_access_token',
      '@yewi_refresh_token',
      '@yewi_user',
    ]);

    set({
      user: null,
      accessToken: null,
      activeRole: 'CLIENT',
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadPersistedAuth: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('@yewi_access_token'),
        AsyncStorage.getItem('@yewi_user'),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        const initialRole = user.roles.includes('PROFESSIONAL') ? 'PROFESSIONAL' : 'CLIENT';
        set({
          user,
          accessToken: token,
          activeRole: initialRole,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
