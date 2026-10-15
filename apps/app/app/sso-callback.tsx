import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth, useUser } from '@clerk/expo';
import { useAuthStore, UserProfile } from '@/store/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallbackScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { isAuthenticated, needsProfileCompletion } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (isAuthenticated) {
      if (needsProfileCompletion) {
        router.replace('/auth/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (isSignedIn) {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        'usuario@yewi.app';
      const fallbackUser: UserProfile = {
        id: user?.id || 'clerk-user',
        email,
        firstName: user?.firstName || (email.includes('@') ? email.split('@')[0] : 'Usuario'),
        lastName: user?.lastName || '',
        roles: ['CLIENT'],
        avatarUrl: user?.imageUrl,
      };
      useAuthStore.getState().setAuth(fallbackUser).then(() => {
        router.replace('/(tabs)');
      });
      return;
    }

    // Esperar unos segundos a que Clerk y ClerkAuthSync completen la sesión antes de salir
    const fallbackTimer = setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace('/auth/login');
      }
    }, 4000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoaded, isSignedIn, isAuthenticated, needsProfileCompletion]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F0F' }}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}
