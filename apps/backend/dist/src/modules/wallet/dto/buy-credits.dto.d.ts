export declare enum CreditPack {
    STARTER = "STARTER",
    PROFESSIONAL = "PROFESSIONAL",
    BUSINESS = "BUSINESS",
    ENTERPRISE = "ENTERPRISE"
}
export declare class BuyCreditsDto {
    pack: CreditPack;
    paymentMethodId?: string;
}
export declare class CreateCreditPaymentIntentDto {
    pack: CreditPack;
}
export declare class ConfirmCreditPaymentDto {
    paymentIntentId: string;
}
export declare class RequestPayoutDto {
    amount: number;
    destinationAccount: string;
}
