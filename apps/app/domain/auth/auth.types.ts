export const USER_ROLES = {
  CLIENT: 'CLIENT',
  PROFESSIONAL: 'PROFESSIONAL',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface AddressInfo {
  city: string;
  address?: string;
  postalCode?: string;
  province?: string;
  region?: string;
}

export interface ProfessionalDetails {
  businessName?: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  serviceRadiusKm?: number;
  address?: AddressInfo;
  taxId?: string; // NIF / CIF
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatarUrl?: string;
  phoneNumber?: string;
  country?: string;
  region?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  bio?: string;
  isEmailVerified?: boolean;
  isPro?: boolean;
  professionalProfile?: ProfessionalDetails;
  createdAt?: string;
  updatedAt?: string;
}


export interface AuthResult {
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
}
