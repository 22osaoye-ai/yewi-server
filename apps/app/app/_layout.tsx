import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/components/Theme';
import { ToastProvider } from '../src/components/Toast';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useAuthStore } from '../src/store/auth.store';
import { useChatStore } from '../src/store/chat.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { loadPersistedAuth, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useChatStore();

  const [fontsLoaded] = useFonts({
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
  });

  useEffect(() => {
    loadPersistedAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated]);


  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <StatusBar style="dark" backgroundColor={Colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/select-role" />
              <Stack.Screen name="(auth)/register-client" />
              <Stack.Screen name="(auth)/register-pro" />
              <Stack.Screen name="(auth)/register" />
              <Stack.Screen name="categories" />
              <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(pro)" />
              <Stack.Screen
                name="gigs/[id]"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="requests/new"
                options={{
                  headerShown: true,
                  title: 'Publicar Solicitud',
                  headerTintColor: Colors.text,
                  headerStyle: { backgroundColor: Colors.background },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: true,
                  title: 'Chat & Presupuestos',
                  headerTintColor: Colors.text,
                  headerStyle: { backgroundColor: Colors.background },
                  headerShadowVisible: false,
                }}
              />
            </Stack>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
