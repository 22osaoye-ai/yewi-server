import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisCacheService } from '../../common/cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  private readonly CACHE_KEY_TREE = 'categories:tree';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Obtener árbol jerárquico de categorías activas (con soporte de caché Redis)
   */
  async getCategoryTree() {
    const cached = await this.cache.get(this.CACHE_KEY_TREE);
    if (cached) {
      return cached;
    }

    const rootCategories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Cachear por 1 hora (3600s)
    await this.cache.set(this.CACHE_KEY_TREE, rootCategories, 3600);

    return rootCategories;
  }

  /**
   * Obtener categoría por ID o Slug
   */
  async getBySlugOrId(identifier: string) {
    const cacheKey = `categories:item:${identifier}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        subcategories: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.cache.set(cacheKey, category, 1800);
    return category;
  }

  /**
   * Crear nueva categoría (Admin)
   */
  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('El slug de categoría ya existe');
    }

    const created = await this.prisma.category.create({
      data: dto,
    });

    await this.cache.delPattern('categories:*');
    return created;
  }

  /**
   * Actualizar categoría (Admin)
   */
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    await this.cache.delPattern('categories:*');
    return updated;
  }

  /**
   * Eliminar categoría (Admin)
   */
  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    await this.cache.delPattern('categories:*');
    return { message: 'Categoría eliminada con éxito' };
  }
}
