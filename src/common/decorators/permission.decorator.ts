import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = ({
  required,
  loose,
}: {
  required: string[];
  loose?: string[] | undefined;
}): CustomDecorator => SetMetadata(PERMISSIONS_KEY, { required, loose });
