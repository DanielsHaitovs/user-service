import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import type { FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - start;

        const reply = ctx.switchToHttp().getResponse<FastifyReply>();

        reply.header('X-Response-Time', `${time.toString()}ms`);
      }),
    );
  }
}
