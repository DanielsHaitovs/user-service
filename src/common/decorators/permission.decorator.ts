import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]): CustomDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
