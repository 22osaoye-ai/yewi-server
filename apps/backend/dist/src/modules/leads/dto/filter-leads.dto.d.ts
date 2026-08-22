import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class FilterLeadsDto extends PaginationDto {
    categoryId?: string;
    city?: string;
    isUrgent?: boolean;
    onlyMatchingMyRadius?: boolean;
}
