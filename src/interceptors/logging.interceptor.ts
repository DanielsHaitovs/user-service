/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { safeStringify } from '@/utils/safeStringify';
import { getTraceId } from '@/utils/trace.util';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const traceId = getTraceId() ?? 'N/A';
    const { method, url, body } = req;

    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const start = Date.now();

    this.logger.log(
      `[Trace: ${traceId}] ⇢ ${method} ${url} → ${controllerName}.${handlerName} | Body: ${safeStringify(body)}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - start;
        // You can also optionally combine these two lines:
        this.logger.log(
          `[Trace: ${traceId}] ⇠ ${method} ${url} | Duration: ${duration}ms | Response: ${safeStringify(data)}`,
        );
      }),
    );
  }
}
