import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: string;
        user: {
            id: string;
            email: string;
            roles: import("@prisma/client").$Enums.UserRole[];
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                bio: string | null;
                address: string | null;
                city: string | null;
                postalCode: string | null;
                country: string | null;
                firstName: string;
                lastName: string;
                displayName: string | null;
                avatarUrl: string | null;
                phoneNumber: string | null;
                phoneVerified: boolean;
                preferredLanguage: string;
            } | null;
            professionalProfile: {
                id: string;
                businessName: string | null;
                kycStatus: import("@prisma/client").$Enums.KycStatus;
            } | null;
            wallet: {
                creditBalance: number;
                fiatAvailableBalance: import("@prisma/client/runtime/client").Decimal;
            } | null;
        };
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
