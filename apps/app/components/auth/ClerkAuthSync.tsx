import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { UserProfile } from '@/domain/auth/auth.types';

// Bloqueo y caché a nivel de módulo para evitar bucles de sincronización ante re-renders o hot-reloads
let moduleLastSyncedId: string | null = null;
let moduleIsSyncing = false;
let moduleLastSyncTime = 0;

export function ClerkAuthSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const wasSignedInWithClerk = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const now = Date.now();
      // Si ya se está sincronizando o se sincronizó hace menos de 30s para este usuario, no repetir
      if (
        moduleIsSyncing ||
        (moduleLastSyncedId === user.id && now - moduleLastSyncTime < 30000)
      ) {
        return;
      }

      moduleIsSyncing = true;
      moduleLastSyncedId = user.id;
      moduleLastSyncTime = now;
      wasSignedInWithClerk.current = true;

      (async () => {
        try {
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            `${user.id}@clerk.user`;

          // Buscar cuenta externa de Google vinculada
          const googleAccount = user.externalAccounts?.find(
            (acc: any) => acc.provider === 'google' || acc.provider === 'oauth_google'
          ) as any;

          const firstName =
            user.firstName ||
            googleAccount?.firstName ||
            '';

          const lastName =
            user.lastName ||
            googleAccount?.lastName ||
            '';

          const resolvedFullName =
            user.fullName ||
            (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName) ||
            user.username ||
            googleAccount?.username ||
            (email.includes('@') ? email.split('@')[0].replace(/[._-]+/g, ' ') : '');

          const token = await getToken().catch(() => null);

          let backendUser: any = null;
          let accessToken: string | undefined = undefined;
          let refreshToken: string | undefined = undefined;

          // Intentar sincronización con el backend NestJS
          try {
            const backendResult = await authService.loginWithGoogle({
              email,
              name: resolvedFullName,
              avatarUrl: user.imageUrl || googleAccount?.avatarUrl,
              idToken: token || undefined,
            });

            if (backendResult?.user) {
              backendUser = backendResult.user;
              accessToken = backendResult.accessToken;
              refreshToken = backendResult.refreshToken;
            }
          } catch (syncError) {
            console.warn(
              '[ClerkAuthSync] Backend no disponible temporalmente (ej. arranque en Render):',
              (syncError as any)?.message || syncError
            );
          }

          if (backendUser && accessToken) {
            await useAuthStore.getState().setAuth(
              backendUser,
              accessToken,
              refreshToken
            );
            useAuthStore.getState().setNeedsProfileCompletion(false);
          } else {
            // Sesión autenticada en Clerk: configurar usuario real de Clerk sin token ficticio para evitar 401
            const fallbackUser: UserProfile = {
              id: user.id,
              email,
              firstName: firstName || (resolvedFullName ? resolvedFullName.split(' ')[0] : 'Usuario'),
              lastName: lastName || (resolvedFullName ? resolvedFullName.split(' ').slice(1).join(' ') : ''),
              roles: ['CLIENT'],
              avatarUrl: user.imageUrl || googleAccount?.avatarUrl,
            };
            await useAuthStore.getState().setAuth(fallbackUser);
            useAuthStore.getState().setNeedsProfileCompletion(false);
          }
        } catch (e) {
          console.error('[ClerkAuthSync] Error al procesar sesión:', e);
        } finally {
          moduleIsSyncing = false;
        }
      })();
    } else if (!isSignedIn && wasSignedInWithClerk.current) {
      wasSignedInWithClerk.current = false;
      moduleLastSyncedId = null;
      moduleLastSyncTime = 0;
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout().catch(() => {});
      }
    }
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}

export default ClerkAuthSync;

