import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, Prisma, SubscriptionStatus, UserRole } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { GeoUtils } from '../../common/utils/geo.utils';
import { PrismaService } from '../../database/prisma.service';

import { FilterProfessionalsDto } from './dto/filter-professionals.dto';
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
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
      },
    });

    if (!pro) {
      throw new NotFoundException('No tienes un perfil profesional creado');
    }

    return {
      ...pro,
      isPro: this.hasActiveSubscription(pro.user.subscription),
    };
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

    if (!user.professionalProfile && dto.bio === undefined) {
      throw new BadRequestException(
        'El campo bio es obligatorio al crear un perfil profesional',
      );
    }

    const { categoryIds } = dto;
    let finalCategoryConnect: { id: string }[] | undefined = undefined;
    if (categoryIds && categoryIds.length > 0) {
      finalCategoryConnect = categoryIds.map((id) => ({ id }));
    } else if (dto.skills && dto.skills.length > 0) {
      const matchedCategories = await this.prisma.category.findMany({
        where: {
          OR: dto.skills.map((s) => ({
            name: { equals: s, mode: 'insensitive' },
          })),
        },
        select: { id: true },
      });
      if (matchedCategories.length > 0) {
        finalCategoryConnect = matchedCategories.map((c) => ({ id: c.id }));
      }
    }

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
        ...(dto.businessName !== undefined && {
          businessName: dto.businessName,
        }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        bio: dto.bio!,
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.serviceRadiusKm !== undefined && {
          serviceRadiusKm: dto.serviceRadiusKm,
        }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.region !== undefined && { region: dto.region }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
        categories: finalCategoryConnect
          ? { connect: finalCategoryConnect }
          : undefined,
      },
      update: {
        ...(dto.businessName !== undefined && {
          businessName: dto.businessName,
        }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.serviceRadiusKm !== undefined && {
          serviceRadiusKm: dto.serviceRadiusKm,
        }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.region !== undefined && { region: dto.region }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
        categories: finalCategoryConnect
          ? { set: finalCategoryConnect }
          : undefined,
      },
      include: {
        categories: true,
        portfolioItems: true,
      },
    });
  }

  /**
   * Obtiene el perfil público de un profesional (por ID de perfil o ID de usuario)
   */
  async getPublicProfile(id: string) {
    const pro = await this.prisma.professionalProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        bio: true,
        hourlyRate: true,
        serviceRadiusKm: true,
        latitude: true,
        longitude: true,
        country: true,
        region: true,
        province: true,
        city: true,
        skills: true,
        badges: true,
        avgRating: true,
        totalReviews: true,
        completedOrdersCount: true,
        responseTimeHours: true,
        responseRatePercent: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                city: true,
                province: true,
                region: true,
                country: true,
              },
            },
            createdAt: true,
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
        categories: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        portfolioItems: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrls: true,
            projectUrl: true,
            tags: true,
            createdAt: true,
          },
        },
        gigs: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            searchTags: true,
            coverImages: true,
            videoUrl: true,
            avgRating: true,
            totalReviews: true,
            ordersCount: true,
            isFeatured: true,
            createdAt: true,
            packages: {
              select: {
                id: true,
                tier: true,
                name: true,
                description: true,
                price: true,
                deliveryDays: true,
                revisions: true,
                features: true,
                isPopular: true,
              },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!pro) {
      throw new NotFoundException('Profesional no encontrado');
    }

    return {
      ...pro,
      isPro: pro.user?.subscription ? this.hasActiveSubscription(pro.user.subscription) : false,
    };
  }


  /**
   * Búsqueda pública de profesionales por texto, categoría y/o localidad
   */
  async searchProfessionals(dto: FilterProfessionalsDto) {
    const { q, category, city, province, skill, limit = 20, offset = 0 } = dto;

    const andClauses: Prisma.ProfessionalProfileWhereInput[] = [];

    if (city) {
      andClauses.push({ city: { contains: city.trim(), mode: 'insensitive' } });
    }

    if (province) {
      andClauses.push({ province: { contains: province.trim(), mode: 'insensitive' } });
    }

    if (skill) {
      andClauses.push({ skills: { has: skill.trim() } });
    }

    if (category) {
      const catList = category
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (catList.length > 1) {
        andClauses.push({
          OR: catList.flatMap((catQuery) => {
            const catSlug = catQuery.toLowerCase();
            return [
              {
                categories: {
                  some: {
                    OR: [
                      { slug: { contains: catSlug, mode: 'insensitive' } },
                      { name: { contains: catQuery, mode: 'insensitive' } },
                      { id: catQuery },
                    ],
                  },
                },
              },
              { skills: { has: catQuery } },
            ];
          }),
        });
      } else if (catList.length === 1) {
        const catQuery = catList[0];
        const catSlug = catQuery.toLowerCase();
        andClauses.push({
          OR: [
            {
              categories: {
                some: {
                  OR: [
                    { slug: { contains: catSlug, mode: 'insensitive' } },
                    { name: { contains: catQuery, mode: 'insensitive' } },
                    { id: catQuery },
                  ],
                },
              },
            },
            { skills: { has: catQuery } },
          ],
        });
      }
    }

    if (q) {
      const text = q.trim();
      andClauses.push({
        OR: [
          { businessName: { contains: text, mode: 'insensitive' } },
          { bio: { contains: text, mode: 'insensitive' } },
          { city: { contains: text, mode: 'insensitive' } },
          { user: { profile: { displayName: { contains: text, mode: 'insensitive' } } } },
          { user: { profile: { firstName: { contains: text, mode: 'insensitive' } } } },
          { user: { profile: { lastName: { contains: text, mode: 'insensitive' } } } },
          { skills: { has: text } },
        ],
      });
    }

    const whereClause: Prisma.ProfessionalProfileWhereInput =
      andClauses.length > 0 ? { AND: andClauses } : {};

    const [pros, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          businessName: true,
          bio: true,
          hourlyRate: true,
          serviceRadiusKm: true,
          country: true,
          region: true,
          province: true,
          city: true,
          postalCode: true,
          skills: true,
          badges: true,
          avgRating: true,
          totalReviews: true,
          completedOrdersCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  avatarUrl: true,
                  phoneNumber: true,
                  city: true,
                  province: true,
                },
              },
              subscription: {
                select: {
                  status: true,
                  stripeSubscriptionId: true,
                  stripeCustomerId: true,
                },
              },
            },
          },
          categories: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          portfolioItems: {
            select: { id: true, title: true, description: true, imageUrls: true },
            take: 4,
          },
        },
        orderBy: [
          { isPro: 'desc' },
          { avgRating: 'desc' },
          { totalReviews: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.professionalProfile.count({ where: whereClause }),
    ]);

    const formatted = pros.map((pro) => ({
      ...pro,
      isPro: this.hasActiveSubscription(pro.user.subscription),
    }));

    return {
      items: formatted,
      total,
      limit,
      offset,
    };
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
      select: {
        id: true,
        businessName: true,
        bio: true,
        hourlyRate: true,
        serviceRadiusKm: true,
        latitude: true,
        longitude: true,
        country: true,
        region: true,
        province: true,
        city: true,
        skills: true,
        badges: true,
        avgRating: true,
        totalReviews: true,
        user: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
                city: true,
                province: true,
                region: true,
                country: true,
              },
            },
            subscription: {
              select: {
                status: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
              },
            },
          },
        },
        categories: {
          select: { id: true, name: true, slug: true, icon: true },
        },
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
          isPro: this.hasActiveSubscription(pro.user.subscription),
          distanceKm,
          isWithinProCoverage: distanceKm <= pro.serviceRadiusKm,
        };
      })
      .filter((pro) => pro.isWithinProCoverage || pro.distanceKm <= 100)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyPros;
  }

  private hasActiveSubscription(subscription: {
    status: SubscriptionStatus;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
  } | null | undefined) {
    return Boolean(
      subscription &&
        (subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.TRIALING) &&
        subscription.stripeSubscriptionId &&
        subscription.stripeCustomerId,
    );
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

  /**
   * Sube una imagen a Cloudinary para el portafolio
   */
  async uploadPortfolioImage(userId: string, imageBase64OrUri: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      if (imageBase64OrUri.startsWith('http')) {
        return { url: imageBase64OrUri };
      }
      return {
        url: imageBase64OrUri,
        warning:
          'Cloudinary no está configurado en el servidor. Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env.',
      };
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    try {
      const result = await cloudinary.uploader.upload(imageBase64OrUri, {
        folder: 'yewi/portfolio',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Error al subir imagen a Cloudinary: ${err.message || 'Error desconocido'}`,
      );
    }
  }
}

