import { KycStatus } from '@prisma/client';
export declare class ReviewKycDto {
    status: KycStatus;
    rejectionReason?: string;
    badges?: string[];
}
export declare class ResolveDisputeDto {
    refundAmountClient: number;
    payoutAmountPro: number;
    resolutionNotes: string;
}
