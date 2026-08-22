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
exports.GigsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let GigsService = class GigsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Debes tener un perfil profesional para publicar gigs');
        }
        const existingSlug = await this.prisma.gig.findUnique({
            where: { slug: dto.slug },
        });
        if (existingSlug) {
            throw new common_1.ConflictException('El slug del gig ya existe');
        }
        if (!dto.packages || dto.packages.length === 0) {
            throw new common_1.BadRequestException('Debes incluir al menos un paquete (Básico)');
        }
        const { packages, extras, ...gigData } = dto;
        return this.prisma.$transaction(async (tx) => {
            const gig = await tx.gig.create({
                data: {
                    ...gigData,
                    professionalProfileId: pro.id,
                    status: client_1.GigStatus.ACTIVE,
                },
            });
            for (const pkg of packages) {
                await tx.gigPackage.create({
                    data: {
                        ...pkg,
                        gigId: gig.id,
                    },
                });
            }
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
    async findAll(filter) {
        const where = {
            status: client_1.GigStatus.ACTIVE,
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
    async findBySlug(slugOrId) {
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
            throw new common_1.NotFoundException('Gig no encontrado');
        }
        return gig;
    }
    async getMyGigs(userId) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Debes tener un perfil profesional');
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
    async update(userId, gigId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        const gig = await this.prisma.gig.findUnique({
            where: { id: gigId },
        });
        if (!gig || gig.professionalProfileId !== pro.id) {
            throw new common_1.NotFoundException('Gig no encontrado o no te pertenece');
        }
        const { packages, extras, ...gigData } = dto;
        return this.prisma.$transaction(async (tx) => {
            await tx.gig.update({
                where: { id: gigId },
                data: gigData,
            });
            if (packages) {
                await tx.gigPackage.deleteMany({ where: { gigId } });
                for (const pkg of packages) {
                    await tx.gigPackage.create({
                        data: { ...pkg, gigId },
                    });
                }
            }
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
    async delete(userId, gigId) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        const gig = await this.prisma.gig.findUnique({
            where: { id: gigId },
        });
        if (!gig || gig.professionalProfileId !== pro.id) {
            throw new common_1.NotFoundException('Gig no encontrado o no te pertenece');
        }
        await this.prisma.gig.update({
            where: { id: gigId },
            data: { deletedAt: new Date(), status: client_1.GigStatus.PAUSED },
        });
        return { message: 'Gig eliminado con éxito' };
    }
};
exports.GigsService = GigsService;
exports.GigsService = GigsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GigsService);
//# sourceMappingURL=gigs.service.js.map