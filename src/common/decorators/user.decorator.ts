import type { RequestWithUserPermissions } from '@/auth/interfaces/req.interface';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUserPermissions>();
    return request.user.id;
  },
);
