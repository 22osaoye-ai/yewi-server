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
exports.ProfessionalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const geo_utils_1 = require("../../common/utils/geo.utils");
const prisma_service_1 = require("../../database/prisma.service");
let ProfessionalsService = class ProfessionalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(userId) {
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
            throw new common_1.NotFoundException('No tienes un perfil profesional creado');
        }
        return pro;
    }
    async updateMyProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { professionalProfile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const { categoryIds, ...proData } = dto;
        if (!user.roles.includes(client_1.UserRole.PROFESSIONAL)) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    roles: { set: [...user.roles, client_1.UserRole.PROFESSIONAL] },
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
    async getPublicProfile(id) {
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
            throw new common_1.NotFoundException('Profesional no encontrado');
        }
        return pro;
    }
    async findNearby(lat, lon, categoryId, skill) {
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
        const nearbyPros = pros
            .map((pro) => {
            const distanceKm = geo_utils_1.GeoUtils.calculateHaversineDistance(pro.latitude, pro.longitude, lat, lon);
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
    async addPortfolioItem(userId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Debes tener un perfil profesional activo');
        }
        return this.prisma.portfolioItem.create({
            data: {
                professionalProfileId: pro.id,
                ...dto,
            },
        });
    }
    async deletePortfolioItem(userId, itemId) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.ForbiddenException('Acceso denegado');
        }
        const item = await this.prisma.portfolioItem.findUnique({
            where: { id: itemId },
        });
        if (!item || item.professionalProfileId !== pro.id) {
            throw new common_1.NotFoundException('Elemento de portafolio no encontrado');
        }
        await this.prisma.portfolioItem.delete({
            where: { id: itemId },
        });
        return { message: 'Elemento eliminado correctamente' };
    }
    async submitKyc(userId, dto) {
        const pro = await this.prisma.professionalProfile.findUnique({
            where: { userId },
        });
        if (!pro) {
            throw new common_1.NotFoundException('Perfil profesional no encontrado');
        }
        return this.prisma.professionalProfile.update({
            where: { id: pro.id },
            data: {
                kycDocumentUrl: dto.documentUrl,
                kycStatus: client_1.KycStatus.PENDING_REVIEW,
            },
        });
    }
};
exports.ProfessionalsService = ProfessionalsService;
exports.ProfessionalsService = ProfessionalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfessionalsService);
//# sourceMappingURL=professionals.service.js.map