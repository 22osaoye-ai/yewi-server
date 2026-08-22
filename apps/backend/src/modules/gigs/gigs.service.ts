import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GigStatus, Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateGigDto } from './dto/create-gig.dto';
import { FilterGigsDto, UpdateGigDto } from './dto/filter-gigs.dto';

@Injectable()
export class GigsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo Gig con paquetes y extras (Fiverr Style)
   */
  async create(userId: string, dto: CreateGigDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException(
        'Debes tener un perfil profesional para publicar gigs',
      );
    }

    const existingSlug = await this.prisma.gig.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('El slug del gig ya existe');
    }

    if (!dto.packages || dto.packages.length === 0) {
      throw new BadRequestException(
        'Debes incluir al menos un paquete (Básico)',
      );
    }

    const { packages, extras, ...gigData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const gig = await tx.gig.create({
        data: {
          ...gigData,
          professionalProfileId: pro.id,
          status: GigStatus.ACTIVE,
        },
      });

      // Crear paquetes
      for (const pkg of packages) {
        await tx.gigPackage.create({
          data: {
            ...pkg,
            gigId: gig.id,
          },
        });
      }

      // Crear extras si existen
      if (extras && extras.length > 0) {
        for (const ext of extras) {
          await tx.gigExtra.create({
            data: {
              ...ext,
              gigId: gig.id,
            },
          });
        }
      }

      return tx.gig.findUnique({
        where: { id: gig.id },
        include: {
          packages: true,
          extras: true,
          category: true,
          professionalProfile: {
            include: {
              user: { select: { profile: true } },
            },
          },
        },
      });
    });
  }

  /**
   * Buscar y listar Gigs con filtros y paginación
   */
  async findAll(filter: FilterGigsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.GigWhereInput = {
      status: GigStatus.ACTIVE,
      deletedAt: null,
    };

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.minRating) {
      where.avgRating = { gte: filter.minRating };
    }

    if (filter.isFeatured !== undefined) {
      where.isFeatured = filter.isFeatured;
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { searchTags: { has: filter.search.toLowerCase() } },
      ];
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.packages = {
        some: {
          price: {
            ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
            ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
          },
        },
      };
    }

    if (filter.deliveryDays !== undefined) {
      where.packages = {
        some: {
          deliveryDays: { lte: filter.deliveryDays },
        },
      };
    }

    const total = await this.prisma.gig.count({ where });
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    const gigs = await this.prisma.gig.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      include: {
        packages: {
          orderBy: { price: 'asc' },
        },
        category: true,
        professionalProfile: {
          include: {
            user: { select: { profile: true } },
          },
        },
      },
      orderBy: { [filter.sortBy ?? 'createdAt']: filter.sortOrder ?? 'desc' },
    });

    return {
      data: gigs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Obtener detalle completo de un Gig por Slug o ID
   */
  async findBySlug(slugOrId: string) {
    const gig = await this.prisma.gig.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        deletedAt: null,
      },
      include: {
        packages: {
          orderBy: { price: 'asc' },
        },
        extras: true,
        category: true,
        professionalProfile: {
          include: {
            user: { select: { profile: true } },
            portfolioItems: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { profile: true },
            },
          },
        },
      },
    });

    if (!gig) {
      throw new NotFoundException('Gig no encontrado');
    }

    return gig;
  }

  /**
   * Obtener los gigs publicados por el profesional autenticado
   */
  async getMyGigs(userId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Debes tener un perfil profesional');
    }

    return this.prisma.gig.findMany({
      where: {
        professionalProfileId: pro.id,
        deletedAt: null,
      },
      include: {
        packages: true,
        extras: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Actualizar un Gig
   */
  async update(userId: string, gigId: string, dto: UpdateGigDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Acceso denegado');
    }

    const gig = await this.prisma.gig.findUnique({
      where: { id: gigId },
    });

    if (!gig || gig.professionalProfileId !== pro.id) {
      throw new NotFoundException('Gig no encontrado o no te pertenece');
    }

    const { packages, extras, ...gigData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      await tx.gig.update({
        where: { id: gigId },
        data: gigData,
      });

      // Si se envían paquetes, actualizarlos/reemplazarlos
      if (packages) {
        await tx.gigPackage.deleteMany({ where: { gigId } });
        for (const pkg of packages) {
          await tx.gigPackage.create({
            data: { ...pkg, gigId },
          });
        }
      }

      // Si se envían extras, actualizarlos/reemplazarlos
      if (extras) {
        await tx.gigExtra.deleteMany({ where: { gigId } });
        for (const ext of extras) {
          await tx.gigExtra.create({
            data: { ...ext, gigId },
          });
        }
      }

      return tx.gig.findUnique({
        where: { id: gigId },
        include: { packages: true, extras: true, category: true },
      });
    });
  }

  /**
   * Eliminar suavemente (Soft delete) un Gig
   */
  async delete(userId: string, gigId: string) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException('Acceso denegado');
    }

    const gig = await this.prisma.gig.findUnique({
      where: { id: gigId },
    });

    if (!gig || gig.professionalProfileId !== pro.id) {
      throw new NotFoundException('Gig no encontrado o no te pertenece');
    }

    await this.prisma.gig.update({
      where: { id: gigId },
      data: { deletedAt: new Date(), status: GigStatus.PAUSED },
    });

    return { message: 'Gig eliminado con éxito' };
  }
}
