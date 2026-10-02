import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_FOLLOWED_SOURCES = '@yewi_followed_sources';

interface FollowedSourcesState {
  sources: string[];
  isLoading: boolean;
  loadSources: () => Promise<string[]>;
  toggleSource: (sourceId: string) => Promise<void>;
  hasSource: (sourceId: string) => boolean;
  clearSources: () => Promise<void>;
}

export const useFollowedSourcesStore = create<FollowedSourcesState>((set, get) => ({
  sources: [],
  isLoading: false,

  loadSources: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_FOLLOWED_SOURCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ sources: parsed, isLoading: false });
          return parsed;
        }
      }
      set({ sources: [], isLoading: false });
      return [];
    } catch {
      set({ sources: [], isLoading: false });
      return [];
    }
  },

  toggleSource: async (sourceId: string) => {
    const current = get().sources;
    const exists = current.includes(sourceId);
    const updated = exists ? current.filter((id) => id !== sourceId) : [...current, sourceId];
    set({ sources: updated });
    await AsyncStorage.setItem(STORAGE_KEY_FOLLOWED_SOURCES, JSON.stringify(updated)).catch(() => {});
  },

  hasSource: (sourceId: string) => {
    return get().sources.includes(sourceId);
  },

  clearSources: async () => {
    set({ sources: [] });
    await AsyncStorage.removeItem(STORAGE_KEY_FOLLOWED_SOURCES).catch(() => {});
  },
}));
