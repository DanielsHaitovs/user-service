import { AuthenticatedRequest } from '@/auth/auth.interface';
import { AuthCacheService } from '@/auth/cache.service';
import { IS_PUBLIC_KEY } from '@/commonDecorators/public.decorator';
import { extractBearerFromHeader } from '@/utils/headers.util';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = extractBearerFromHeader(request);

    if (token === undefined) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.cacheService.get(token);

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
