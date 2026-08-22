import { RedisCacheService } from '../../common/cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
export declare class CategoriesService {
    private readonly prisma;
    private readonly cache;
    private readonly CACHE_KEY_TREE;
    constructor(prisma: PrismaService, cache: RedisCacheService);
    getCategoryTree(): Promise<{}>;
    getBySlugOrId(identifier: string): Promise<{}>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        bannerUrl: string | null;
        type: import("@prisma/client").$Enums.CategoryType;
        formSchema: import("@prisma/client/runtime/client").JsonValue | null;
        baseLeadCreditCost: number;
        sortOrder: number;
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
        bannerUrl: string | null;
        type: import("@prisma/client").$Enums.CategoryType;
        formSchema: import("@prisma/client/runtime/client").JsonValue | null;
        baseLeadCreditCost: number;
        sortOrder: number;
        parentId: string | null;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
