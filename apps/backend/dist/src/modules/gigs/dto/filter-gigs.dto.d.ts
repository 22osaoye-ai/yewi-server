import { GigStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateExtraDto, CreatePackageDto } from './create-gig.dto';
export declare class UpdateGigDto {
    title?: string;
    categoryId?: string;
    description?: string;
    searchTags?: string[];
    coverImages?: string[];
    videoUrl?: string;
    faqs?: Array<{
        question: string;
        answer: string;
    }>;
    requirements?: string[];
    status?: GigStatus;
    packages?: CreatePackageDto[];
    extras?: CreateExtraDto[];
}
export declare class FilterGigsDto extends PaginationDto {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    deliveryDays?: number;
    minRating?: number;
    isFeatured?: boolean;
}
