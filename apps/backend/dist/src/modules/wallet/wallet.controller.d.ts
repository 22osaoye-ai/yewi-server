import { BuyCreditsDto, ConfirmCreditPaymentDto, CreateCreditPaymentIntentDto, RequestPayoutDto } from './dto/buy-credits.dto';
import { WalletService } from './wallet.service';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getCreditPackages(): ({
        id: import("./dto/buy-credits.dto").CreditPack;
        name: string;
        credits: number;
        price: number;
        discount: string;
        popular?: undefined;
    } | {
        id: import("./dto/buy-credits.dto").CreditPack;
        name: string;
        credits: number;
        price: number;
        discount: string;
        popular: boolean;
    })[];
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
    createCreditPaymentIntent(userId: string, dto: CreateCreditPaymentIntentDto): Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
        amount: number;
        credits: number;
        pack: import("./dto/buy-credits.dto").CreditPack;
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
