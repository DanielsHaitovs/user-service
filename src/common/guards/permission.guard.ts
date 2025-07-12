import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

import { UserResponseDto } from '../../modules/user/dto/user.dto';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';

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

    const request = context.switchToHttp().getRequest<Request>();
    const { permissions } = request.user as {
      user: UserResponseDto;
      permissions: string[];
    };

    if (permissions.length === 0) {
      throw new ForbiddenException('User permissions not found');
    }

    if (permissions.includes('root_all')) return true;

    const hasAllPermissions = requiredPermissions.every((perm) =>
      permissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Missing required permissions');
    }

    return true;
  }
}
