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
exports.ProfessionalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const update_professional_profile_dto_1 = require("./dto/update-professional-profile.dto");
const professionals_service_1 = require("./professionals.service");
let ProfessionalsController = class ProfessionalsController {
    professionalsService;
    constructor(professionalsService) {
        this.professionalsService = professionalsService;
    }
    async getMyProfile(userId) {
        return this.professionalsService.getMyProfile(userId);
    }
    async updateMyProfile(userId, dto) {
        return this.professionalsService.updateMyProfile(userId, dto);
    }
    async findNearby(lat, lon, categoryId, skill) {
        return this.professionalsService.findNearby(parseFloat(lat), parseFloat(lon), categoryId, skill);
    }
    async getPublicProfile(id) {
        return this.professionalsService.getPublicProfile(id);
    }
    async addPortfolioItem(userId, dto) {
        return this.professionalsService.addPortfolioItem(userId, dto);
    }
    async deletePortfolioItem(userId, itemId) {
        return this.professionalsService.deletePortfolioItem(userId, itemId);
    }
    async submitKyc(userId, dto) {
        return this.professionalsService.submitKyc(userId, dto);
    }
};
exports.ProfessionalsController = ProfessionalsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener mi perfil profesional' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Perfil profesional con categorías y portafolio',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Put)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear o actualizar mi perfil profesional (radio de servicio, ubicación, tarifas)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Perfil profesional guardado exitosamente',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_professional_profile_dto_1.UpdateProfessionalProfileDto]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "updateMyProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar profesionales cercanos por coordenadas geográficas',
    }),
    (0, swagger_1.ApiQuery)({ name: 'lat', required: true, type: Number, example: 40.4168 }),
    (0, swagger_1.ApiQuery)({ name: 'lon', required: true, type: Number, example: -3.7038 }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'skill', required: false, type: String }),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lon')),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('skill')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "findNearby", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver perfil público de un profesional' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Perfil público, gigs activos, valoraciones y portafolio',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('me/portfolio'),
    (0, swagger_1.ApiOperation)({ summary: 'Añadir un proyecto al portafolio' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Proyecto añadido al portafolio' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_professional_profile_dto_1.CreatePortfolioItemDto]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "addPortfolioItem", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('me/portfolio/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un proyecto del portafolio' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "deletePortfolioItem", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('me/kyc'),
    (0, swagger_1.ApiOperation)({
        summary: 'Subir documento para verificación KYC de identidad',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Documento enviado a revisión' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_professional_profile_dto_1.SubmitKycDto]),
    __metadata("design:returntype", Promise)
], ProfessionalsController.prototype, "submitKyc", null);
exports.ProfessionalsController = ProfessionalsController = __decorate([
    (0, swagger_1.ApiTags)('Professionals (Perfiles Pro, Portafolio, Ubicación & KYC)'),
    (0, common_1.Controller)('professionals'),
    __metadata("design:paramtypes", [professionals_service_1.ProfessionalsService])
], ProfessionalsController);
//# sourceMappingURL=professionals.controller.js.map