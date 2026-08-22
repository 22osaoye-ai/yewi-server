import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.socket.remoteAddress;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${method}] ${url} ${statusCode} - ${duration}ms [${ip}]`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode =
            err &&
            typeof err === 'object' &&
            'status' in err &&
            typeof err.status === 'number'
              ? err.status
              : 500;
          const message = err instanceof Error ? err.message : 'Error interno';
          this.logger.warn(
            `[${method}] ${url} ${statusCode} - ${duration}ms [${ip}] - ${message}`,
          );
        },
      }),
    );
  }
}
