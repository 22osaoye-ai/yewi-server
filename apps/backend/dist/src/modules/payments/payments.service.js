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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../../database/prisma.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    configService;
    prisma;
    logger = new common_1.Logger(PaymentsService_1.name);
    stripe;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const apiKey = this.configService.get('STRIPE_SECRET_KEY') ||
            'sk_test_placeholder';
        this.stripe = new stripe_1.default(apiKey, {
            apiVersion: '2026-01-28.acacia',
        });
    }
    async createPaymentIntent(userId, dto) {
        try {
            const amountInCents = Math.round(dto.amount * 100);
            const secretKey = this.configService.get('STRIPE_SECRET_KEY');
            if (!secretKey || secretKey.includes('placeholder')) {
                return {
                    clientSecret: `pi_mock_${Date.now()}_secret_${Date.now()}`,
                    paymentIntentId: `pi_mock_${Date.now()}`,
                    amount: dto.amount,
                    currency: dto.currency || 'EUR',
                    status: 'requires_payment_method',
                    isMock: true,
                };
            }
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: dto.currency.toLowerCase(),
                metadata: {
                    userId,
                    paymentType: dto.paymentType ?? 'GIG_PURCHASE',
                    referenceId: dto.referenceId ?? '',
                },
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: dto.amount,
                currency: dto.currency,
                status: paymentIntent.status,
            };
        }
        catch (error) {
            this.logger.error('Error al crear PaymentIntent en Stripe:', error);
            throw new common_1.BadRequestException('Error al inicializar la pasarela de pagos');
        }
    }
    handleWebhook(signature, payload) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret || webhookSecret.includes('placeholder')) {
            return { received: true, simulated: true };
        }
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    this.logger.log(`Pago recibido con éxito: ${paymentIntent.id}`);
                    break;
                }
                default:
                    this.logger.log(`Evento de Stripe no manejado: ${event.type}`);
            }
            return { received: true };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error procesando webhook';
            this.logger.error(`Error en Webhook de Stripe: ${message}`);
            throw new common_1.BadRequestException(`Webhook Error: ${message}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map