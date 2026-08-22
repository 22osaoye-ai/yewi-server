import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registro de un nuevo usuario (Cliente o Profesional)
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const passwordHash = await argon2.hash(dto.password);
    const isPro = dto.roles?.includes(UserRole.PROFESSIONAL) ?? false;

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // 1. Crear usuario base
        const newUser = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            roles: dto.roles ?? [UserRole.CLIENT],
            isEmailVerified: true, // Para facilitar desarrollo/demo
          },
        });

        // 2. Crear perfil de usuario
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

        // 3. Si es profesional, crear perfil profesional
        if (isPro) {
          await tx.professionalProfile.create({
            data: {
              userId: newUser.id,
              businessName:
                dto.businessName ?? `${dto.firstName} ${dto.lastName}`,
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

        // 4. Crear billetera digital (Billetera con 50 créditos de bienvenida para pros)
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

      // Generar tokens
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
    } catch (error) {
      this.logger.error('Error al registrar usuario:', error);
      throw new InternalServerErrorException(
        'Error al crear la cuenta de usuario',
      );
    }
  }

  /**
   * Inicio de sesión de usuario
   */
  async login(dto: LoginDto) {
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
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
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

  /**
   * Refresco de Token con rotación
   */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Acceso denegado');
      }

      const refreshTokenMatches = await argon2.verify(
        user.refreshTokenHash,
        dto.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException(
          'Token de refresco inválido o expirado',
        );
      }

      const tokens = await this.generateTokens(user.id, user.email, user.roles);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  /**
   * Cierre de sesión (invalidación de refresh token)
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  /**
   * Helper para generar tokens JWT
   */
  private async generateTokens(
    userId: string,
    email: string,
    roles: UserRole[],
  ) {
    const payload = { sub: userId, email, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ??
          '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ??
          '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') ?? '15m',
    };
  }

  /**
   * Guarda el hash del refresh token para rotación segura
   */
  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
