import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export function useProtectedAction() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const runProtectedAction = (action: () => void, redirectOnFail = true) => {
    if (isAuthenticated) {
      action();
    } else {
      if (redirectOnFail) {
        router.push('/auth/login');
      }
    }
  };

  return {
    isAuthenticated,
    runProtectedAction,
  };
}
