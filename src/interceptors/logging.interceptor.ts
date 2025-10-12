import { safeStringify } from '@/utils/safeStringify';
import { getTraceId } from '@/utils/trace.util';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { Request } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request<Record<string, unknown>, unknown, unknown>>();

    const traceId = getTraceId() ?? 'N/A';
    const { method, url, body } = req;
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const start = Date.now();

    if (method === 'GET') {
      this.logger.verbose(
        `[Trace: ${traceId}] -> ${method} ${url} -> ${controllerName}.${handlerName}`,
      );
    } else {
      this.logger.verbose(
        `[Trace: ${traceId}] -> ${method} ${url} -> ${controllerName}.${handlerName} | Body: ${safeStringify(body)}`,
      );
    }

    return next.handle().pipe(
      tap((data: unknown) => {
        const duration = Date.now() - start;
        this.logger.verbose(
          `[Trace: ${traceId}] <- ${method} ${url} | Duration: ${duration.toString()}ms | Response: ${safeStringify(data)}`,
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
          `[Trace: ${traceId}] !! ${method} ${url} | Duration: ${duration.toString()}ms | Status: ${status.toString()} | Error: ${message}`,
          stack,
        );

        return throwError(() => err);
      }),
    );
  }
}
