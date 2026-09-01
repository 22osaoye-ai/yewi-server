import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GigStatus, PackageTier, Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateGigDto } from './dto/create-gig.dto';
import { FilterGigsDto, UpdateGigDto } from './dto/filter-gigs.dto';

@Injectable()
export class GigsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo Gig / Proyecto con paquetes o tarifa directa
   */
  async create(userId: string, dto: CreateGigDto) {
    const pro = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!pro) {
      throw new ForbiddenException(
        'Debes tener un perfil profesional para publicar proyectos y servicios',
      );
    }

    // 1. Resolve Category
    let targetCategoryId = dto.categoryId;
    if (!targetCategoryId && dto.category) {
      const cat = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: dto.category, mode: 'insensitive' } },
            { slug: dto.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
          ],
        },
      });
      if (cat) {
        targetCategoryId = cat.id;
      }
    }

    if (!targetCategoryId) {
      const firstCat = await this.prisma.category.findFirst({
        where: { isActive: true },
      });
      if (firstCat) {
        targetCategoryId = firstCat.id;
      } else {
        const newCat = await this.prisma.category.create({
          data: {
            name: dto.category || 'General',
            slug: `${(dto.category || 'general')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          },
        });
        targetCategoryId = newCat.id;
      }
    }

    // 2. Resolve Slug
    const baseSlug = (dto.title || 'proyecto')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = dto.slug || `${baseSlug}-${Date.now().toString(36)}`;

    const existingSlug = await this.prisma.gig.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('El slug del proyecto ya existe');
    }

    // 3. Resolve Packages
    const packages =
      dto.packages && dto.packages.length > 0
        ? dto.packages
        : [
            {
              tier: PackageTier.BASIC,
              name: 'Servicio / Proyecto',
              description: dto.description || dto.title,
              price: Number(dto.price || 50),
              deliveryDays: Number(dto.deliveryDays || 3),
              revisions: 1,
            },
          ];

    const {
      packages: _p,
      extras,
      category: _c,
      categoryId: _cid,
      price: _pr,
      deliveryDays: _dd,
      city: _ct,
      ...gigData
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const gig = await tx.gig.create({
        data: {
          ...gigData,
          slug,
          categoryId: targetCategoryId,
          coverImages: dto.coverImages || [],
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
              user: { select: { id: true, profile: true } },
            },
          },
        },
      });
    });
  }

  /**
   * Buscar y listar Gigs con filtros y paginación
   */
  /**
   * Buscar y listar Gigs con filtros y paginación
   */
  async findAll(filter: FilterGigsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.GigWhereInput = {
      status: GigStatus.ACTIVE,
      deletedAt: null,
    };

    const andConditions: Prisma.GigWhereInput[] = [];

    if (filter.categoryId) {
      andConditions.push({ categoryId: filter.categoryId });
    }

    if (filter.category) {
      const catList = filter.category
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (catList.length > 0) {
        const catOrs: Prisma.GigWhereInput[] = [];
        for (const cat of catList) {
          catOrs.push(
            { category: { name: { contains: cat, mode: 'insensitive' } } },
            { category: { slug: { contains: cat.toLowerCase() } } },
            { title: { contains: cat, mode: 'insensitive' } },
            { searchTags: { has: cat.toLowerCase() } },
          );
        }
        andConditions.push({ OR: catOrs });
      }
    }

    if (filter.minRating) {
      andConditions.push({ avgRating: { gte: filter.minRating } });
    }

    if (filter.isFeatured !== undefined) {
      andConditions.push({ isFeatured: filter.isFeatured });
    }

    if (filter.search) {
      const term = filter.search.trim();
      andConditions.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { searchTags: { has: term.toLowerCase() } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
          {
            professionalProfile: {
              OR: [
                { businessName: { contains: term, mode: 'insensitive' } },
                {
                  user: {
                    profile: {
                      OR: [
                        { displayName: { contains: term, mode: 'insensitive' } },
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        ],
      });
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      andConditions.push({
        packages: {
          some: {
            price: {
              ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
              ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
            },
          },
        },
      });
    }

    if (filter.deliveryDays !== undefined) {
      andConditions.push({
        packages: {
          some: {
            deliveryDays: { lte: filter.deliveryDays },
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const total = await this.prisma.gig.count({ where });
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    const gigs = await this.prisma.gig.findMany({
      where,
      skip: filter.skip,
      take: filter.take ?? limit,
      include: {
        packages: {
          orderBy: { price: 'asc' },
        },
        category: true,
        professionalProfile: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
            portfolioItems: true,
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
    if (!slugOrId || slugOrId === 'undefined' || slugOrId === 'null') {
      throw new NotFoundException('Gig no encontrado');
    }

    const trimmed = slugOrId.trim();

    const gig = await this.prisma.gig.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { slug: trimmed },
          { slug: trimmed.toLowerCase() },
          { title: { equals: trimmed, mode: 'insensitive' } },
        ],
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
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            portfolioItems: true,
            categories: true,
          },
        },
        reviews: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, profile: true },
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
