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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const buy_credits_dto_1 = require("./dto/buy-credits.dto");
let WalletService = WalletService_1 = class WalletService {
    prisma;
    paymentsService;
    logger = new common_1.Logger(WalletService_1.name);
    creditPackPricing = {
        [buy_credits_dto_1.CreditPack.STARTER]: { credits: 20, price: 19.0 },
        [buy_credits_dto_1.CreditPack.PROFESSIONAL]: { credits: 50, price: 45.0 },
        [buy_credits_dto_1.CreditPack.BUSINESS]: { credits: 100, price: 80.0 },
        [buy_credits_dto_1.CreditPack.ENTERPRISE]: { credits: 250, price: 180.0 },
    };
    constructor(prisma, paymentsService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
    }
    async getMyWallet(userId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: {
                    userId,
                    creditBalance: 0,
                    fiatAvailableBalance: 0,
                    fiatPendingBalance: 0,
                },
                include: {
                    transactions: true,
                },
            });
        }
        return wallet;
    }
    getCreditPackages() {
        return [
            {
                id: buy_credits_dto_1.CreditPack.STARTER,
                name: 'Pack Inicio',
                credits: 20,
                price: 19.0,
                discount: '5%',
            },
            {
                id: buy_credits_dto_1.CreditPack.PROFESSIONAL,
                name: 'Pack Profesional',
                credits: 50,
                price: 45.0,
                discount: '10%',
                popular: true,
            },
            {
                id: buy_credits_dto_1.CreditPack.BUSINESS,
                name: 'Pack Empresa',
                credits: 100,
                price: 80.0,
                discount: '20%',
            },
            {
                id: buy_credits_dto_1.CreditPack.ENTERPRISE,
                name: 'Pack Ilimitado',
                credits: 250,
                price: 180.0,
                discount: '28%',
            },
        ];
    }
    async createCreditPaymentIntent(userId, dto) {
        const packConfig = this.creditPackPricing[dto.pack];
        if (!packConfig) {
            throw new common_1.BadRequestException('Paquete de créditos inválido');
        }
        const wallet = await this.getMyWallet(userId);
        const paymentIntent = await this.paymentsService.createPaymentIntent(userId, {
            amount: packConfig.price,
            currency: 'EUR',
            paymentType: 'CREDIT_PURCHASE',
            referenceId: dto.pack,
        });
        const ledgerTx = await this.prisma.ledgerTransaction.create({
            data: {
                walletId: wallet.id,
                type: client_1.TransactionType.CREDIT_PURCHASE,
                amount: packConfig.price,
                creditAmount: packConfig.credits,
                currency: 'EUR',
                status: client_1.TransactionStatus.PENDING,
                metadata: {
                    paymentIntentId: paymentIntent.paymentIntentId,
                    pack: dto.pack,
                    credits: packConfig.credits,
                    price: packConfig.price,
                },
            },
        });
        return {
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            amount: packConfig.price,
            credits: packConfig.credits,
            pack: dto.pack,
            transactionId: ledgerTx.id,
        };
    }
    async confirmCreditPayment(userId, dto) {
        const wallet = await this.getMyWallet(userId);
        const pendingTx = await this.prisma.ledgerTransaction.findFirst({
            where: {
                walletId: wallet.id,
                type: client_1.TransactionType.CREDIT_PURCHASE,
                metadata: {
                    path: ['paymentIntentId'],
                    equals: dto.paymentIntentId,
                },
            },
        });
        if (!pendingTx) {
            throw new common_1.BadRequestException('No se encontró una orden de compra pendiente para este pago.');
        }
        if (pendingTx.status === client_1.TransactionStatus.COMPLETED) {
            return {
                success: true,
                message: 'El pago ya ha sido procesado anteriormente.',
                purchasedCredits: pendingTx.creditAmount,
                newCreditBalance: wallet.creditBalance,
            };
        }
        const creditAmount = pendingTx.creditAmount || 0;
        if (creditAmount <= 0) {
            throw new common_1.BadRequestException('Cantidad de créditos inválida en la transacción.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.ledgerTransaction.update({
                where: { id: pendingTx.id },
                data: {
                    status: client_1.TransactionStatus.COMPLETED,
                },
            });
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    creditBalance: { increment: creditAmount },
                },
            });
            this.logger.log(`Pago verificado: ${creditAmount} créditos añadidos al usuario ${userId}. Nuevo saldo: ${updatedWallet.creditBalance}`);
            return {
                success: true,
                message: `¡Pago verificado! Has recibido ${creditAmount} créditos.`,
                purchasedCredits: creditAmount,
                newCreditBalance: updatedWallet.creditBalance,
            };
        });
    }
    async buyCredits(userId, dto) {
        const intent = await this.createCreditPaymentIntent(userId, {
            pack: dto.pack,
        });
        return this.confirmCreditPayment(userId, {
            paymentIntentId: intent.paymentIntentId,
        });
    }
    async requestPayout(userId, dto) {
        const wallet = await this.getMyWallet(userId);
        const availableNum = Number(wallet.fiatAvailableBalance);
        if (availableNum < dto.amount) {
            throw new common_1.BadRequestException(`Saldo disponible insuficiente para retirar. Saldo actual: ${availableNum} €`);
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    fiatAvailableBalance: { decrement: dto.amount },
                },
            });
            const txRecord = await tx.ledgerTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.PAYOUT_WITHDRAWAL,
                    amount: -dto.amount,
                    currency: 'EUR',
                    status: client_1.TransactionStatus.PENDING,
                    metadata: {
                        destinationAccount: dto.destinationAccount,
                    },
                },
            });
            return {
                success: true,
                message: `Solicitud de retiro de ${dto.amount} € registrada correctamente`,
                transactionId: txRecord.id,
                newAvailableBalance: updated.fiatAvailableBalance,
            };
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map