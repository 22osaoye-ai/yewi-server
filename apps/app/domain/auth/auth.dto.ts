import { AddressInfo, UserRole } from './auth.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterClientDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface RegisterProfessionalDto extends RegisterClientDto {
  businessName?: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  serviceRadiusKm?: number;
  address?: AddressInfo;
  taxId?: string; // NIF / CIF
}

export interface GoogleLoginDto {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface PhoneOtpVerifyDto {
  phoneNumber: string;
  code: string;
}
