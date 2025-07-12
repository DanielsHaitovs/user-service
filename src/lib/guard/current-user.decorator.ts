import type { User } from '@/modules/user/entities/user.entity';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

interface RequestWithUser extends Request {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
