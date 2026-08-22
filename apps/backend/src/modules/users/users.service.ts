import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
  }
}
