export declare class CreateGigOrderDto {
    gigPackageId: string;
    extraIds?: string[];
    requirementsAnswers?: Record<string, any>;
}
export declare class SubmitRequirementsDto {
    requirementsAnswers: Record<string, any>;
}
export declare class SubmitDeliveryDto {
    message: string;
    attachmentUrls: string[];
}
export declare class RequestRevisionDto {
    revisionNotes: string;
}
export declare class OpenDisputeDto {
    reason: string;
    description: string;
    evidenceUrls?: string[];
}
