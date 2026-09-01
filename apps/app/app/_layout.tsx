import { ClerkProvider, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import "./global.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ClerkAuthSync } from '@/components/auth/ClerkAuthSync';
import { useAuthStore } from '@/store/useAuthStore';
import { realtimeService } from '@/services/realtimeService';
import { notificationService } from '@/services/notificationService';
import { ToastContainer } from '@/components/ui/ToastContainer';

WebBrowser.maybeCompleteAuthSession();

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Y2VydGFpbi1zYWlsZmlzaC00MjcwLmNsZXJrLmFjY291bnRzLmRldiQ';

if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  console.warn('[Clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no está definido en .env, utilizando fallback de desarrollo');
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignored
    }
  },
};



function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, hasSeenOnboarding, needsProfileCompletion } = useAuthStore();

  const isNavigationReady = Boolean(navigationState?.key);
  const isAppReady = !isLoading && isNavigationReady;



  useEffect(() => {
    notificationService.init().catch(() => {});
    if (isAuthenticated) {
      realtimeService.start();
      notificationService.requestPermissions().catch(() => {});
    } else {
      realtimeService.stop();
    }
    return () => realtimeService.stop();
  }, [isAuthenticated]);

  useEffect(() => {
    const Notifications = notificationService.getNotifications();
    if (!Notifications) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data) {
        notificationService.navigateFromNotificationData(data, router);
      }
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response: any) => {
        if (response) {
          const data = response?.notification?.request?.content?.data;
          if (data) {
            notificationService.navigateFromNotificationData(data, router);
          }
        }
      })
      .catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!isAppReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAppRoute = [
      'notifications',
      'detail',
      'request-detail',
      'chat',
      'vouchers',
      'professional-profile',
      'subscription',
    ].includes(String(segments[0] ?? ''));

    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        if (needsProfileCompletion) {
          if (segments[1] !== 'complete-profile') {
            router.replace('/auth/complete-profile');
          }
        } else {
          if (!inTabsGroup && !inAppRoute) {
            router.replace('/(tabs)');
          }
        }
      } else {
        if (hasSeenOnboarding) {
          if (!inAuthGroup && !inAppRoute && !inTabsGroup) {
            router.replace('/auth/login');
          }
        }
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [isAppReady, isAuthenticated, hasSeenOnboarding, needsProfileCompletion, segments]);

  if (!isAppReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? '#09090B' : '#F8F8FA',
        }}
      >
        <ActivityIndicator size="large" color="#C87D20" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail" options={{ headerShown: false }} />
        <Stack.Screen name="request-detail" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="professional-profile" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" options={{ headerShown: false }} />
        <Stack.Screen name="vouchers" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />

        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style="light" />
      <ToastContainer />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { isLoading } = useAuthStore();
  const [loaded, error] = useFonts({
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.ttf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
  });

  useEffect(() => {
    if ((loaded || error) && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error, isLoading]);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkAuthSync />
        <RootNavigation />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
