"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../common/cache/redis.service");
const prisma_service_1 = require("../../database/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    cache;
    CACHE_KEY_TREE = 'categories:tree';
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
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
        await this.cache.set(this.CACHE_KEY_TREE, rootCategories, 3600);
        return rootCategories;
    }
    async getBySlugOrId(identifier) {
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
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        await this.cache.set(cacheKey, category, 1800);
        return category;
    }
    async create(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('El slug de categoría ya existe');
        }
        const created = await this.prisma.category.create({
            data: dto,
        });
        await this.cache.delPattern('categories:*');
        return created;
    }
    async update(id, dto) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        const updated = await this.prisma.category.update({
            where: { id },
            data: dto,
        });
        await this.cache.delPattern('categories:*');
        return updated;
    }
    async delete(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        await this.prisma.category.delete({
            where: { id },
        });
        await this.cache.delPattern('categories:*');
        return { message: 'Categoría eliminada con éxito' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisCacheService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map