import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles?: UserRole[];
    phoneNumber?: string;
    businessName?: string;
    bio?: string;
    latitude?: number;
    longitude?: number;
    serviceRadiusKm?: number;
    city?: string;
    postalCode?: string;
    address?: string;
    hourlyRate?: number;
    skills?: string[];
}
