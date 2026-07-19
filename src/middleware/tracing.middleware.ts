import {
  setRequestTrace,
  startTraceId,
  traceStorage,
} from '@/utils/trace.util';
import { Injectable, NestMiddleware } from '@nestjs/common';

import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    const store = startTraceId();

    traceStorage.run(store, () => {
      setRequestTrace(`${req.method} ${req.url}`);
      next();
    });
  }
}
