import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // En Web o URLs de producción remotas
  if (Platform.OS === 'web' || (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))) {
    return envUrl || 'http://localhost:3000/api/v1';
  }

  // En dispositivo móvil físico con Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    return `http://${hostIp}:3000/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }

  return envUrl || 'http://localhost:3000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de Petición: Añadir Access Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@yewi_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignorar error de lectura local
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de Respuesta: Refresco automático con Refresh Token en caso de 401
api.interceptors.response.use(
  (response) => {
    // Si la respuesta viene envuelta por nuestro TransformResponseInterceptor
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data; // Devuelve el data directamente
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@yewi_refresh_token');
        if (!refreshToken) {
          await AsyncStorage.multiRemove(['@yewi_access_token', '@yewi_refresh_token', '@yewi_user']);
          return Promise.reject(error);
        }

        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

        if (newAccessToken) {
          await AsyncStorage.setItem('@yewi_access_token', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('@yewi_refresh_token', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch {
        await AsyncStorage.multiRemove(['@yewi_access_token', '@yewi_refresh_token', '@yewi_user']);
      }
    }

    return Promise.reject(error);
  },
);
