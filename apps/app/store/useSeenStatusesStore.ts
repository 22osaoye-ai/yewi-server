import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SeenStatusesState {
  seenStatusIds: string[];
  markStatusAsSeen: (statusId: string) => void;
  markGroupAsSeen: (statusIds: string[]) => void;
  isStatusSeen: (statusId: string) => boolean;
  isGroupSeen: (statusIds: string[]) => boolean;
}

export const useSeenStatusesStore = create<SeenStatusesState>()(
  persist(
    (set, get) => ({
      seenStatusIds: [],

      markStatusAsSeen: (statusId: string) =>
        set((state) => {
          if (state.seenStatusIds.includes(statusId)) return state;
          return { seenStatusIds: [...state.seenStatusIds, statusId] };
        }),

      markGroupAsSeen: (statusIds: string[]) =>
        set((state) => {
          const newIds = statusIds.filter((id) => !state.seenStatusIds.includes(id));
          if (newIds.length === 0) return state;
          return { seenStatusIds: [...state.seenStatusIds, ...newIds] };
        }),

      isStatusSeen: (statusId: string) => get().seenStatusIds.includes(statusId),

      isGroupSeen: (statusIds: string[]) => {
        if (!statusIds || statusIds.length === 0) return true;
        const seen = get().seenStatusIds;
        return statusIds.every((id) => seen.includes(id));
      },
    }),
    {
      name: '@yewi_seen_statuses_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
