import type { AuthenticatedRequest, JwtPayload } from '@/auth/auth.interface';
import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return request.user.id;
  },
);

export const CurrentUserPermissions = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return request.user.permissions;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return request.user;
  },
);
