import type { JWTPayload } from '@/authInterfaces/req.interface';
import { ROOT_ADMIN_PERMISSION } from '@/libConst/permission.const';
import { JwtService } from '@nestjs/jwt';

import type { Request } from 'express';

export function hasLoosePermission({
  request,
  permissions,
}: {
  request: Request;
  permissions: string[];
}): boolean {
  const secret = process.env.JWT_SECRET;

  if (secret == undefined) {
    throw new Error('JWT_SECRET not set');
  }

  const jwtService = new JwtService({ secret });
  const token = request.headers.authorization?.replace(/^Bearer\s/, '') ?? '';

  const payload = jwtService.verify<JWTPayload>(token);

  if (payload.permissions.includes(ROOT_ADMIN_PERMISSION)) return true;

  return permissions.every((permission) =>
    payload.permissions.includes(permission),
  );
}

export function hasPermissions({
  userPermissions,
  requestedPermissions,
}: {
  userPermissions: string[];
  requestedPermissions: string[];
}): boolean {
  if (userPermissions.includes(ROOT_ADMIN_PERMISSION)) return true;

  return requestedPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
}
