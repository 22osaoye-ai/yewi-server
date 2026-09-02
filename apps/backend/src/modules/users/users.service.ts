import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        professionalProfile: {
          include: {
            categories: true,
            portfolioItems: true,
          },
        },
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const {
      passwordHash: _passwordHash,
      refreshTokenHash: _refreshTokenHash,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de usuario no encontrado');
    }

    const updateData: Record<string, any> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.displayName !== undefined) {
      updateData.displayName = dto.displayName;
    } else if (dto.firstName || dto.lastName) {
      updateData.displayName =
        `${dto.firstName ?? profile.firstName} ${dto.lastName ?? profile.lastName}`.trim();
    }
    if (dto.avatarUrl !== undefined) {
      if (!dto.avatarUrl || dto.avatarUrl === '') {
        updateData.avatarUrl = null;
      } else {
        let finalAvatarUrl = dto.avatarUrl;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (
          (dto.avatarUrl.startsWith('data:image') || dto.avatarUrl.startsWith('file://')) &&
          cloudName &&
          apiKey &&
          apiSecret
        ) {
          try {
            cloudinary.config({
              cloud_name: cloudName,
              api_key: apiKey,
              api_secret: apiSecret,
              secure: true,
            });
            const result = await cloudinary.uploader.upload(dto.avatarUrl, {
              folder: 'yewi/avatars',
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            });
            finalAvatarUrl = result.secure_url;
          } catch {
            // If upload fails, keep original or fallback
          }
        }
        updateData.avatarUrl = finalAvatarUrl;
      }
    }
    if (dto.phoneNumber !== undefined) {
      if (!dto.phoneNumber || dto.phoneNumber.trim() === '') {
        updateData.phoneNumber = null;
      } else {
        const cleanPhone = dto.phoneNumber.replace(/[\s\-().]/g, '');
        const existing = await this.prisma.profile.findFirst({
          where: {
            phoneNumber: cleanPhone,
            userId: { not: userId },
          },
        });
        if (existing) {
          throw new ConflictException('El número de teléfono ya está registrado en otra cuenta.');
        }
        updateData.phoneNumber = cleanPhone;
      }
    }
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.bio !== undefined) updateData.bio = dto.bio;

    return this.prisma.profile.update({
      where: { userId },
      data: updateData,
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const timestamp = Date.now();
    const anonymizedEmail = `deleted_${userId.slice(0, 8)}_${timestamp}@anonymized.yewi.es`;

    await this.prisma.$transaction(async (tx) => {
      await tx.profile.deleteMany({
        where: { userId },
      });

      await tx.professionalProfile.deleteMany({
        where: { userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          isActive: false,
          deletedAt: new Date(),
          refreshTokenHash: null,
          emailVerificationToken: null,
          passwordResetToken: null,
        },
      });
    });

    return {
      success: true,
      message: 'Cuenta y datos personales eliminados correctamente.',
    };
  }
}
