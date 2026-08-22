import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { BuyCreditsDto, ConfirmCreditPaymentDto, CreateCreditPaymentIntentDto, CreditPack, RequestPayoutDto } from './dto/buy-credits.dto';
export declare class WalletService {
    private readonly prisma;
    private readonly paymentsService;
    private readonly logger;
    private readonly creditPackPricing;
    constructor(prisma: PrismaService, paymentsService: PaymentsService);
    getMyWallet(userId: string): Promise<{
        transactions: {
            id: string;
            currency: string;
            createdAt: Date;
            walletId: string;
            type: import("@prisma/client").$Enums.TransactionType;
            amount: import("@prisma/client/runtime/client").Decimal;
            creditAmount: number | null;
            status: import("@prisma/client").$Enums.TransactionStatus;
            stripePaymentIntentId: string | null;
            stripeTransferId: string | null;
            referenceId: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
    } & {
        id: string;
        userId: string;
        creditBalance: number;
        fiatPendingBalance: import("@prisma/client/runtime/client").Decimal;
        fiatAvailableBalance: import("@prisma/client/runtime/client").Decimal;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCreditPackages(): ({
        id: CreditPack;
        name: string;
        credits: number;
        price: number;
        discount: string;
        popular?: undefined;
    } | {
        id: CreditPack;
        name: string;
        credits: number;
        price: number;
        discount: string;
        popular: boolean;
    })[];
    createCreditPaymentIntent(userId: string, dto: CreateCreditPaymentIntentDto): Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
        amount: number;
        credits: number;
        pack: CreditPack;
        transactionId: string;
    }>;
    confirmCreditPayment(userId: string, dto: ConfirmCreditPaymentDto): Promise<{
        success: boolean;
        message: string;
        purchasedCredits: number | null;
        newCreditBalance: number;
    }>;
    buyCredits(userId: string, dto: BuyCreditsDto): Promise<{
        success: boolean;
        message: string;
        purchasedCredits: number | null;
        newCreditBalance: number;
    }>;
    requestPayout(userId: string, dto: RequestPayoutDto): Promise<{
        success: boolean;
        message: string;
        transactionId: string;
        newAvailableBalance: import("@prisma/client/runtime/client").Decimal;
    }>;
}
