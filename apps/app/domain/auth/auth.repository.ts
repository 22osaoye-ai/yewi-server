import { UserProfile, UserRole } from './auth.types';
import { GoogleLoginDto } from './auth.dto';

export interface AuthRepository {
  login(email: string, password: string): Promise<{ user: UserProfile; token: string }>;

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phoneNumber?: string;
  }): Promise<{ user: UserProfile; token: string }>;

  loginWithGoogle(credentials: GoogleLoginDto): Promise<{ user: UserProfile; token: string }>;

  sendPhoneOtp(phoneNumber: string): Promise<boolean>;

  verifyPhoneOtp(phoneNumber: string, code: string): Promise<{ user: UserProfile; token: string }>;

  logout(): Promise<void>;
}
