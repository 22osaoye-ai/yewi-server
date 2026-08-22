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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_gig_dto_1 = require("./dto/create-gig.dto");
const filter_gigs_dto_1 = require("./dto/filter-gigs.dto");
const gigs_service_1 = require("./gigs.service");
let GigsController = class GigsController {
    gigsService;
    constructor(gigsService) {
        this.gigsService = gigsService;
    }
    async findAll(filter) {
        return this.gigsService.findAll(filter);
    }
    async getMyGigs(userId) {
        return this.gigsService.getMyGigs(userId);
    }
    async findBySlug(slugOrId) {
        return this.gigsService.findBySlug(slugOrId);
    }
    async create(userId, dto) {
        return this.gigsService.create(userId, dto);
    }
    async update(userId, gigId, dto) {
        return this.gigsService.update(userId, gigId, dto);
    }
    async delete(userId, gigId) {
        return this.gigsService.delete(userId, gigId);
    }
};
exports.GigsController = GigsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Explorar catálogo de Gigs con filtros de búsqueda, categoría, precio y entrega',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista paginada de gigs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_gigs_dto_1.FilterGigsDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('my-gigs'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar mis gigs publicados como profesional' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "getMyGigs", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slugOrId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver detalle de un Gig (paquetes Básico/Estándar/Premium, extras, reseñas)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalle del gig' }),
    __param(0, (0, common_1.Param)('slugOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear nuevo Gig con paquetes multinivel y extras (Profesionales)',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Gig publicado con éxito' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_gig_dto_1.CreateGigDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar Gig existente y sus paquetes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, filter_gigs_dto_1.UpdateGigDto]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar (desactivar) Gig' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GigsController.prototype, "delete", null);
exports.GigsController = GigsController = __decorate([
    (0, swagger_1.ApiTags)('Gigs (Servicios Embalados Estilo Fiverr)'),
    (0, common_1.Controller)('gigs'),
    __metadata("design:paramtypes", [gigs_service_1.GigsService])
], GigsController);
//# sourceMappingURL=gigs.controller.js.map