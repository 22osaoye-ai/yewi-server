import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface PaginatedData<T> {
  data: T;
  meta: Record<string, unknown>;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode ?? 200;

    return next.handle().pipe(
      map((res: unknown) => {
        // If response has { data, meta } shape
        if (
          typeof res === 'object' &&
          res !== null &&
          'data' in res &&
          'meta' in res
        ) {
          const paginated = res as PaginatedData<T>;
          return {
            success: true,
            statusCode,
            timestamp: new Date().toISOString(),
            data: paginated.data,
            meta: paginated.meta,
          };
        }

        return {
          success: true,
          statusCode,
          timestamp: new Date().toISOString(),
          data: res as T,
        };
      }),
    );
  }
}
