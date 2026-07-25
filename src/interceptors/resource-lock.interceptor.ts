import { RedisService } from '@/baseServices/redis.service';
import { getTraceId } from '@/utils/trace.util';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { FastifyRequest } from 'fastify';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class ResourceLockInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResourceLockInterceptor.name);

  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest<{ Params: { id?: string } }>>();

    const { id: resourceId } = request.params;

    if (resourceId == undefined) {
      return next.handle();
    }

    const { method, url } = request;

    if (url.includes('login')) {
      return next.handle();
    }

    const traceId = getTraceId() ?? 'N/A';

    const lockKey = `lock:role:${resourceId}`;

    const acquiredLock = await this.redisService.setUnique(
      lockKey,
      'PROCESSING',
      3,
    );

    if (acquiredLock === null) {
      throw new HttpException(
        'This resource is currently locked by another update process. Please wait a moment and retry.',
        HttpStatus.LOCKED,
      );
    }

    return next.handle().pipe(
      tap(() => {
        void this.redisService.delete(lockKey).catch((err: unknown) => {
          const errorObj =
            typeof err === 'object' && err !== null
              ? (err as Record<string, unknown>)
              : {};

          const message =
            typeof errorObj.message === 'string'
              ? errorObj.message
              : JSON.stringify(errorObj);

          const status =
            typeof errorObj.status === 'number' ||
            typeof errorObj.status === 'string'
              ? errorObj.status
              : 'N/A';

          const stack =
            typeof errorObj.stack === 'string' ? errorObj.stack : '';

          this.logger.error(
            {
              trace: `[Trace: ${traceId}] !! ${method} ${url} | Status: ${status.toString()}`,
              error: message,
            },
            stack,
            'Request Error Response',
          );
        });
      }),
      catchError((error: unknown) => {
        void this.redisService.delete(lockKey).catch((err: unknown) => {
          const errorObj =
            typeof err === 'object' && err !== null
              ? (err as Record<string, unknown>)
              : {};

          const message =
            typeof errorObj.message === 'string'
              ? errorObj.message
              : JSON.stringify(errorObj);

          const stack =
            typeof errorObj.stack === 'string' ? errorObj.stack : '';

          this.logger.error(
            {
              trace: `[Trace: ${traceId}] !! ${method} ${url} | Critical Lock Eviction Error`,
              error: message,
            },
            stack,
            'Lock Eviction Failure',
          );
        });

        return throwError(() => error);
      }),
    );
  }
}
