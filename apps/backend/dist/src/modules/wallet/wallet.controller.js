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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const buy_credits_dto_1 = require("./dto/buy-credits.dto");
const wallet_service_1 = require("./wallet.service");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    getCreditPackages() {
        return this.walletService.getCreditPackages();
    }
    async getMyWallet(userId) {
        return this.walletService.getMyWallet(userId);
    }
    async createCreditPaymentIntent(userId, dto) {
        return this.walletService.createCreditPaymentIntent(userId, dto);
    }
    async confirmCreditPayment(userId, dto) {
        return this.walletService.confirmCreditPayment(userId, dto);
    }
    async buyCredits(userId, dto) {
        return this.walletService.buyCredits(userId, dto);
    }
    async requestPayout(userId, dto) {
        return this.walletService.requestPayout(userId, dto);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('packages'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver paquetes y precios de créditos disponibles para profesionales',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getCreditPackages", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver saldo de créditos, balance fiat y transacciones recientes',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Billetera del usuario con balance de créditos y fiat',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('buy-credits/intent'),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear PaymentIntent seguro en la pasarela de pagos para compra de créditos',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Intención de pago generada para procesar con Stripe/Escrow',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, buy_credits_dto_1.CreateCreditPaymentIntentDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "createCreditPaymentIntent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('buy-credits/confirm'),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirmar pago verificado por la pasarela y acreditar créditos en billetera',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Créditos acreditados tras verificación criptográfica',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, buy_credits_dto_1.ConfirmCreditPaymentDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "confirmCreditPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('buy-credits'),
    (0, swagger_1.ApiOperation)({
        summary: 'Comprar paquete de créditos procesando el pago en pasarela',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Créditos acreditados en la billetera tras pago verificado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, buy_credits_dto_1.BuyCreditsDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "buyCredits", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('request-payout'),
    (0, swagger_1.ApiOperation)({
        summary: 'Solicitar retiro de ganancias fiat a cuenta bancaria (Profesionales)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retiro solicitado' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, buy_credits_dto_1.RequestPayoutDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "requestPayout", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet & Credits (Billetera, Recarga de Créditos & Retiros)'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map