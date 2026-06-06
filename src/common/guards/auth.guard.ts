import { AuthenticatedRequest, JwtPayload } from '@/auth/auth.interface';
import { CacheService } from '@/baseServices/cache.service';
import { IS_PUBLIC_KEY } from '@/commonDecorators/public.decorator';
import { EnvConfigService } from '@/config/env/env.config.service';
import { extractBearerFromHeader } from '@/utils/headers.utils';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
    private readonly envConfigService: EnvConfigService,
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

    const cacheKey = `auth_token:${token}`;

    try {
      const cachedPayload = await this.cacheService.get<JwtPayload>(cacheKey);

      if (cachedPayload) {
        request.user = cachedPayload;
        return true;
      }

      const payload = await this.cacheService.coalesce<JwtPayload>({
        key: cacheKey,
        operation: async () => {
          const decoded = await this.jwtService.verifyAsync<JwtPayload>(token);

          await this.cacheService.set({
            key: cacheKey,
            value: decoded,
            ttl: this.envConfigService.jwtExpiration * 1000,
          });

          return decoded;
        },
      });

      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
