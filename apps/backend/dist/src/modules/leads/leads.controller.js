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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_quote_proposal_dto_1 = require("./dto/create-quote-proposal.dto");
const create_service_request_dto_1 = require("./dto/create-service-request.dto");
const filter_leads_dto_1 = require("./dto/filter-leads.dto");
const leads_service_1 = require("./leads.service");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    async createRequest(userId, dto) {
        return this.leadsService.createRequest(userId, dto);
    }
    async getMyRequests(userId) {
        return this.leadsService.getMyRequests(userId);
    }
    async findOpportunitiesForPro(userId, filter) {
        return this.leadsService.findOpportunitiesForPro(userId, filter);
    }
    async unlockLead(userId, requestId) {
        return this.leadsService.unlockLead(userId, requestId);
    }
    async sendQuoteProposal(userId, requestId, dto) {
        return this.leadsService.sendQuoteProposal(userId, requestId, dto);
    }
    async acceptProposal(userId, proposalId) {
        return this.leadsService.acceptProposal(userId, proposalId);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)('requests'),
    (0, swagger_1.ApiOperation)({
        summary: 'Publicar una nueva solicitud de servicio / proyecto (Cliente)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Solicitud creada y lista para matching',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_service_request_dto_1.CreateServiceRequestDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('my-requests'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver mis solicitudes publicadas con presupuestos recibidos (Cliente)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, common_1.Get)('opportunities'),
    (0, swagger_1.ApiOperation)({
        summary: 'Explorar solicitudes de trabajo para profesionales con cálculo de distancia',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de oportunidades (datos sensibles ocultos hasta desbloquear)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, filter_leads_dto_1.FilterLeadsDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "findOpportunitiesForPro", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, common_1.Post)('requests/:id/unlock'),
    (0, swagger_1.ApiOperation)({
        summary: 'Desbloquear datos de contacto de una solicitud usando créditos (Máx. 5 profesionales)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Datos de contacto completos del cliente y saldo actualizado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "unlockLead", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PROFESSIONAL),
    (0, common_1.Post)('requests/:id/proposals'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar presupuesto a una solicitud previamente desbloqueada (Profesional)',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Presupuesto enviado al cliente' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_quote_proposal_dto_1.CreateQuoteProposalDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "sendQuoteProposal", null);
__decorate([
    (0, common_1.Post)('proposals/:id/accept'),
    (0, swagger_1.ApiOperation)({
        summary: 'Aceptar un presupuesto y formalizar pedido con Escrow (Cliente)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Presupuesto aceptado y pedido en progreso creado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "acceptProposal", null);
exports.LeadsController = LeadsController = __decorate([
    (0, swagger_1.ApiTags)('Leads & Service Requests (Solicitudes ProntoPro, Matching & Presupuestos)'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map