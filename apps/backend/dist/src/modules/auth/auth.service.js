"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../../database/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('El correo electrónico ya está registrado');
        }
        const passwordHash = await argon2.hash(dto.password);
        const isPro = dto.roles?.includes(client_1.UserRole.PROFESSIONAL) ?? false;
        try {
            const user = await this.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email: dto.email.toLowerCase(),
                        passwordHash,
                        roles: dto.roles ?? [client_1.UserRole.CLIENT],
                        isEmailVerified: true,
                    },
                });
                await tx.profile.create({
                    data: {
                        userId: newUser.id,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        displayName: `${dto.firstName} ${dto.lastName}`,
                        phoneNumber: dto.phoneNumber,
                        city: dto.city ?? 'Zaragoza',
                        postalCode: dto.postalCode ?? '50001',
                        address: dto.address,
                    },
                });
                if (isPro) {
                    await tx.professionalProfile.create({
                        data: {
                            userId: newUser.id,
                            businessName: dto.businessName ?? `${dto.firstName} ${dto.lastName}`,
                            bio: dto.bio ?? 'Profesional verificado en Yewi',
                            latitude: dto.latitude ?? 41.6488,
                            longitude: dto.longitude ?? -0.8891,
                            serviceRadiusKm: dto.serviceRadiusKm ?? 50,
                            hourlyRate: dto.hourlyRate ?? 35,
                            city: dto.city ?? 'Zaragoza',
                            postalCode: dto.postalCode ?? '50001',
                        },
                    });
                }
                await tx.wallet.create({
                    data: {
                        userId: newUser.id,
                        creditBalance: isPro ? 50 : 0,
                        fiatAvailableBalance: 0,
                        fiatPendingBalance: 0,
                    },
                });
                return newUser;
            });
            const tokens = await this.generateTokens(user.id, user.email, user.roles);
            await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles,
                },
                ...tokens,
            };
        }
        catch (error) {
            this.logger.error('Error al registrar usuario:', error);
            throw new common_1.InternalServerErrorException('Error al crear la cuenta de usuario');
        }
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                profile: true,
                professionalProfile: {
                    select: { id: true, businessName: true, kycStatus: true },
                },
                wallet: {
                    select: { creditBalance: true, fiatAvailableBalance: true },
                },
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.roles);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles,
                profile: user.profile,
                professionalProfile: user.professionalProfile,
                wallet: user.wallet,
            },
            ...tokens,
        };
    }
    async refreshToken(dto) {
        try {
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.refreshTokenHash) {
                throw new common_1.UnauthorizedException('Acceso denegado');
            }
            const refreshTokenMatches = await argon2.verify(user.refreshTokenHash, dto.refreshToken);
            if (!refreshTokenMatches) {
                throw new common_1.UnauthorizedException('Token de refresco inválido o expirado');
            }
            const tokens = await this.generateTokens(user.id, user.email, user.roles);
            await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
            return tokens;
        }
        catch {
            throw new common_1.UnauthorizedException('Token de refresco inválido');
        }
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
        return { message: 'Sesión cerrada correctamente' };
    }
    async generateTokens(userId, email, roles) {
        const payload = { sub: userId, email, roles };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: (this.configService.get('JWT_EXPIRATION') ??
                    '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: (this.configService.get('JWT_REFRESH_EXPIRATION') ??
                    '7d'),
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.configService.get('JWT_EXPIRATION') ?? '15m',
        };
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const hash = await argon2.hash(refreshToken);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: hash },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map