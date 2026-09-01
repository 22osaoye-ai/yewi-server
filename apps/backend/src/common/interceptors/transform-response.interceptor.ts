import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

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
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode ?? 200;
    const isRawResponse = this.reflector.getAllAndOverride<boolean>(
      RAW_RESPONSE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((res: unknown) => {
        if (isRawResponse) {
          return res as StandardResponse<T>;
        }

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
