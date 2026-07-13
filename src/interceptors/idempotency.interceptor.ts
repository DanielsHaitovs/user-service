import { IDEMPOTENCY_OPTIONS_KEY } from '@/commonDecorators/idempotent.decorator';
import { getTraceId } from '@/utils/trace.util';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import * as crypto from 'crypto';
import { FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface IdempotencyCache {
  status: 'PROCESSING' | 'COMPLETED';
  response?: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest<{ Body: Record<string, unknown> }> & {
        user?: { id: string };
      }
    >();

    const { method, url, body } = request;
    const traceId = getTraceId() ?? 'N/A';

    if (!['PUT', 'POST', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<
      { ttl?: number } | undefined
    >(IDEMPOTENCY_OPTIONS_KEY, [context.getHandler(), context.getClass()]);

    if (options == undefined) {
      return next.handle();
    }

    const userId = request.user?.id ?? 'anonymous';

    const payloadHash = crypto
      .createHash('sha256')
      .update(`${method}:${url}:${JSON.stringify(body)}`)
      .digest('hex');

    const redisKey = `idempotency:${userId}:${payloadHash}`;
    const ttl = options.ttl ?? 5;

    const existingLock = await this.redisClient.get(redisKey);

    if (existingLock !== null) {
      const { status, response } = JSON.parse(existingLock) as IdempotencyCache;

      if (status === 'PROCESSING') {
        throw new HttpException(
          'A duplicate request is currently being processed. Please wait.',
          HttpStatus.LOCKED,
        );
      }

      return of(response);
    }

    const acquiredLock = await this.redisClient.set(
      redisKey,
      JSON.stringify({ status: 'PROCESSING' }),
      'EX',
      ttl,
      'NX',
    );

    if (acquiredLock === null) {
      throw new HttpException(
        'A duplicate request is currently being processed. Please wait.',
        HttpStatus.LOCKED,
      );
    }

    return next.handle().pipe(
      tap((responsePayload: unknown) => {
        void this.redisClient
          .set(
            redisKey,
            JSON.stringify({
              status: 'COMPLETED',
              response: responsePayload,
            }),
            'EX',
            ttl,
          )
          .catch((err: unknown) => {
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
              'Idempotency Save Reflection Error',
            );
          });
      }),
      catchError((error: unknown) => {
        void this.redisClient.del(redisKey).catch((err: unknown) => {
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
              trace: `[Trace: ${traceId}] !! ${method} ${url} | Failed to evict processing key after crash`,
              error: message,
            },
            stack,
            'Idempotency Eviction Failure',
          );
        });

        return throwError(() => error);
      }),
    );
  }
}
