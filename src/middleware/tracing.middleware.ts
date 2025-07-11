import {
  setRequestTrace,
  startTraceId,
  traceStorage,
} from '@/utils/trace.util';
import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const store = startTraceId(); // creates and returns a fresh context map

    traceStorage.run(store, () => {
      setRequestTrace(`${req.method} ${req.url}`);
      next();
    });
  }
}
