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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const create_gig_order_dto_1 = require("./dto/create-gig-order.dto");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async createGigOrder(userId, dto) {
        return this.ordersService.createGigOrder(userId, dto);
    }
    async getMyOrders(userId, role) {
        return this.ordersService.getMyOrders(userId, role);
    }
    async getOrderById(userId, orderId) {
        return this.ordersService.getOrderById(userId, orderId);
    }
    async submitRequirements(userId, orderId, dto) {
        return this.ordersService.submitRequirements(userId, orderId, dto);
    }
    async submitDelivery(userId, orderId, dto) {
        return this.ordersService.submitDelivery(userId, orderId, dto);
    }
    async requestRevision(userId, orderId, dto) {
        return this.ordersService.requestRevision(userId, orderId, dto);
    }
    async approveDelivery(userId, orderId) {
        return this.ordersService.approveDelivery(userId, orderId);
    }
    async openDispute(userId, orderId, dto) {
        return this.ordersService.openDispute(userId, orderId, dto);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('gig'),
    (0, swagger_1.ApiOperation)({
        summary: 'Comprar un paquete de Gig y retener fondos en Escrow (Cliente)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Pedido creado exitosamente con fondos en Escrow',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_gig_order_dto_1.CreateGigOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createGigOrder", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar mis pedidos (como cliente o profesional)' }),
    (0, swagger_1.ApiQuery)({ name: 'role', enum: ['client', 'pro'], required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver detalle completo del pedido, entregas, chat y estado de Escrow',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Post)(':id/requirements'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar requerimientos para iniciar el pedido (Cliente)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_gig_order_dto_1.SubmitRequirementsDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "submitRequirements", null);
__decorate([
    (0, common_1.Post)(':id/deliveries'),
    (0, swagger_1.ApiOperation)({
        summary: 'Entregar trabajo final con archivos adjuntos (Profesional)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_gig_order_dto_1.SubmitDeliveryDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "submitDelivery", null);
__decorate([
    (0, common_1.Post)(':id/revisions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Solicitar cambios/revisión sobre una entrega (Cliente)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_gig_order_dto_1.RequestRevisionDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "requestRevision", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, swagger_1.ApiOperation)({
        summary: 'Aprobar entrega, completar pedido y liberar fondos de Escrow al profesional (Cliente)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "approveDelivery", null);
__decorate([
    (0, common_1.Post)(':id/dispute'),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir disputa en el centro de resolución' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_gig_order_dto_1.OpenDisputeDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "openDispute", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders (Gestión de Pedidos, Entregas, Revisiones & Escrow)'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map