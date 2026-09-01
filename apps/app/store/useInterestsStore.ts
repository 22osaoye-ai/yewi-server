import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';
import { professionalsApi } from '@/services/professionalsApi';

export const STORAGE_KEY_INTERESTS = '@yewi_user_interests';

interface InterestsState {
  interests: string[];
  isLoading: boolean;
  lastUpdatedAt: number;
  loadInterests: () => Promise<string[]>;
  setInterests: (newInterests: string[]) => Promise<void>;
  toggleInterest: (interest: string) => Promise<void>;
}

export const useInterestsStore = create<InterestsState>((set, get) => ({
  interests: [],
  isLoading: false,
  lastUpdatedAt: Date.now(),

  loadInterests: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      if (user?.professionalProfile?.skills && user.professionalProfile.skills.length > 0) {
        const skills = user.professionalProfile.skills;
        set({ interests: skills, isLoading: false });
        await AsyncStorage.setItem(STORAGE_KEY_INTERESTS, JSON.stringify(skills)).catch(() => {});
        return skills;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY_INTERESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ interests: parsed, isLoading: false });
          return parsed;
        }
      }

      set({ interests: [], isLoading: false });
      return [];
    } catch {
      set({ interests: [], isLoading: false });
      return [];
    }
  },

  setInterests: async (newInterests: string[]) => {
    const cleanInterests = Array.from(new Set(newInterests.map((s) => s.trim()).filter(Boolean)));
    const now = Date.now();

    // 1. Inmediatamente actualizar estado reactivo en memoria para actualización en tiempo real
    set({ interests: cleanInterests, lastUpdatedAt: now });

    // 2. Persistir localmente en AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY_INTERESTS, JSON.stringify(cleanInterests)).catch(() => {});

    // 3. Sincronizar con el usuario y perfil profesional si está autenticado
    const user = useAuthStore.getState().user;
    if (user) {
      useAuthStore.getState().updateUser({
        professionalProfile: user.professionalProfile
          ? {
              ...user.professionalProfile,
              skills: cleanInterests,
            }
          : undefined,
      });

      if (user.roles?.includes('PROFESSIONAL')) {
        professionalsApi
          .updateMyProfile({
            skills: cleanInterests,
          })
          .catch(() => {});
      }
    }
  },

  toggleInterest: async (interest: string) => {
    const current = get().interests;
    const exists = current.includes(interest);
    const updated = exists ? current.filter((i) => i !== interest) : [...current, interest];
    await get().setInterests(updated);
  },
}));
