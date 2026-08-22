import { PackageTier } from '@prisma/client';
export declare class CreatePackageDto {
    tier: PackageTier;
    name: string;
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
    features?: Record<string, any>;
    isPopular?: boolean;
}
export declare class CreateExtraDto {
    title: string;
    description?: string;
    price: number;
    additionalDeliveryDays?: number;
}
export declare class CreateGigDto {
    title: string;
    slug: string;
    categoryId: string;
    description: string;
    searchTags?: string[];
    coverImages: string[];
    videoUrl?: string;
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
    requirements?: string[];
    packages: CreatePackageDto[];
    extras?: CreateExtraDto[];
}
