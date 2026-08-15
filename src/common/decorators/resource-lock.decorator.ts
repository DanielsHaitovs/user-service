// resource-lock.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RESOURCE_LOCK_KEY = 'RESOURCE_LOCK_METADATA';

export interface ResourceLockOptions {
  name: string;
  paramKey?: string;
  ttl?: number;
}

export const ResourceLock = (
  name: string,
  options?: Omit<ResourceLockOptions, 'name'>,
): MethodDecorator =>
  SetMetadata(RESOURCE_LOCK_KEY, {
    name,
    paramKey: options?.paramKey ?? 'id',
    ttl: options?.ttl ?? 3,
  } satisfies ResourceLockOptions);
