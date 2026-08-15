import { RedisService } from '@/baseServices/redis.service';
import { IDEMPOTENCY_OPTIONS_KEY } from '@/commonDecorators/idempotent.decorator';
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

import * as crypto from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { SYSTEM_ENDPOINTS } from '../base/system.enum';

interface IdempotencyCache {
  status: 'PROCESSING' | 'COMPLETED';
  statusCode?: number;
  response?: unknown;
}

interface IdempotencyOptions {
  ttl?: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly DEFAULT_TTL = 5000;

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<
      FastifyRequest<{ Body: Record<string, unknown> }> & {
        user?: { id: string };
      }
    >();
    const response = httpContext.getResponse<FastifyReply>();

    const options = this.reflector.getAllAndOverride<
      IdempotencyOptions | undefined
    >(IDEMPOTENCY_OPTIONS_KEY, [context.getHandler(), context.getClass()]);

    if (options === undefined) {
      return next.handle();
    }

    const { method, url, body, headers } = request;

    if (
      url.includes('login') ||
      SYSTEM_ENDPOINTS.some((endpoint) => url.includes(endpoint)) ||
      !['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())
    ) {
      return next.handle();
    }

    const traceId = getTraceId() ?? 'N/A';
    const userId = request.user?.id ?? 'anonymous';
    const redisKey = this.buildRedisKey(userId, method, url, body, headers);
    const ttl = options.ttl ?? this.DEFAULT_TTL;

    const acquiredLock = await this.redisService.setUnique(
      redisKey,
      JSON.stringify({ status: 'PROCESSING' }),
      ttl,
    );

    if (acquiredLock === null) {
      const cachedResponse = await this.handleExistingLock(redisKey, response);
      if (cachedResponse !== undefined) {
        return cachedResponse;
      }
    }

    return next.handle().pipe(
      tap((responsePayload: unknown) => {
        this.cacheResponse(
          redisKey,
          response.statusCode,
          responsePayload,
          ttl,
          traceId,
          method,
          url,
        );
      }),
      catchError((error: unknown) => {
        this.evictLockOnFailure(redisKey, traceId, method, url);
        return throwError(() => error);
      }),
    );
  }

  private buildRedisKey(
    userId: string,
    method: string,
    url: string,
    body: unknown,
    headers: FastifyRequest['headers'],
  ): string {
    const clientKey = this.extractClientKey(headers);
    const identifier =
      clientKey ?? this.generateDeterministicHash(method, url, body);

    return `idempotency:${userId}:${identifier}`;
  }

  private extractClientKey(
    headers: FastifyRequest['headers'],
  ): string | undefined {
    const rawKey = headers['idempotency-key'] ?? headers['x-idempotency-key'];

    if (typeof rawKey === 'string' && rawKey.trim() !== '') {
      const result = rawKey.trim();

      if (result.length > 0) {
        return result;
      }

      return undefined;
    }

    return undefined;
  }

  private async handleExistingLock(
    redisKey: string,
    response: FastifyReply,
  ): Promise<Observable<unknown> | undefined> {
    const existingRecord = await this.redisService.get(redisKey);

    if (existingRecord !== null) {
      const {
        status,
        response: cachedPayload,
        statusCode,
      } = JSON.parse(existingRecord) as IdempotencyCache;

      if (status === 'PROCESSING') {
        throw new HttpException(
          'A duplicate request is currently being processed. Please wait.',
          HttpStatus.CONFLICT,
        );
      }

      if (typeof statusCode === 'number') {
        response.status(statusCode);
      }

      return of(cachedPayload);
    }

    return undefined;
  }

  private cacheResponse(
    redisKey: string,
    statusCode: number,
    responsePayload: unknown,
    ttl: number,
    traceId: string,
    method: string,
    url: string,
  ): void {
    const cacheData: IdempotencyCache = {
      status: 'COMPLETED',
      statusCode,
      response: responsePayload,
    };

    void this.redisService
      .set(redisKey, JSON.stringify(cacheData), ttl)
      .catch((err: unknown) => {
        this.logError(err, traceId, method, url, 'Idempotency Save Error');
      });
  }

  private evictLockOnFailure(
    redisKey: string,
    traceId: string,
    method: string,
    url: string,
  ): void {
    void this.redisService.delete(redisKey).catch((err: unknown) => {
      this.logError(err, traceId, method, url, 'Idempotency Eviction Error');
    });
  }

  private generateDeterministicHash(
    method: string,
    url: string,
    body: unknown,
  ): string {
    const sortedBody =
      body !== undefined && body !== null ? this.sortObjectKeys(body) : '';
    return crypto
      .createHash('sha256')
      .update(`${method}:${url}:${JSON.stringify(sortedBody)}`)
      .digest('hex');
  }

  private sortObjectKeys(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sortObjectKeys(item));

    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  private logError(
    err: unknown,
    traceId: string,
    method: string,
    url: string,
    contextMessage: string,
  ): void {
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
      {
        trace: `[Trace: ${traceId}] ${method} ${url}`,
        error: message,
      },
      stack,
      contextMessage,
    );
  }
}
