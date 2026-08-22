export declare class CreateQuoteProposalDto {
    price: number;
    estimatedDays: number;
    message: string;
    breakdown?: Record<string, any>;
    expiresAt?: string;
}
