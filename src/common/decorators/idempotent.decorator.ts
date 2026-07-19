import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_OPTIONS_KEY = 'idempotency_options';

export interface IdempotencyOptions {
  ttl?: number;
}

export const Idempotent = (options: IdempotencyOptions = {}): MethodDecorator =>
  SetMetadata(IDEMPOTENCY_OPTIONS_KEY, { ttl: 10, ...options });
