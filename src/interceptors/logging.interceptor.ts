import { safeStringify } from '@/utils/safeStringify';
import { getTraceId } from '@/utils/trace.util';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import type { FastifyRequest } from 'fastify';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    const traceId = getTraceId() ?? 'N/A';

    const { method, url } = req;
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const start = Date.now();

    this.logger.verbose(
      {
        trace: `[Trace: ${traceId}] -> ${method} ${url} -> ${controllerName}.${handlerName}`,
        request: safeStringify(req),
      },
      'Incoming Request',
    );

    return next.handle().pipe(
      tap((data: unknown) => {
        const duration = Date.now() - start;
        this.logger.verbose(
          {
            trace: `[Trace: ${traceId}] <- ${method} ${url}`,
            duration: `${duration.toString()}ms`,
            response: safeStringify(data),
          },
          'Outgoing Response',
        );
      }),
      catchError((err: unknown) => {
        const duration = Date.now() - start;

        const errorObj =
          typeof err === 'object' && err !== null
            ? (err as Record<string, unknown>)
            : {};
        const message =
          typeof errorObj.message === 'string'
            ? errorObj.message
            : safeStringify(errorObj);
        const status =
          typeof errorObj.status === 'number' ||
          typeof errorObj.status === 'string'
            ? errorObj.status
            : 'N/A';
        const stack = typeof errorObj.stack === 'string' ? errorObj.stack : '';

        this.logger.error(
          {
            trace: `[Trace: ${traceId}] !! ${method} ${url} | Status: ${status.toString()}`,
            duration: `${duration.toString()}ms`,
            error: message,
          },
          stack,
          'Request Error Response',
        );

        return throwError(() => err);
      }),
    );
  }
}
