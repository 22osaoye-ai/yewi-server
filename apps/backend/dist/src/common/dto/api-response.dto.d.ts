export declare class ApiResponseDto<T> {
    success: boolean;
    statusCode: number;
    timestamp: string;
    data: T;
    meta?: Record<string, any>;
}
export declare class ApiErrorResponseDto {
    success: boolean;
    statusCode: number;
    timestamp: string;
    path: string;
    error: string;
    message: string | string[];
    details?: any;
}
