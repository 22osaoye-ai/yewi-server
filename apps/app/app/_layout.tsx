import { ClerkProvider, useAuth } from '@clerk/expo';
import { requireOptionalNativeModule } from 'expo';
import * as SecureStore from 'expo-secure-store';
import "./global.css";

// Safely load Clerk passkeys if native module is present in the current runtime
let passkeys: any = undefined;
if (requireOptionalNativeModule('ClerkExpoPasskeys')) {
  try {
    passkeys = require('@clerk/expo/passkeys').passkeys;
  } catch {
    passkeys = undefined;
  }
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode to eliminate render warnings with React Compiler
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ClerkAuthSync } from '@/components/auth/ClerkAuthSync';
import { useAuthStore } from '@/store/useAuthStore';
import { realtimeService } from '@/services/realtimeService';
import { notificationService } from '@/services/notificationService';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { AnimatedSplashOverlay } from '@/components/ui/AnimatedSplashOverlay';
import { warmUpBackend } from '@/services/apiClient';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {});

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



function RootNavigation({ isFontsReady }: { isFontsReady: boolean }) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isAuthenticated, isLoading, hasSeenOnboarding, needsProfileCompletion } = useAuthStore();

  const isNavigationReady = Boolean(navigationState?.key);

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    }
  }, []);

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
    if (!isNavigationReady || isLoading || !isClerkLoaded) return;

    // Si Clerk ya tiene sesión activa pero el store de Zustand aún está sincronizando, esperar sin redirigir al login
    if (isSignedIn && !isAuthenticated) return;

    const segList = segments as string[];
    const inTabsGroup = segList[0] === '(tabs)';

    // Si el usuario ya está autenticado y navegando dentro de (tabs), nunca interferir ni redirigir
    if (inTabsGroup && (isAuthenticated || isSignedIn)) {
      return;
    }

    const inAuthGroup = segList[0] === 'auth';
    const isSsoCallback = segList[0] === 'sso-callback';
    const isAtRoot = segList.length === 1 && (segList[0] === 'index' || !segList[0]);

    const timeout = setTimeout(() => {
      if (isAuthenticated) {
        if (needsProfileCompletion) {
          if (segList[1] !== 'complete-profile') {
            router.replace('/auth/complete-profile');
          }
        } else if (inAuthGroup || isAtRoot || isSsoCallback) {
          // Si está autenticado y en auth, root o sso-callback, navegar a tabs
          router.replace('/(tabs)');
        }
      } else {
        // No autenticado: redirigir a login u onboarding solo si no está en proceso de SSO ni firmado en Clerk ni en Zustand
        if (!inAuthGroup && !isSsoCallback && !isSignedIn && !useAuthStore.getState().isAuthenticated) {
          if (hasSeenOnboarding) {
            router.replace('/auth/login');
          } else {
            if (segList.length > 0 && !isAtRoot) {
              router.replace('/');
            }
          }
        }
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [isNavigationReady, isLoading, isClerkLoaded, isSignedIn, isAuthenticated, hasSeenOnboarding, needsProfileCompletion, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail" options={{ headerShown: false }} />
        <Stack.Screen name="request-detail" options={{ headerShown: false }} />
        <Stack.Screen name="professional-profile" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="publish" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-review" options={{ headerShown: false, animation: 'slide_from_bottom' }} />

        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ToastContainer />
    </ThemeProvider>
  );
}

// Deduplicate font file references to avoid redundant asset processing in Metro
const fontLight = require('../assets/fonts/PlusJakartaSans-Light.ttf');
const fontRegular = require('../assets/fonts/PlusJakartaSans-Regular.ttf');
const fontMedium = require('../assets/fonts/PlusJakartaSans-Medium.ttf');
const fontSemiBold = require('../assets/fonts/PlusJakartaSans-SemiBold.ttf');
const fontBold = require('../assets/fonts/PlusJakartaSans-Bold.ttf');
const fontExtraBold = require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf');

export default function RootLayout() {
  const isInitialLoading = useAuthStore((state) => state.isLoading);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [loaded, error] = useFonts({
    'PlusJakartaSans-Light': fontLight,
    'PlusJakartaSans-Regular': fontRegular,
    'PlusJakartaSans-Medium': fontMedium,
    'PlusJakartaSans-SemiBold': fontSemiBold,
    'PlusJakartaSans-Bold': fontBold,
    'PlusJakartaSans-ExtraBold': fontExtraBold,
    // Alias GoogleSans
    'GoogleSans-Regular': fontRegular,
    'GoogleSans-Medium': fontMedium,
    'GoogleSans-Bold': fontBold,
    // Alias de retrocompatibilidad Satoshi para renderizado inmediato
    'Satoshi-Light': fontLight,
    'Satoshi-Regular': fontRegular,
    'Satoshi-Medium': fontMedium,
    'Satoshi-Bold': fontBold,
    'Satoshi-Black': fontExtraBold,
  });

  const isFontsReady = Boolean(loaded || error);

  useEffect(() => {
    if (!isInitialLoading) {
      setHasBootstrapped(true);
    }
  }, [isInitialLoading]);

  useEffect(() => {
    warmUpBackend();
  }, []);

  useEffect(() => {
    if (isFontsReady && hasBootstrapped) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isFontsReady, hasBootstrapped]);

  if (!isFontsReady || (!hasBootstrapped && isInitialLoading)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#09090B',
        }}
      >
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnimatedSplashOverlay isReady={isFontsReady && hasBootstrapped} />
      <ClerkProvider
        publishableKey={publishableKey}
        tokenCache={tokenCache}
        {...(passkeys ? { __experimental_passkeys: passkeys } : {})}
      >
        <ClerkAuthSync />
        <RootNavigation isFontsReady={isFontsReady} />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
