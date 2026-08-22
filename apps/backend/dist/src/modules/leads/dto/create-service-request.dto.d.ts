export declare class CreateServiceRequestDto {
    categoryId: string;
    title: string;
    description: string;
    questionnaireAnswers: Record<string, any>;
    budgetMin?: number;
    budgetMax?: number;
    isUrgent?: boolean;
    preferredDate?: string;
    postalCode: string;
    city: string;
    country?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isRemote?: boolean;
}
