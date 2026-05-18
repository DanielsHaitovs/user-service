import { AuthenticatedRequest, JwtPayload } from '@/auth/auth.interface';
import { PERMISSIONS_KEY } from '@/commonDecorators/permission.decorator';
import { ROOT_ADMIN_PERMISSION } from '@/libConst/permission.const';
import { extractBearerFromHeader } from '@/utils/headers.utils';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      string[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions == undefined || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = extractBearerFromHeader(request);

    if (token === undefined) {
      throw new ForbiddenException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = payload;
      const { permissions } = request.user;

      if (permissions.includes(ROOT_ADMIN_PERMISSION)) return true;

      const hasAllPermissions = requiredPermissions.every((perm) =>
        permissions.includes(perm),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `You do not have the required permissions: ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    } catch {
      throw new ForbiddenException();
    }
  }
}
