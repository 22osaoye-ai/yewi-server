import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useAuthStore } from '@/store/useAuthStore';

export default function SSOCallbackScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, needsProfileCompletion } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (isAuthenticated) {
      if (needsProfileCompletion) {
        router.replace('/auth/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
    } else if (!isSignedIn) {
      router.replace('/auth/login');
    }
  }, [isLoaded, isSignedIn, isAuthenticated, needsProfileCompletion]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8FA' }}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}
