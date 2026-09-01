import { create } from 'zustand';
import { ServiceRequestItem } from '@/services/leadsApi';
import { NotificationItem } from '@/services/notificationsApi';
import { SubscriptionStatusResponse } from '@/services/paymentsApi';
import { useAuthStore } from './useAuthStore';

interface RealtimeState {
  notifications: NotificationItem[];
  unreadCount: number;
  availableLeads: ServiceRequestItem[];
  unseenLeadsCount: number;
  subscription: SubscriptionStatusResponse | null;
  setNotifications: (items: unknown, unreadCount: unknown) => void;
  addNotification: (item: unknown) => void;
  setAvailableLeads: (items: ServiceRequestItem[]) => void;
  addLead: (item: ServiceRequestItem) => void;
  markLeadsAsSeen: () => void;
  setSubscription: (subscription: SubscriptionStatusResponse) => void;
  markAsRead: (id: string) => void;
  toggleRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllAsRead: () => void;
  reset: () => void;
}

const initialState: Pick<
  RealtimeState,
  'notifications' | 'unreadCount' | 'availableLeads' | 'unseenLeadsCount' | 'subscription'
> = {
  notifications: [],
  unreadCount: 0,
  availableLeads: [],
  unseenLeadsCount: 0,
  subscription: null,
};

const isNotification = (value: unknown): value is NotificationItem =>
  Boolean(value && typeof value === 'object' && typeof (value as NotificationItem).id === 'string');

const normalizeNotifications = (value: unknown): NotificationItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  return value.filter(isNotification).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const belongsToCurrentUser = (item: NotificationItem) => {
  const currentUserId = useAuthStore.getState().user?.id;
  return !currentUserId || !item.userId || item.userId === currentUserId;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  ...initialState,
  setNotifications: (items, unreadCount) =>
    set({
      notifications: normalizeNotifications(items).filter(belongsToCurrentUser),
      unreadCount:
        typeof unreadCount === 'number' && Number.isFinite(unreadCount)
          ? Math.max(0, Math.floor(unreadCount))
          : 0,
    }),
  addNotification: (item) =>
    set((state) => {
      if (!isNotification(item) || !belongsToCurrentUser(item)) {
        return state;
      }
      const current = normalizeNotifications(state.notifications);
      if (current.some((notification) => notification && notification.id === item.id)) return state;

      const isLeadOrRequestNotif =
        item.type === 'LEAD_MATCH' ||
        item.type === 'SERVICE_REQUEST' ||
        item.type === 'QUOTE_RECEIVED';

      return {
        notifications: [item, ...current],
        unreadCount: item.isRead ? (state.unreadCount || 0) : (state.unreadCount || 0) + 1,
        unseenLeadsCount: isLeadOrRequestNotif
          ? (state.unseenLeadsCount || 0) + 1
          : state.unseenLeadsCount || 0,
      };
    }),
  setAvailableLeads: (items) =>
    set({ availableLeads: Array.isArray(items) ? items : [] }),
  addLead: (item) =>
    set((state) => {
      const current = Array.isArray(state.availableLeads) ? state.availableLeads : [];
      return {
        availableLeads: [item, ...current.filter((lead) => lead && lead.id !== item.id)],
        unseenLeadsCount: (state.unseenLeadsCount || 0) + 1,
      };
    }),
  markLeadsAsSeen: () =>
    set({ unseenLeadsCount: 0 }),
  setSubscription: (subscription) =>
    set((state) => {
      if (
        state.subscription?.isPro === subscription?.isPro &&
        state.subscription?.subscription?.id === subscription?.subscription?.id &&
        state.subscription?.subscription?.status === subscription?.subscription?.status
      ) {
        return state;
      }
      return { subscription };
    }),
  markAsRead: (id) =>
    set((state) => {
      const current = normalizeNotifications(state.notifications);
      return {
        notifications: current.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        ),
        unreadCount: Math.max(
          0,
          (state.unreadCount || 0) -
            (current.some((item) => item.id === id && !item.isRead) ? 1 : 0)
        ),
      };
    }),
  toggleRead: (id) =>
    set((state) => {
      const current = normalizeNotifications(state.notifications);
      const target = current.find((item) => item.id === id);
      if (!target) return state;
      const nextRead = !target.isRead;
      return {
        notifications: current.map((item) =>
          item.id === id ? { ...item, isRead: nextRead } : item
        ),
        unreadCount: Math.max(
          0,
          (state.unreadCount || 0) + (nextRead ? -1 : 1)
        ),
      };
    }),
  deleteNotification: (id) =>
    set((state) => {
      const current = normalizeNotifications(state.notifications);
      const target = current.find((item) => item.id === id);
      return {
        notifications: current.filter((item) => item.id !== id),
        unreadCount: Math.max(
          0,
          (state.unreadCount || 0) - (target && !target.isRead ? 1 : 0)
        ),
      };
    }),
  markAllAsRead: () =>
    set((state) => {
      const current = normalizeNotifications(state.notifications);
      return {
        notifications: current.map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      };
    }),
  reset: () => set(initialState),
}));
