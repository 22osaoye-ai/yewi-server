import {
  AuthResult,
} from '@/domain/auth/auth.types';
import {
  LoginDto,
  RegisterClientDto,
  RegisterProfessionalDto,
  GoogleLoginDto,
} from '@/domain/auth/auth.dto';
import { authApi } from './authApi';
import { setAccessToken, setRefreshToken, clearTokens } from './apiClient';
import { useAuthStore } from '@/store/useAuthStore';

export class AuthService {
  // 1. Iniciar sesión con email y contraseña en NestJS
  async login(data: LoginDto): Promise<AuthResult> {
    const result = await authApi.login(data);

    if (result.accessToken) await setAccessToken(result.accessToken);
    if (result.refreshToken) await setRefreshToken(result.refreshToken);

    return result;
  }

  // 2. Registro de Cliente en NestJS
  async registerClient(data: RegisterClientDto): Promise<AuthResult> {
    const result = await authApi.registerClient(data);

    if (result.accessToken) await setAccessToken(result.accessToken);
    if (result.refreshToken) await setRefreshToken(result.refreshToken);

    return result;
  }

  // 3. Registro de Profesional en NestJS (Persistencia relacional en PostgreSQL)
  async registerProfessional(data: RegisterProfessionalDto): Promise<AuthResult> {
    const result = await authApi.registerProfessional(data);

    if (result.accessToken) await setAccessToken(result.accessToken);
    if (result.refreshToken) await setRefreshToken(result.refreshToken);

    return result;
  }

  // 4. Autenticación Google OAuth con NestJS Passport
  async loginWithGoogle(credentials: GoogleLoginDto = {}): Promise<AuthResult> {
    const result = await authApi.loginWithGoogle(credentials);

    if (result.accessToken) await setAccessToken(result.accessToken);
    if (result.refreshToken) await setRefreshToken(result.refreshToken);

    return result;
  }

  // 5. Actualizar perfil de usuario
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    country?: string;
    region?: string;
    province?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    bio?: string;
  }): Promise<void> {
    const res = await authApi.updateProfile(data);
    const updatedProfile = res?.data || res;
    useAuthStore.getState().updateUser({
      ...data,
      avatarUrl: updatedProfile?.avatarUrl !== undefined ? updatedProfile.avatarUrl : data.avatarUrl,
    });
  }

  // 6. Cierre de sesión (NestJS Passport + Limpieza de tokens seguros)
  async logout(): Promise<void> {
    await authApi.logout();
    await clearTokens();
  }

  // 7. Eliminar cuenta y datos personales (cumplimiento Apple & Google Play)
  async deleteAccount(): Promise<void> {
    try {
      await authApi.deleteAccount();
    } catch (e) {
      console.warn('Error deleting account from API:', e);
    }
    await useAuthStore.getState().logout();
  }
}

export const authService = new AuthService();
