import { AppState, AppStateStatus, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { leadsApi, ServiceRequestItem } from './leadsApi';
import { notificationsApi, NotificationItem } from './notificationsApi';
import { paymentsApi, SubscriptionStatusResponse } from './paymentsApi';
import { getAccessToken, getActiveApiBaseUrl } from './apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useRealtimeStore } from '@/store/useRealtimeStore';
import { notificationService } from './notificationService';

export const REALTIME_EVENTS = [
  'notification:new',
  'lead:new',
  'subscription:updated',
  'status:new',
  'status:comment:new',
  'status:reaction:update',
  'chat:message:new',
  'chat:message:reaction',
  'chat:conversation:update',
  'user_typing',
] as const;
export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];
export const REALTIME_NAMESPACE = '/realtime';
export const realtimeUserRoom = (userId: string) => `user:${userId}`;

const POLL_INTERVAL_MS = 30_000;

export const getRealtimeUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/api\/v\d+\/?$/, '');
  }
  const apiBase = getActiveApiBaseUrl();
  return apiBase.replace(/\/api\/v\d+\/?$/, '');
};

class RealtimeService {
  private socket: Socket | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private started = false;
  private polling = false;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  emitSocketEvent(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  private dispatchToSubscribers(event: string, data: any) {
    const subs = this.eventListeners.get(event);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch {}
      });
    }
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    if (AppState.currentState === 'active') {
      this.connect();
      this.resync();
      this.startPolling();
    }
  }

  stop() {
    this.started = false;
    this.stopPolling();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    useRealtimeStore.getState().reset();
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active' && this.started) {
      this.connect();
      this.resync();
      this.startPolling();
    } else if (state !== 'active') {
      this.stopPolling();
      this.socket?.disconnect();
    }
  };

  private startPolling() {
    this.stopPolling();
    this.timer = setInterval(() => this.resync(), POLL_INTERVAL_MS);
  }

  private stopPolling() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async connect() {
    const token = await getAccessToken();
    if (!token || !this.started || AppState.currentState !== 'active') return;

    if (this.socket) {
      this.socket.auth = { token };
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    const socket = io(`${getRealtimeUrl()}${REALTIME_NAMESPACE}`, {
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });

    socket.on('notification:new', (payload: NotificationItem) => {
      const userId = useAuthStore.getState().user?.id;
      if (payload?.userId && userId && payload.userId !== userId) {
        console.warn('Ignoring notification for another user');
        return;
      }
      this.emit('notification:new', payload);
    });
    socket.on('lead:new', (payload: ServiceRequestItem) => this.emit('lead:new', payload));
    socket.on('subscription:updated', (payload: SubscriptionStatusResponse & { userId: string }) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId || payload?.userId !== userId) return;
      this.emit('subscription:updated', payload);
    });
    socket.on('status:new', (payload: any) => {
      this.dispatchToSubscribers('status:new', payload);
    });
    socket.on('status:comment:new', (payload: any) => {
      this.dispatchToSubscribers('status:comment:new', payload);
    });
    socket.on('status:reaction:update', (payload: any) => {
      this.dispatchToSubscribers('status:reaction:update', payload);
    });
    socket.on('chat:message:new', (payload: any) => {
      this.dispatchToSubscribers('chat:message:new', payload);
    });
    socket.on('chat:message:reaction', (payload: any) => {
      this.dispatchToSubscribers('chat:message:reaction', payload);
    });
    socket.on('chat:conversation:update', (payload: any) => {
      this.dispatchToSubscribers('chat:conversation:update', payload);
    });
    socket.on('user_typing', (payload: any) => {
      this.dispatchToSubscribers('user_typing', payload);
    });
    socket.on('connect_error', async () => {
      const latestToken = await getAccessToken();
      if (latestToken && socket.auth && (socket.auth as { token?: string }).token !== latestToken) {
        socket.auth = { token: latestToken };
        socket.connect();
      }
    });
    this.socket = socket;
  }

  private async resync() {
    if (this.polling || !this.started || AppState.currentState !== 'active') return;
    if (!(await getAccessToken()) || !useAuthStore.getState().isAuthenticated) return;

    this.polling = true;
    try {
      const user = useAuthStore.getState().user;
      const requests: Promise<unknown>[] = [this.refreshNotifications(), this.refreshSubscription()];
      if (user?.roles?.includes('PROFESSIONAL')) requests.push(this.refreshLeads());
      await Promise.allSettled(requests);
    } finally {
      this.polling = false;
    }
  }

  private async refreshNotifications() {
    const [items, count] = await Promise.all([
      notificationsApi.getMyNotifications(),
      notificationsApi.getUnreadCount(),
    ]);
    useRealtimeStore.getState().setNotifications(items, count?.unreadCount);
  }

  private async refreshLeads() {
    const items = await leadsApi.getAvailableLeads();
    useRealtimeStore.getState().setAvailableLeads(Array.isArray(items) ? items : []);
  }

  private async refreshSubscription() {
    const subscription = await paymentsApi.getSubscriptionStatus();
    this.emit('subscription:updated', {
      userId: useAuthStore.getState().user?.id || '',
      ...subscription,
    });
  }

  private emit(name: 'notification:new', payload: NotificationItem): void;
  private emit(name: 'lead:new', payload: ServiceRequestItem): void;
  private emit(name: 'subscription:updated', payload: SubscriptionStatusResponse & { userId: string }): void;
  private emit(name: RealtimeEventName, payload: any) {
    const store = useRealtimeStore.getState();
    if (name === 'notification:new') {
      store.addNotification(payload);
      notificationService
        .sendLocalNotification({
          title: payload?.title || 'Nueva notificación',
          body: payload?.message || '',
          data: {
            ...(payload?.metadata || {}),
            link: payload?.link,
            notificationId: payload?.id,
          },
          channelId: 'default',
        })
        .catch(() => {});
    }
    if (name === 'lead:new') {
      store.addLead(payload);
      notificationService
        .sendLocalNotification({
          title: '🎯 Nueva solicitud de servicio',
          body: payload?.title
            ? `${payload.title}${payload.category?.name ? ` • ${payload.category.name}` : ''}`
            : 'Hay un nuevo requerimiento disponible.',
          data: {
            leadId: payload?.id,
            requestId: payload?.id,
            link: `/request-detail?id=${payload?.id}`,
          },
          channelId: 'orders',
        })
        .catch(() => {});
    }
    if (name === 'subscription:updated') {
      if (typeof payload?.isPro !== 'boolean') return;
      store.setSubscription(payload);
    }
  }
}

export const realtimeService = new RealtimeService();
