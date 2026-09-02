import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';

export function ClerkAuthSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const wasSignedInWithClerk = useRef(false);
  const isSyncing = useRef(false);
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (isSyncing.current || lastSyncedId.current === user.id) return;
      isSyncing.current = true;
      wasSignedInWithClerk.current = true;

      (async () => {
        try {
          const email = user.primaryEmailAddress?.emailAddress || `${user.id}@clerk.user`;
          const fullName =
            user.fullName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Usuario';
          const token = await getToken().catch(() => null);

          let backendUser: any = null;
          let accessToken: string | undefined = token || undefined;
          let refreshToken: string | undefined = undefined;

          // Intentar sincronización con el backend NestJS
          try {
            const backendResult = await authService.loginWithGoogle({
              email,
              name: fullName,
              avatarUrl: user.imageUrl,
              idToken: token || undefined,
            });

            if (backendResult?.user) {
              backendUser = backendResult.user;
              accessToken = backendResult.accessToken || accessToken;
              refreshToken = backendResult.refreshToken;
            }
          } catch (syncError) {
            console.warn('[ClerkAuthSync] Sincronización backend falló, usando perfil local de Clerk:', syncError);
          }

          // Si el backend no respondió o falló, construir perfil seguro a partir de Clerk
          if (!backendUser) {
            const names = fullName.split(' ');
            backendUser = {
              id: user.id,
              email,
              firstName: user.firstName || names[0] || 'Usuario',
              lastName: user.lastName || names.slice(1).join(' ') || '',
              roles: ['CLIENT'],
              avatarUrl: user.imageUrl,
              phoneNumber: user.primaryPhoneNumber?.phoneNumber,
            };
          }

          await useAuthStore.getState().setAuth(
            backendUser,
            accessToken,
            refreshToken
          );
          useAuthStore.getState().setNeedsProfileCompletion(false);
          lastSyncedId.current = user.id;
        } catch (e) {
          console.error('[ClerkAuthSync] Error crítico al sincronizar sesión:', e);
          useAuthStore.setState({ isLoading: false });
        } finally {
          isSyncing.current = false;
        }
      })();
    } else if (!isSignedIn && wasSignedInWithClerk.current) {
      wasSignedInWithClerk.current = false;
      lastSyncedId.current = null;
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout();
      }
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

export default ClerkAuthSync;

