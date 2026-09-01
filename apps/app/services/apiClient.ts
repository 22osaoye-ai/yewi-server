import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let activeApiBaseUrl: string | null = process.env.EXPO_PUBLIC_API_URL || null;

export const getDevCandidates = (): string[] => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  const lanHost = hostUri ? hostUri.split(':')[0] : '192.168.1.17';
  const lanUrl = `http://${lanHost}:3000/api/v1`;

  if (Platform.OS === 'android') {
    const list = [
      envUrl,
      lanUrl,
      `http://127.0.0.1:3000/api/v1`,
      `http://10.0.2.2:3000/api/v1`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }

  const list = [
    envUrl,
    lanUrl,
    `http://127.0.0.1:3000/api/v1`,
    `http://localhost:3000/api/v1`,
  ].filter(Boolean) as string[];
  return Array.from(new Set(list));
};

export const getActiveApiBaseUrl = (): string => {
  if (activeApiBaseUrl) return activeApiBaseUrl;
  const candidates = getDevCandidates();
  return candidates[0];
};

export const API_BASE_URL = getActiveApiBaseUrl();

const TOKEN_KEY = 'yewi_access_token';
const REFRESH_TOKEN_KEY = 'yewi_refresh_token';

// Secure storage helpers
export async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch {}
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  } catch {}
}

export async function clearTokens(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

// Universal fetch wrapper
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isFullUrl = endpoint.startsWith('http');
  const currentBase = getActiveApiBaseUrl();
  const url = isFullUrl ? endpoint : `${currentBase}${endpoint}`;

  let response: Response | undefined;
  let lastNetworkError: any = null;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    lastNetworkError = networkError;
  }

  // Si falló por red, probar los otros candidatos (ADB reverse / Wi-Fi)
  if (!response) {
    const candidates = getDevCandidates();
    for (const candidate of candidates) {
      if (candidate === currentBase) continue;
      try {
        const candidateUrl = isFullUrl
          ? endpoint.replace(currentBase, candidate)
          : `${candidate}${endpoint}`;
        const testRes = await fetch(candidateUrl, {
          ...options,
          headers,
        });
        if (testRes) {
          activeApiBaseUrl = candidate;
          response = testRes;
          break;
        }
      } catch (err) {
        lastNetworkError = err;
      }
    }
  }

  if (!response) {
    console.error(`[API Network Error] URL: ${url}`, lastNetworkError);
    throw new Error(
      `No se pudo conectar con el servidor backend (${url}). Verifica que el backend esté en ejecución y conectado vía Wi-Fi o USB.`
    );
  }

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshPayload = await refreshResponse.json();
          const refreshData =
            refreshPayload &&
            typeof refreshPayload === 'object' &&
            'data' in refreshPayload
              ? refreshPayload.data
              : refreshPayload;
          await setAccessToken(refreshData.accessToken);
          await setRefreshToken(refreshData.refreshToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          await clearTokens();
        }
      } catch {
        await clearTokens();
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
  }

  // The backend wraps successful responses in { success, data, ... }.
  // Keep compatibility with endpoints that already return an unwrapped payload.
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.prototype.hasOwnProperty.call(data, 'data') &&
    (data.success === true || typeof data.statusCode === 'number')
  ) {
    return data.data as T;
  }

  return data as T;
}
