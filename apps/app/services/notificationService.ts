import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Safe dynamic accessor for Notifications in Expo Go (SDK 53/54+)
let Notifications: typeof import('expo-notifications') | null = null;

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo' ||
  !Constants.expoConfig;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications?.AndroidNotificationPriority?.HIGH,
        }),
      });
    }
  } catch (e) {
    // Gracefully ignored
  }
}

export const notificationService = {
  // 1. Initialize Android notification channels (MANDATORY for Android 8.0+)
  async init(): Promise<void> {
    if (!Notifications || isExpoGo) return;

    try {
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones Yewi',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C87D20',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Pedidos y Presupuestos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 300, 150, 300],
          lightColor: '#C87D20',
          sound: 'default',
        });
      }
    } catch (e) {
      console.warn('Channel init note:', e);
    }
  },

  // 2. Request permissions for push & local notifications
  async requestPermissions(): Promise<boolean> {
    if (!Notifications) return true;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Permission request note:', e);
      return true;
    }
  },

  // 3. Get Expo Push Token for remote push notifications (requires development build / EAS in production)
  async getPushToken(): Promise<string | null> {
    if (!Notifications || isExpoGo) {
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      await this.init();

      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      return tokenData?.data || null;
    } catch (e) {
      return null;
    }
  },

  // 4. Send an immediate Local Notification (Falls back to Haptic & In-app alert in Expo Go)
  async sendLocalNotification(params: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }): Promise<string | null> {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (!Notifications || isExpoGo) {
      return 'local-simulated-notification';
    }

    try {
      await this.init();
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: params.data || {},
          sound: 'default',
          color: '#C87D20',
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Local notification note:', e);
      return null;
    }
  },

  // 5. Schedule a timed Local Notification
  async scheduleTimedNotification(params: {
    title: string;
    body: string;
    seconds: number;
    data?: Record<string, any>;
  }): Promise<string | null> {
    if (!Notifications || isExpoGo) {
      return null;
    }

    try {
      await this.init();
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: params.data || {},
          sound: 'default',
          color: '#C87D20',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(params.seconds, 1),
          repeats: false,
        },
      });
    } catch (e) {
      return null;
    }
  },

  // 6. Navigate from notification response data
  navigateFromNotificationData(data: any, router: { push: (route: any) => void }): void {
    if (!data || typeof data !== 'object') {
      router.push('/notifications');
      return;
    }

    const conversationId = data.conversationId;
    const leadId = data.leadId || data.requestId;
    const orderId = data.orderId;
    const link = typeof data.link === 'string' ? data.link : '';

    if (conversationId) {
      router.push({ pathname: '/chat', params: { conversationId } });
      return;
    }

    if (leadId) {
      router.push({ pathname: '/request-detail', params: { id: leadId } });
      return;
    }

    if (orderId) {
      router.push({ pathname: '/detail', params: { id: orderId } });
      return;
    }

    if (link) {
      if (link.startsWith('/chat')) {
        const match = link.match(/conversationId=([^&]+)/);
        if (match) {
          router.push({ pathname: '/chat', params: { conversationId: match[1] } });
          return;
        }
        router.push('/chat');
        return;
      }

      if (link.startsWith('/requests') || link.startsWith('/request-detail')) {
        const match = link.match(/[?&]id=([^&]+)/) || link.match(/\/requests\/([^?&]+)/);
        if (match) {
          router.push({ pathname: '/request-detail', params: { id: match[1] } });
          return;
        }
        router.push('/(tabs)/requests');
        return;
      }

      if (link.startsWith('/orders') || link.startsWith('/detail')) {
        const match = link.match(/[?&]id=([^&]+)/) || link.match(/\/orders\/([^?&]+)/);
        if (match) {
          router.push({ pathname: '/detail', params: { id: match[1] } });
          return;
        }
        router.push('/(tabs)/orders');
        return;
      }

      if (link === '/vouchers') {
        router.push('/vouchers');
        return;
      }

      if (link.startsWith('/')) {
        router.push(link as any);
        return;
      }
    }

    router.push('/notifications');
  },

  getNotifications() {
    return Notifications;
  },
};
