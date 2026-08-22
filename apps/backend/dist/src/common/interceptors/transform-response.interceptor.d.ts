import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface StandardResponse<T> {
    success: boolean;
    statusCode: number;
    timestamp: string;
    data: T;
    meta?: Record<string, unknown>;
}
export declare class TransformResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>>;
}
