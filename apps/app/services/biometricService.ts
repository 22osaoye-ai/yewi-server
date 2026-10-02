import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserProfile } from '@/domain/auth/auth.types';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './apiClient';
import { authApi } from './authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';

const BIOMETRIC_CREDENTIALS_KEY = 'yewi_biometric_vault';

export type BiometricAuthType = 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'NONE';

export interface BiometricCredentials {
  userId: string;
  email: string;
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  updatedAt: number;
}

export interface BiometricTypeInfo {
  type: BiometricAuthType;
  label: string;
  icon: 'finger-print-outline' | 'scan-outline' | 'eye-outline';
}

class BiometricService {
  private cachedHardware: boolean | null = null;
  private cachedEnrolled: boolean | null = null;
  private cachedTypeInfo: BiometricTypeInfo | null = null;
  private cachedCredentials: BiometricCredentials | null | undefined = undefined;

  /**
   * Comprueba si el hardware del dispositivo soporta biometría.
   */
  async isHardwareSupported(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (this.cachedHardware !== null) return this.cachedHardware;
    try {
      this.cachedHardware = await LocalAuthentication.hasHardwareAsync();
      return this.cachedHardware;
    } catch {
      return false;
    }
  }

  /**
   * Comprueba si hay al menos una huella digital o Face ID registrado en el sistema.
   */
  async isEnrolled(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (this.cachedEnrolled !== null) return this.cachedEnrolled;
    try {
      this.cachedEnrolled = await LocalAuthentication.isEnrolledAsync();
      return this.cachedEnrolled;
    } catch {
      return false;
    }
  }

  /**
   * Determina el tipo de sensor biométrico disponible (Face ID vs Huella vs Iris).
   */
  async getBiometricType(): Promise<BiometricTypeInfo> {
    if (Platform.OS === 'web') {
      return {
        type: 'NONE',
        label: 'Huella digital',
        icon: 'finger-print-outline',
      };
    }
    if (this.cachedTypeInfo !== null) {
      return this.cachedTypeInfo;
    }

    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let info: BiometricTypeInfo;
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        info = {
          type: 'FACE_ID',
          label: Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial',
          icon: 'scan-outline',
        };
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        info = {
          type: 'FINGERPRINT',
          label: 'Huella digital',
          icon: 'finger-print-outline',
        };
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        info = {
          type: 'IRIS',
          label: 'Iris',
          icon: 'eye-outline',
        };
      } else {
        info = {
          type: 'NONE',
          label: 'Huella digital',
          icon: 'finger-print-outline',
        };
      }
      this.cachedTypeInfo = info;
      return info;
    } catch {
      return {
        type: 'NONE',
        label: 'Huella digital',
        icon: 'finger-print-outline',
      };
    }
  }

  /**
   * Dispara el diálogo nativo de autenticación biométrica del sistema operativo.
   */
  async promptBiometric(promptMessage?: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const hasHardware = await this.isHardwareSupported();
    if (!hasHardware) return false;

    const isEnrolled = await this.isEnrolled();
    if (!isEnrolled) return false;

    const { label } = await this.getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Confirma tu ${label} para continuar`,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
      requireConfirmation: false,
    });

    return result.success;
  }

  /**
   * Guarda de forma segura los datos de sesión para acceso biométrico futuro.
   */
  async saveCredentials(
    user: UserProfile,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const activeAccess = accessToken || (await getAccessToken()) || undefined;
      const activeRefresh = refreshToken || (await getRefreshToken()) || undefined;

      const data: BiometricCredentials = {
        userId: user.id,
        email: user.email,
        user,
        accessToken: activeAccess,
        refreshToken: activeRefresh,
        updatedAt: Date.now(),
      };

      this.cachedCredentials = data;

      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('[BiometricService] Error al guardar credenciales biométricas:', error);
    }
  }

  /**
   * Recupera la bóveda de credenciales biométricas almacenadas en SecureStore.
   */
  async getCredentials(): Promise<BiometricCredentials | null> {
    if (Platform.OS === 'web') return null;
    if (this.cachedCredentials !== undefined) {
      return this.cachedCredentials;
    }

    try {
      const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!raw) {
        this.cachedCredentials = null;
        return null;
      }
      const parsed: BiometricCredentials = JSON.parse(raw);
      this.cachedCredentials = parsed;
      return parsed;
    } catch {
      this.cachedCredentials = null;
      return null;
    }
  }

  /**
   * Limpia la bóveda de credenciales biométricas.
   */
  async clearCredentials(): Promise<void> {
    this.cachedCredentials = null;
    if (Platform.OS === 'web') return;

    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    } catch (error) {
      console.warn('[BiometricService] Error al limpiar credenciales biométricas:', error);
    }
  }

  /**
   * Indica si existen credenciales válidas guardadas para acceso biométrico.
   */
  async hasSavedCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return Boolean(creds?.user && creds?.email);
  }

  /**
   * Ejecuta el flujo ultra-rápido de inicio de sesión con huella / Face ID.
   */
  async loginWithBiometrics(): Promise<{
    success: boolean;
    error?: string;
    user?: UserProfile;
  }> {
    if (Platform.OS === 'web') {
      return { success: false, error: 'NO_WEB_SUPPORT' };
    }

    const { biometricsEnabled } = usePreferencesStore.getState();
    if (!biometricsEnabled) {
      return { success: false, error: 'NOT_ENABLED' };
    }

    // 1. Obtener credenciales cacheadas de forma inmediata
    const creds = await this.getCredentials();
    if (!creds?.user) {
      return { success: false, error: 'NO_CREDENTIALS' };
    }

    const { label } = await this.getBiometricType();

    // 2. Disparar el diálogo biométrico de inmediato sin chequeos de hardware redundantes
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: `Acceder a Yewi con ${label}`,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
      requireConfirmation: false, // Instantáneo: evita el retraso de confirmación en Android
    });

    if (!authResult.success) {
      return { success: false, error: authResult.error || 'CANCELLED' };
    }

    // 3. Biometría confirmada exitosamente: restaurar sesión en useAuthStore inmediatamente
    // Desbloqueo ultra-rápido (<50ms) sin bloquear la UI con llamadas HTTP
    const activeAccess = creds.accessToken;
    const activeRefresh = creds.refreshToken;

    await useAuthStore.getState().setAuth(creds.user, activeAccess, activeRefresh);
    useAuthStore.getState().setNeedsProfileCompletion(false);

    // 4. Refresco silencioso de token en segundo plano (fire-and-forget, sin bloquear al usuario)
    if (activeRefresh) {
      authApi
        .refreshTokens(activeRefresh)
        .then(async (refreshed) => {
          if (refreshed?.accessToken) {
            await setAccessToken(refreshed.accessToken);
            if (refreshed.refreshToken) {
              await setRefreshToken(refreshed.refreshToken);
            }
            await this.saveCredentials(
              creds.user,
              refreshed.accessToken,
              refreshed.refreshToken || activeRefresh
            );
          }
        })
        .catch((refreshErr) => {
          console.warn(
            '[BiometricService] Refresco silencioso en background no disponible, usando sesión actual:',
            refreshErr
          );
        });
    }

    return { success: true, user: creds.user };
  }
}

export const biometricService = new BiometricService();
