import { AuthenticatedRequest } from '@/auth/auth.interface';
import { AuthCacheService } from '@/auth/cache.service';
import { PERMISSIONS_KEY } from '@/commonDecorators/permission.decorator';
import { IS_PUBLIC_KEY } from '@/commonDecorators/public.decorator';
import { ROOT_ADMIN_PERMISSION } from '@/libConst/permission.const';
import { extractBearerFromHeader } from '@/utils/headers.utils';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: AuthCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const { required, loose } = this.reflector.getAllAndOverride<{
      required: string[] | undefined;
      loose: string[] | undefined;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (required == undefined || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = extractBearerFromHeader(request);

    if (token === undefined) {
      throw new ForbiddenException('No token provided');
    }

    try {
      const payload = await this.cacheService.get(token);

      const { permissions } = payload;

      if (permissions.includes(ROOT_ADMIN_PERMISSION)) return true;

      const minRequiredPermissions =
        loose != undefined && loose.length > 0
          ? required.filter((permission) => !loose.includes(permission))
          : required;

      const hasAllPermissions = minRequiredPermissions.every((perm) =>
        permissions.includes(perm),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `You do not have the required permissions: ${minRequiredPermissions.join(', ')}`,
        );
      }

      request.user = payload;

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ForbiddenException('Invalid token');
    }
  }
}
