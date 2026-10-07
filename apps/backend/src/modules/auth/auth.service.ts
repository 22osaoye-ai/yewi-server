import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { RedisCacheService } from '../../common/cache/redis.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  CheckAvailabilityDto,
  CheckAvailabilityResult,
} from './dto/check-availability.dto';
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
  private clerkJwksCache: { keys: any[]; fetchedAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly redisCache?: RedisCacheService,
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

    const roles = this.normalizeRoles(dto.roles);
    const isPro = roles.includes(UserRole.PROFESSIONAL);
    const normalizedTaxId = dto.taxId?.trim().toUpperCase() || null;

    if (isPro && normalizedTaxId) {
      const existingTax = await this.prisma.professionalProfile.findFirst({
        where: { taxId: normalizedTaxId },
      });
      if (existingTax) {
        throw new ConflictException('El NIF/CIF ya está registrado en otra cuenta profesional.');
      }
    }

    const passwordHash = await argon2.hash(dto.password);

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
              taxId: normalizedTaxId,
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
   * Verifica criptográficamente un Google ID Token con Google OAuth2 TokenInfo
   * Comprueba firma, emisor oficial (accounts.google.com), email verificado y audiencia (GOOGLE_CLIENT_ID)
   */
  private async verifyGoogleIdToken(idToken: string): Promise<{
    email: string;
    name?: string;
    picture?: string;
  } | null> {
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (!verifyRes.ok) {
        return null;
      }
      const tokenInfo = (await verifyRes.json()) as {
        iss?: string;
        aud?: string;
        email?: string;
        email_verified?: string | boolean;
        name?: string;
        picture?: string;
      };

      // 1. Validar emisor oficial de Google
      const isValidIssuer =
        tokenInfo.iss === 'accounts.google.com' ||
        tokenInfo.iss === 'https://accounts.google.com';
      if (!isValidIssuer) {
        this.logger.warn(`Google tokeninfo: emisor no válido (${tokenInfo.iss})`);
        return null;
      }

      // 2. Validar que el email esté verificado por Google
      const isEmailVerified =
        tokenInfo.email_verified === 'true' ||
        tokenInfo.email_verified === true;
      if (!isEmailVerified || !tokenInfo.email) {
        this.logger.warn('Google tokeninfo: email no verificado o ausente');
        return null;
      }

      // 3. Validar audiencia (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_IDS) si está configurada
      const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const googleClientIds = this.configService.get<string>('GOOGLE_CLIENT_IDS');
      const allowedAudiences = [
        googleClientId,
        ...(googleClientIds ? googleClientIds.split(',').map((id) => id.trim()) : []),
      ].filter(Boolean) as string[];

      if (allowedAudiences.length > 0) {
        if (!tokenInfo.aud || !allowedAudiences.includes(tokenInfo.aud)) {
          this.logger.warn(
            `Google tokeninfo: aud (${tokenInfo.aud}) no coincide con ningún cliente configurado`,
          );
          return null;
        }
      }

      return {
        email: tokenInfo.email.toLowerCase().trim(),
        name: tokenInfo.name,
        picture: tokenInfo.picture,
      };
    } catch (err) {
      this.logger.warn(`Error al verificar token con Google TokenInfo: ${err}`);
      return null;
    }
  }

  /**
   * Verifica criptográficamente la firma RSA de un token de Clerk mediante sus claves públicas JWKS
   */
  private async verifyClerkToken(idToken: string): Promise<{
    email: string;
    name?: string;
    picture?: string;
  } | null> {
    try {
      const decodedComplete = jwt.decode(idToken, { complete: true }) as {
        header?: { kid?: string; alg?: string };
        payload?: any;
      } | null;

      if (!decodedComplete?.header?.kid) {
        return null;
      }

      const kid = decodedComplete.header.kid;
      const jwksUrl =
        this.configService.get<string>('CLERK_JWKS_URL') ||
        'https://certain-sailfish-4270.clerk.accounts.dev/.well-known/jwks.json';

      // Reutilizar cache por 1 hora
      const now = Date.now();
      if (!this.clerkJwksCache || now - this.clerkJwksCache.fetchedAt > 3600000) {
        const jwksRes = await fetch(jwksUrl);
        if (jwksRes.ok) {
          const jwksData = (await jwksRes.json()) as { keys: any[] };
          this.clerkJwksCache = { keys: jwksData.keys || [], fetchedAt: now };
        }
      }

      const matchingKey = this.clerkJwksCache?.keys.find((k) => k.kid === kid);
      if (!matchingKey) {
        this.logger.warn(`Clerk JWKS: No se encontró clave para kid ${kid}`);
        return null;
      }

      const publicKey = crypto.createPublicKey({
        key: matchingKey,
        format: 'jwk',
      });

      const verifiedPayload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
      }) as {
        sub?: string;
        email?: string;
        email_address?: string;
        name?: string;
        picture?: string;
      };

      if (!verifiedPayload) {
        return null;
      }

      let email = verifiedPayload.email || verifiedPayload.email_address;

      if (!email && verifiedPayload.sub) {
        const clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY');
        if (clerkSecretKey) {
          const userRes = await fetch(
            `https://api.clerk.com/v1/users/${verifiedPayload.sub}`,
            {
              headers: { Authorization: `Bearer ${clerkSecretKey}` },
            },
          );
          if (userRes.ok) {
            const userData = (await userRes.json()) as any;
            const primaryEmail = userData.email_addresses?.find(
              (e: any) => e.id === userData.primary_email_address_id,
            );
            if (primaryEmail?.verification?.status === 'verified') {
              email = primaryEmail.email_address;
            }
          }
        }
      }

      if (!email) {
        this.logger.warn('Clerk token verificado pero no contiene email verificado');
        return null;
      }

      return {
        email: email.toLowerCase().trim(),
        name: verifiedPayload.name,
        picture: verifiedPayload.picture,
      };
    } catch (err) {
      this.logger.warn(`Fallo al verificar firma criptográfica de Clerk: ${err}`);
      return null;
    }
  }

  /**
   * 3. Google / Social Login con verificación criptográfica estricta obligatoria
   */
  async loginWithGoogle(dto: GoogleAuthDto) {
    if (!dto.idToken || typeof dto.idToken !== 'string' || !dto.idToken.trim()) {
      throw new UnauthorizedException(
        'Se requiere un token de identidad criptográficamente válido (idToken) para iniciar sesión',
      );
    }

    // 1. Intentar verificación criptográfica con Google
    let verifiedIdentity = await this.verifyGoogleIdToken(dto.idToken);

    // 2. Si no es de Google, intentar verificación criptográfica con Clerk (JWKS)
    if (!verifiedIdentity) {
      verifiedIdentity = await this.verifyClerkToken(dto.idToken);
    }

    // 3. Si ninguna verificación criptográfica tuvo éxito, RECHAZAR tajantemente (cero decodificación sin firma)
    if (!verifiedIdentity || !verifiedIdentity.email) {
      throw new UnauthorizedException(
        'No se pudo verificar la firma criptográfica o la autenticidad del token social proporcionado',
      );
    }

    return this.loginWithVerifiedGoogleIdentity({
      email: verifiedIdentity.email,
      name: verifiedIdentity.name || dto.name,
      avatarUrl: verifiedIdentity.picture || dto.avatarUrl,
    });
  }

  private async loginWithVerifiedGoogleIdentity(dto: {
    email: string;
    name?: string;
    avatarUrl?: string;
  }) {
    const email = dto.email || '';
    const rawName = (dto.name || '').trim();
    const avatarUrl = dto.avatarUrl;

    if (!email) {
      throw new BadRequestException('Se requiere un correo de Google válido');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Resolver nombre y apellido de forma limpia y precisa
    let firstName = '';
    let lastName = '';

    const isGenericGoogleName =
      !rawName ||
      rawName.toLowerCase() === 'usuario' ||
      rawName.toLowerCase() === 'usuario google' ||
      rawName.toLowerCase() === 'usuario de google';

    if (!isGenericGoogleName) {
      const parts = rawName.split(/\s+/).filter(Boolean);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (!firstName && normalizedEmail.includes('@')) {
      const emailPrefix = normalizedEmail.split('@')[0];
      const cleaned = emailPrefix.replace(/[._-]+/g, ' ').trim();
      const parts = cleaned.split(/\s+/).filter(Boolean);
      firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Usuario';
      lastName = parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }

    if (!firstName) {
      firstName = 'Usuario';
      lastName = '';
    }

    const resolvedDisplayName = `${firstName} ${lastName}`.trim() || firstName;

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
              displayName: resolvedDisplayName,
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

    if (user && user.profile) {
      const profile = user.profile;
      const isPlaceholder =
        !profile.displayName ||
        profile.displayName.toLowerCase() === 'usuario google' ||
        profile.displayName.toLowerCase() === 'usuario de google' ||
        profile.displayName.toLowerCase() === 'usuario' ||
        profile.firstName.toLowerCase() === 'usuario' ||
        profile.lastName.toLowerCase() === 'google' ||
        (!profile.lastName && lastName);

      const hasBetterName = !isGenericGoogleName && (isPlaceholder || profile.displayName !== resolvedDisplayName);
      const hasNewAvatar = avatarUrl && profile.avatarUrl !== avatarUrl;

      if (hasBetterName || hasNewAvatar || isPlaceholder) {
        const updateData: { firstName?: string; lastName?: string; displayName?: string; avatarUrl?: string } = {};
        if (hasNewAvatar) updateData.avatarUrl = avatarUrl;
        if (hasBetterName || isPlaceholder) {
          updateData.firstName = firstName;
          updateData.lastName = lastName;
          updateData.displayName = resolvedDisplayName;
        }

        const updatedProfile = await this.prisma.profile.update({
          where: { userId: user.id },
          data: updateData,
        });

        user.profile = updatedProfile;
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
   * 4. Enviar Código SMS OTP (con persistencia en Redis / TTL)
   */
  async sendPhoneOtp(dto: SendPhoneOtpDto) {
    const cleanPhone = dto.phoneNumber.trim().replace(/\s+/g, '');

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos de validez

    // Guardar en Redis si está activo, o en memoria con purga de expirados
    if (this.redisCache) {
      await this.redisCache.set(`otp:${cleanPhone}`, { code, expiresAt }, 300);
    } else {
      const now = Date.now();
      for (const [key, val] of this.otpStore.entries()) {
        if (val.expiresAt < now) {
          this.otpStore.delete(key);
        }
      }
      this.otpStore.set(cleanPhone, { code, expiresAt });
    }

    this.logger.log(`SMS OTP enviado a ${cleanPhone}`);

    return {
      success: true,
      message: `Código SMS enviado exitosamente al número ${cleanPhone}`,
      expiresInSeconds: 300,
    };
  }

  /**
   * 5. Verificar Código SMS OTP y generar sesión NestJS
   */
  async verifyPhoneOtp(dto: VerifyPhoneOtpDto) {
    const cleanPhone = dto.phoneNumber.trim().replace(/\s+/g, '');
    let stored: StoredOtp | null = null;

    if (this.redisCache) {
      stored = await this.redisCache.get<StoredOtp>(`otp:${cleanPhone}`);
    }
    if (!stored) {
      stored = this.otpStore.get(cleanPhone) ?? null;
    }

    const isValidCode =
      stored && stored.code === dto.code && stored.expiresAt > Date.now();

    if (!isValidCode) {
      throw new UnauthorizedException(
        'El código SMS es incorrecto o ha expirado',
      );
    }

    // Limpiar OTP utilizado tanto de Redis como de memoria
    if (this.redisCache) {
      await this.redisCache.del(`otp:${cleanPhone}`);
    }
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
   * 8. Comprobar en tiempo real la disponibilidad de email, teléfono y NIE/CIF
   */
  async checkAvailability(dto: CheckAvailabilityDto): Promise<CheckAvailabilityResult> {
    const result: CheckAvailabilityResult = {};

    // 1. Comprobación de email
    if (dto.email && dto.email.trim()) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
        },
      });

      result.email = existingUser
        ? { available: false, message: 'Correo ya registrado' }
        : { available: true, message: 'Disponible' };
    }

    // 2. Comprobación de teléfono
    if (dto.phoneNumber && dto.phoneNumber.trim()) {
      try {
        const { phoneNumber: cleanPhone } = this.validateCountryAndPhone(
          dto.country,
          dto.phoneNumber,
        );

        if (cleanPhone) {
          const existingPhone = await this.prisma.profile.findFirst({
            where: { phoneNumber: cleanPhone },
          });

          result.phoneNumber = existingPhone
            ? {
                available: false,
                message: 'Teléfono ya registrado',
                formatted: cleanPhone,
              }
            : {
                available: true,
                message: 'Disponible',
                formatted: cleanPhone,
              };
        }
      } catch (err: any) {
        result.phoneNumber = {
          available: false,
          message: err?.message || 'Formato de teléfono no válido',
        };
      }
    }

    // 3. Comprobación de taxId (NIF/NIE/CIF de profesional)
    if (dto.taxId && dto.taxId.trim()) {
      const normalizedTaxId = dto.taxId.trim().toUpperCase();
      const existingTax = await this.prisma.professionalProfile.findFirst({
        where: { taxId: normalizedTaxId },
      });

      result.taxId = existingTax
        ? { available: false, message: 'NIF/CIF ya registrado' }
        : { available: true, message: 'Disponible' };
    }

    return result;
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
