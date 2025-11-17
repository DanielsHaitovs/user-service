import { RequestWithUserPermissions } from '@/auth/interfaces/req.interface';
import { PERMISSIONS_KEY } from '@/common/decorators/permission.decorator';
import { ROOT_ADMIN_PERMISSION } from '@/lib/const/role.const';
import { User } from '@/user/entities/user.entity';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      string[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions == undefined || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithUserPermissions>();

    const { permissions, id } = request.user;

    if ((await this.userRepository.findOne({ where: { id } })) == undefined) {
      throw new ForbiddenException('User not found');
    }

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
  }
}
