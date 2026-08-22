export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class PaginationDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
    get skip(): number;
    get take(): number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
