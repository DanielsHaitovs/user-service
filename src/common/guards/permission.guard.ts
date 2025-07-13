import { RequestWithUserPermissions } from '@/auth/interfaces/req.interface';
import { PERMISSIONS_KEY } from '@/common/decorators/permission.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserPermissions>();

    const { permissions } = request.user;

    if (permissions.includes('root_all')) return true;

    const hasAllPermissions = requiredPermissions.every((perm) =>
      permissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `You do not have the required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
