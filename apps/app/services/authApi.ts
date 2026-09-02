import { apiRequest } from './apiClient';
import {
  AuthResult,
  UserProfile,
  USER_ROLES,
  UserRole,
} from '@/domain/auth/auth.types';
import {
  LoginDto,
  RegisterClientDto,
  RegisterProfessionalDto,
  GoogleLoginDto,
  PhoneOtpVerifyDto,
} from '@/domain/auth/auth.dto';

interface BackendAuthResponse {
  user?: {
    id: string;
    email: string;
    roles?: UserRole[];
    profile?: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string;
      phoneNumber?: string;
      city?: string;
      postalCode?: string;
      address?: string;
    };
    professionalProfile?: {
      businessName?: string;
      bio?: string;
      skills?: string[];
      hourlyRate?: number;
      serviceRadiusKm?: number;
      city?: string;
      postalCode?: string;
      taxId?: string;
      kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    };
  };
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: string;
}

function mapBackendResponse(rawRes: any): AuthResult {
  const payload: BackendAuthResponse = (rawRes?.data || rawRes) as BackendAuthResponse;
  const user = payload?.user;
  const profile = user?.profile;
  const proProfile = user?.professionalProfile;

  if (!user?.id || !user.email || !Array.isArray(user.roles)) {
    throw new Error('La respuesta de autenticación del servidor no es válida.');
  }
  if (!payload.accessToken || !payload.refreshToken) {
    throw new Error('La respuesta de autenticación no contiene una sesión válida.');
  }

  const domainUser: UserProfile = {
    id: user.id,
    email: user.email,
    firstName: profile?.firstName ?? profile?.displayName?.split(' ')[0] ?? '',
    lastName: profile?.lastName ?? profile?.displayName?.split(' ').slice(1).join(' ') ?? '',
    roles: user.roles,
    avatarUrl: profile?.avatarUrl,
    phoneNumber: profile?.phoneNumber,
    country: (profile as any)?.country,
    city: profile?.city,
    postalCode: profile?.postalCode,
    address: profile?.address,
    professionalProfile: proProfile
      ? {
          businessName: proProfile.businessName,
          bio: proProfile.bio,
          skills: proProfile.skills || [],
          hourlyRate: proProfile.hourlyRate,
          serviceRadiusKm: proProfile.serviceRadiusKm,
          taxId: proProfile.taxId,
          kycStatus: proProfile.kycStatus,
          address: {
            city: proProfile.city || profile?.city || '',
            postalCode: proProfile.postalCode || profile?.postalCode || '',
            address: profile?.address,
          },
        }
      : undefined,
  };

  return {
    user: domainUser,
    accessToken: payload?.accessToken,
    refreshToken: payload?.refreshToken,
  };
}

export const authApi = {
  // 1. Iniciar sesión con email y contraseña en NestJS Passport
  async login(dto: LoginDto): Promise<AuthResult> {
    const res = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return mapBackendResponse(res);
  },

  // 2. Registrar cliente en NestJS
  async registerClient(dto: RegisterClientDto): Promise<AuthResult> {
    const res = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        roles: [USER_ROLES.CLIENT],
      }),
    });
    const result = mapBackendResponse(res);
    result.isNewUser = true;
    return result;
  },

  // 3. Registrar profesional en NestJS
  async registerProfessional(dto: RegisterProfessionalDto): Promise<AuthResult> {
    const res = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        roles: [USER_ROLES.PROFESSIONAL],
        businessName: dto.businessName,
        bio: dto.bio || 'Profesional de servicios en Yewi',
        skills: dto.skills || [],
        hourlyRate: dto.hourlyRate,
        serviceRadiusKm: dto.serviceRadiusKm,
        city: dto.address?.city,
        postalCode: dto.address?.postalCode,
        address: dto.address?.address,
      }),
    });
    const result = mapBackendResponse(res);
    result.isNewUser = true;
    return result;
  },

  // 4. Autenticación con Google en NestJS Passport
  async loginWithGoogle(dto: GoogleLoginDto): Promise<AuthResult> {
    const res = await apiRequest<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: dto.idToken,
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      }),
    });
    return mapBackendResponse(res);
  },

  // 5. Enviar SMS OTP en NestJS
  async sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const res = await apiRequest<any>('/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
    const payload = res?.data || res;
    return {
      success: payload.success === true,
      message: typeof payload.message === 'string' ? payload.message : '',
    };
  },

  // 6. Verificar SMS OTP y obtener sesión NestJS
  async verifyPhoneOtp(dto: PhoneOtpVerifyDto): Promise<AuthResult> {
    const res = await apiRequest<any>('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: dto.phoneNumber,
        code: dto.code,
      }),
    });
    return mapBackendResponse(res);
  },

  // 7. Refrescar token en NestJS
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await apiRequest<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    const payload = res?.data || res;
    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
  },

  // 8. Cerrar sesión en NestJS
  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
  },

  // 9. Actualizar perfil en NestJS
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
  }): Promise<any> {
    return apiRequest('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 10. Eliminar cuenta y datos personales (cumplimiento Apple & Google Play)
  async deleteAccount(): Promise<void> {
    await apiRequest('/users/me', {
      method: 'DELETE',
    });
  },
};
