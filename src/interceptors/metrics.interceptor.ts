import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    if (request.url === '/metrics') {
      return next.handle();
    }

    const endTimer = this.histogram.startTimer({
      method: request.method,
      route: request.routeOptions.url ?? request.url,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse<FastifyReply>();
          endTimer({ status_code: response.statusCode });
        },
        error: (err: unknown) => {
          const status =
            err instanceof HttpException
              ? err.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR;

          endTimer({ status_code: status });
        },
      }),
    );
  }
}
