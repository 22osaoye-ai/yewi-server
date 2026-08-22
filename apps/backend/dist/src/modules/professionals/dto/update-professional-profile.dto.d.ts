export declare class UpdateProfessionalProfileDto {
    businessName?: string;
    taxId?: string;
    bio?: string;
    hourlyRate?: number;
    serviceRadiusKm?: number;
    latitude?: number;
    longitude?: number;
    city?: string;
    postalCode?: string;
    country?: string;
    address?: string;
    skills?: string[];
    categoryIds?: string[];
}
export declare class CreatePortfolioItemDto {
    title: string;
    description: string;
    imageUrls: string[];
    projectUrl?: string;
    tags?: string[];
}
export declare class SubmitKycDto {
    documentUrl: string;
}
