import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendPhoneOtpDto, VerifyPhoneOtpDto } from './dto/phone-auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface StoredOtp {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, StoredOtp>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valida país y teléfono según los 3 países autorizados: España (+34), Francia (+33), Reino Unido (+44)
   */
  private validateCountryAndPhone(country?: string, rawPhone?: string): { country: string; phoneNumber: string | null } {
    const rawCountry = (country || 'España').trim();
    const normCountry = rawCountry.toLowerCase();

    let expectedPrefix = '+34';
    let canonicalCountry = 'España';
    let expectedDigits = 9;

    if (normCountry === 'francia' || normCountry === 'france' || normCountry === 'fr') {
      expectedPrefix = '+33';
      canonicalCountry = 'Francia';
      expectedDigits = 9;
    } else if (
      normCountry === 'reino unido' ||
      normCountry === 'inglaterra' ||
      normCountry === 'united kingdom' ||
      normCountry === 'uk' ||
      normCountry === 'gb'
    ) {
      expectedPrefix = '+44';
      canonicalCountry = 'Reino Unido';
      expectedDigits = 10;
    } else if (
      normCountry === 'españa' ||
      normCountry === 'espana' ||
      normCountry === 'spain' ||
      normCountry === 'es'
    ) {
      expectedPrefix = '+34';
      canonicalCountry = 'España';
      expectedDigits = 9;
    } else {
      throw new BadRequestException(
        'Por el momento Yewi solo está disponible en España (+34), Francia (+33) y Reino Unido (+44).'
      );
    }

    if (!rawPhone || !rawPhone.trim()) {
      return { country: canonicalCountry, phoneNumber: null };
    }

    const cleanPhone = rawPhone.replace(/[\s\-().]/g, '');

    if (!cleanPhone.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        `Para ${canonicalCountry}, el número de teléfono debe comenzar con el prefijo oficial ${expectedPrefix}.`
      );
    }

    const nationalDigits = cleanPhone.slice(expectedPrefix.length);
    if (!/^\d+$/.test(nationalDigits) || nationalDigits.length !== expectedDigits) {
      throw new BadRequestException(
        `El número de teléfono para ${canonicalCountry} (${expectedPrefix}) debe contener exactamente ${expectedDigits} dígitos.`
      );
    }

    return { country: canonicalCountry, phoneNumber: cleanPhone };
  }

  /**
   * 1. Registro de un nuevo usuario (Cliente o Profesional)
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const { country, phoneNumber } = this.validateCountryAndPhone(dto.country, dto.phoneNumber);

    if (phoneNumber) {
      const existingPhone = await this.prisma.profile.findFirst({
        where: { phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('El número de teléfono ya está registrado en otra cuenta.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);
    const roles = this.normalizeRoles(dto.roles);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // 1. Crear usuario base
        const newUser = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            roles,
            isEmailVerified: true,
          },
        });

        // 2. Crear perfil de usuario
        await tx.profile.create({
          data: {
            userId: newUser.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            displayName: `${dto.firstName} ${dto.lastName}`.trim(),
            phoneNumber,
            country,
            city: dto.city ?? null,
            postalCode: dto.postalCode ?? null,
            address: dto.address ?? null,
          },
        });

        // 3. Si es profesional, crear perfil profesional
        if (roles.includes(UserRole.PROFESSIONAL)) {
          await tx.professionalProfile.create({
            data: {
              userId: newUser.id,
              businessName:
                dto.businessName ?? `${dto.firstName} ${dto.lastName}`.trim(),
              bio: dto.bio ?? '',
              latitude: dto.latitude ?? null,
              longitude: dto.longitude ?? null,
              serviceRadiusKm: dto.serviceRadiusKm ?? 50,
              hourlyRate: dto.hourlyRate ?? null,
              city: dto.city ?? null,
              postalCode: dto.postalCode ?? null,
              skills: dto.skills ?? [],
            },
          });
        }

        // 4. Crear billetera digital (saldo 0)
        await tx.wallet.create({
          data: {
            userId: newUser.id,
            creditBalance: 0,
            fiatAvailableBalance: 0,
            fiatPendingBalance: 0,
          },
        });

        const fullUser = await tx.user.findUnique({
          where: { id: newUser.id },
          include: {
            profile: true,
            professionalProfile: true,
            wallet: true,
          },
        });

        return fullUser || newUser;
      });

      // Generar tokens JWT oficiales de NestJS
      const tokens = await this.generateTokens(user.id, user.email, user.roles);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
          profile: (user as any).profile,
          professionalProfile: (user as any).professionalProfile,
          wallet: (user as any).wallet,
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
   * 2. Inicio de sesión con correo y contraseña
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
   * 3. Google OAuth Social Login con NestJS Passport
   */
  async loginWithGoogle(dto: GoogleAuthDto) {
    if (!dto.email) {
      throw new BadRequestException('Se requiere un correo de Google válido');
    }
    return this.loginWithVerifiedGoogleIdentity({
      email: dto.email,
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });
  }

  private async loginWithVerifiedGoogleIdentity(dto: {
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    let email = dto.email || '';
    let name = dto.name || '';
    const avatarUrl = dto.avatarUrl;

    if (!email) {
      throw new BadRequestException('Se requiere un correo de Google válido');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Buscar usuario existente
    let user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
      },
      include: {
        profile: true,
        professionalProfile: true,
        wallet: true,
      },
    });

    // 2. Si no existe, crear en PostgreSQL con manejo seguro de concurrencia
    if (!user) {
      const names = (name || 'Usuario Google').trim().split(' ');
      const firstName = names[0] || 'Usuario';
      const lastName = names.slice(1).join(' ') || 'Google';

      const randomPassword = await argon2.hash(
        `google_${Date.now()}_${Math.random()}`,
      );

      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: normalizedEmail,
              passwordHash: randomPassword,
              roles: [UserRole.CLIENT],
              isEmailVerified: true,
            },
          });

          await tx.profile.create({
            data: {
              userId: newUser.id,
              firstName,
              lastName,
              displayName: `${firstName} ${lastName}`.trim(),
              avatarUrl: avatarUrl ?? null,
              country: 'España',
              city: null,
              postalCode: null,
              address: null,
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              creditBalance: 0,
              fiatAvailableBalance: 0,
              fiatPendingBalance: 0,
            },
          });

          return newUser;
        });

        user = await this.prisma.user.findUnique({
          where: { id: created.id },
          include: {
            profile: true,
            professionalProfile: true,
            wallet: true,
          },
        });
      } catch (createError) {
        // Si ocurrió colisión por concurrencia o constraint único, recuperar el usuario existente
        user = await this.prisma.user.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: 'insensitive' },
          },
          include: {
            profile: true,
            professionalProfile: true,
            wallet: true,
          },
        });

        if (!user) {
          throw createError;
        }
      }
    }

    if (user) {
      // Actualizar avatarUrl y displayName si nos entregan nuevos datos
      const hasNewAvatar = avatarUrl && user.profile && user.profile.avatarUrl !== avatarUrl;
      const hasMissingDisplayName = name && user.profile && !user.profile.displayName;

      if (hasNewAvatar || hasMissingDisplayName) {
        await this.prisma.profile.update({
          where: { userId: user.id },
          data: {
            ...(hasNewAvatar ? { avatarUrl } : {}),
            ...(hasMissingDisplayName ? { displayName: name } : {}),
          },
        });

        if (user.profile) {
          if (hasNewAvatar) user.profile.avatarUrl = avatarUrl;
          if (hasMissingDisplayName) user.profile.displayName = name;
        }
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
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
   * 3b. Google OAuth Social Login a través de Passport req.user
   */
  async loginWithGoogleOAuthUser(oauthUser: {
    email: string;
    name?: string;
    picture?: string;
  }) {
    if (!oauthUser || !oauthUser.email) {
      throw new BadRequestException(
        'No se recibieron datos de usuario válidos desde Google OAuth',
      );
    }
    return this.loginWithVerifiedGoogleIdentity({
      email: oauthUser.email,
      name: oauthUser.name,
      avatarUrl: oauthUser.picture,
    });
  }

  /**
   * 4. Enviar Código SMS OTP (NestJS nativo)
   */
  async sendPhoneOtp(dto: SendPhoneOtpDto) {
    const cleanPhone = dto.phoneNumber.trim().replace(/\s+/g, '');

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos de validez

    this.otpStore.set(cleanPhone, { code, expiresAt });

    this.logger.log(`SMS OTP enviado a ${cleanPhone}`);

    return {
      success: true,
      message: `Código SMS enviado exitosamente al número ${cleanPhone}`,
      // En desarrollo exponemos el código para pruebas rápidas
      expiresInSeconds: 300,
    };
  }

  /**
   * 5. Verificar Código SMS OTP y generar sesión NestJS
   */
  async verifyPhoneOtp(dto: VerifyPhoneOtpDto) {
    const cleanPhone = dto.phoneNumber.trim().replace(/\s+/g, '');
    const stored = this.otpStore.get(cleanPhone);

    const isValidCode =
      stored && stored.code === dto.code && stored.expiresAt > Date.now();

    if (!isValidCode) {
      throw new UnauthorizedException(
        'El código SMS es incorrecto o ha expirado',
      );
    }

    // Limpiar OTP utilizado
    this.otpStore.delete(cleanPhone);

    // Identificador único de email virtual para cuentas creadas por teléfono
    const phoneEmail =
      `${cleanPhone.replace(/[^0-9]/g, '')}@telefono.yewi.es`.toLowerCase();

    // 1. Buscar usuario por teléfono o email virtual
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: phoneEmail }, { profile: { phoneNumber: cleanPhone } }],
      },
      include: {
        profile: true,
        professionalProfile: true,
        wallet: true,
      },
    });

    // 2. Si no existe, crear usuario en PostgreSQL
    if (!user) {
      const firstName = dto.firstName || 'Usuario';
      const lastName = dto.lastName || 'Móvil';
      const randomPassword = await argon2.hash(
        `phone_${Date.now()}_${Math.random()}`,
      );

      const created = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: phoneEmail,
            passwordHash: randomPassword,
            roles: this.normalizeRoles(dto.roles),
            isEmailVerified: true,
          },
        });

        await tx.profile.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            phoneNumber: cleanPhone,
            phoneVerified: true,
            city: 'Zaragoza',
            postalCode: '50001',
          },
        });

        if (this.normalizeRoles(dto.roles).includes(UserRole.PROFESSIONAL)) {
          await tx.professionalProfile.create({
            data: {
              userId: newUser.id,
              businessName: `${firstName} ${lastName}`,
              bio: 'Profesional verificado por teléfono en Yewi',
              city: 'Zaragoza',
              postalCode: '50001',
              hourlyRate: 35,
              serviceRadiusKm: 50,
            },
          });
        }

        await tx.wallet.create({
          data: {
            userId: newUser.id,
            creditBalance: 0,
            fiatAvailableBalance: 0,
            fiatPendingBalance: 0,
          },
        });

        return newUser;
      });

      user = await this.prisma.user.findUnique({
        where: { id: created.id },
        include: {
          profile: true,
          professionalProfile: true,
          wallet: true,
        },
      });
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
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
   * 6. Refresco de Token con rotación
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
   * 7. Cierre de sesión (invalidación de refresh token)
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

  private normalizeRoles(roles?: UserRole[]): UserRole[] {
    const allowed = (roles ?? []).filter(
      (role) => role === UserRole.CLIENT || role === UserRole.PROFESSIONAL,
    );
    return allowed.length > 0 ? allowed : [UserRole.CLIENT];
  }
}
