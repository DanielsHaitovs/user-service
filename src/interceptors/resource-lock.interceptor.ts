import { RedisService } from '@/baseServices/redis.service';
import {
  RESOURCE_LOCK_KEY,
  ResourceLockOptions,
} from '@/commonDecorators/resource-lock.decorator';
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
import { Reflector } from '@nestjs/core';

import { FastifyRequest } from 'fastify';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class ResourceLockInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResourceLockInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const httpContext = context.switchToHttp();
    const request =
      httpContext.getRequest<
        FastifyRequest<{ Params: Record<string, string | undefined> }>
      >();

    const { method, url, params } = request;

    const options = this.reflector.getAllAndOverride<
      ResourceLockOptions | undefined
    >(RESOURCE_LOCK_KEY, [context.getHandler(), context.getClass()]);

    if (options === undefined) {
      return next.handle();
    }

    if ('GET' === method.toUpperCase()) {
      return next.handle();
    }

    const paramKey = options.paramKey ?? 'id';
    const resourceId = params[paramKey];

    if (typeof resourceId !== 'string' || resourceId.trim() === '') {
      return next.handle();
    }

    const traceId = getTraceId() ?? 'N/A';
    const lockKey = `lock:${options.name}:${resourceId.trim()}`;
    const ttl = options.ttl ?? 3;

    const acquiredLock = await this.redisService.setUnique(
      lockKey,
      'PROCESSING',
      ttl,
    );

    if (acquiredLock === null) {
      throw new HttpException(
        `Resource '${options.name}' (${resourceId}) is currently being updated. Please try again.`,
        HttpStatus.LOCKED,
      );
    }

    return next.handle().pipe(
      tap(() => {
        this.releaseLock(lockKey, traceId, method, url);
      }),
      catchError((error: unknown) => {
        this.releaseLock(lockKey, traceId, method, url);
        return throwError(() => error);
      }),
    );
  }

  private releaseLock(
    lockKey: string,
    traceId: string,
    method: string,
    url: string,
  ): void {
    void this.redisService.delete(lockKey).catch((err: unknown) => {
      const errorObj =
        typeof err === 'object' && err !== null
          ? (err as Record<string, unknown>)
          : {};
      const message =
        typeof errorObj.message === 'string'
          ? errorObj.message
          : JSON.stringify(errorObj);
      const stack = typeof errorObj.stack === 'string' ? errorObj.stack : '';

      this.logger.error(
        { trace: `[Trace: ${traceId}] ${method} ${url}`, error: message },
        stack,
        'Lock Eviction Error',
      );
    });
  }
}
