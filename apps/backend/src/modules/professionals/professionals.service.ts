import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, UserRole } from '@prisma/client';
import { GeoUtils } from '../../common/utils/geo.utils';
import { PrismaService } from '../../database/prisma.service';
import {
  CreatePortfolioItemDto,
  SubmitKycDto,
  UpdateProfessionalProfileDto,
} from './dto/update-professional-profile.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el perfil profesional del usuario autenticado
   */
  async getMyProfile(userId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        categories: true,
        portfolioItems: true,
        user: {
          select: {
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!pro) {
      throw new NotFoundException('No tienes un perfil profesional creado');
    }

    return pro;
  }

  /**
   * Actualiza o crea el perfil profesional
   */
  async updateMyProfile(userId: string, dto: UpdateProfessionalProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { professionalProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { categoryIds, ...proData } = dto;

    // Asegurar que el usuario tenga el rol de PROFESSIONAL
    if (!user.roles.includes(UserRole.PROFESSIONAL)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: { set: [...user.roles, UserRole.PROFESSIONAL] },
        },
      });
    }

    return this.prisma.professionalProfile.upsert({
      where: { userId },
      create: {
        userId,
        businessName: proData.businessName ?? 'Mi Perfil Profesional',
        bio: proData.bio ?? 'Servicios profesionales en Yewi',
        hourlyRate: proData.hourlyRate,
        serviceRadiusKm: proData.serviceRadiusKm ?? 50,
        latitude: proData.latitude ?? 40.4168,
        longitude: proData.longitude ?? -3.7038,
        city: proData.city,
        postalCode: proData.postalCode,
        country: proData.country,
        address: proData.address,
        skills: proData.skills ?? [],
        categories: categoryIds
          ? { connect: categoryIds.map((id) => ({ id })) }
          : undefined,
      },
      update: {
        ...proData,
        categories: categoryIds
          ? { set: categoryIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        categories: true,
        portfolioItems: true,
      },
    });
  }

  /**
   * Obtiene el perfil público de un profesional
   */
  async getPublicProfile(id: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            profile: true,
            createdAt: true,
          },
        },
        categories: true,
        portfolioItems: true,
        gigs: {
          where: { status: 'ACTIVE' },
          include: {
            packages: true,
          },
        },
      },
    });

    if (!pro) {
      throw new NotFoundException('Profesional no encontrado');
    }

    return pro;
  }

  /**
   * Busca profesionales cercanos por coordenadas y categoría
   */
  async findNearby(
    lat: number,
    lon: number,
    categoryId?: string,
    skill?: string,
  ) {
    const pros = await this.prisma.professionalProfile.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
        ...(skill ? { skills: { has: skill } } : {}),
      },
      include: {
        user: {
          select: {
            profile: true,
          },
        },
        categories: true,
      },
    });

    // Filtrar por radio de servicio del profesional o cercanía
    const nearbyPros = pros
      .map((pro) => {
        const distanceKm = GeoUtils.calculateHaversineDistance(
          pro.latitude!,
          pro.longitude!,
          lat,
          lon,
        );

        return {
          ...pro,
          distanceKm,
          isWithinProCoverage: distanceKm <= pro.serviceRadiusKm,
        };
      })
      .filter((pro) => pro.isWithinProCoverage || pro.distanceKm <= 100)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyPros;
  }

  /**
   * Añadir elemento al portafolio
   */
  async addPortfolioItem(userId: string, dto: CreatePortfolioItemDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional activo');
    }

    return this.prisma.portfolioItem.create({
      data: {
        professionalProfileId: pro.id,
        ...dto,
      },
    });
  }

  /**
   * Eliminar elemento del portafolio
   */
  async deletePortfolioItem(userId: string, itemId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Acceso denegado');
    }

    const item = await this.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.professionalProfileId !== pro.id) {
      throw new NotFoundException('Elemento de portafolio no encontrado');
    }

    await this.prisma.portfolioItem.delete({
      where: { id: itemId },
    });

    return { message: 'Elemento eliminado correctamente' };
  }

  /**
   * Enviar solicitud de verificación KYC
   */
  async submitKyc(userId: string, dto: SubmitKycDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new NotFoundException('Perfil profesional no encontrado');
    }

    return this.prisma.professionalProfile.update({
      where: { id: pro.id },
      data: {
        kycDocumentUrl: dto.documentUrl,
        kycStatus: KycStatus.PENDING_REVIEW,
      },
    });
  }
}
