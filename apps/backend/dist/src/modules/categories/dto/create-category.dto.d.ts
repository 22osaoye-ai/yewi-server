import { CategoryType } from '@prisma/client';
export declare class CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    bannerUrl?: string;
    type?: CategoryType;
    parentId?: string;
    formSchema?: Record<string, any>;
    baseLeadCreditCost?: number;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    bannerUrl?: string;
    type?: CategoryType;
    parentId?: string;
    formSchema?: Record<string, any>;
    baseLeadCreditCost?: number;
    sortOrder?: number;
    isActive?: boolean;
}
