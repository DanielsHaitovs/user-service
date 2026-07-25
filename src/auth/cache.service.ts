import { JwtPayload } from '@/auth/auth.interface';
import { CacheService } from '@/baseServices/cache.service';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthCacheService {
  private readonly key = 'auth_token';
  constructor(
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly envConfigService: EnvConfigService,
  ) {}

  async set({
    payload,
    token,
  }: {
    payload: JwtPayload;
    token: string;
  }): Promise<void> {
    const cacheKey = `${this.key}:${token}`;

    await this.cacheService.set<JwtPayload>({
      key: cacheKey,
      value: payload,
      ttl: this.envConfigService.jwtExpiration * 1000,
    });
  }

  async get(token: string): Promise<JwtPayload> {
    try {
      const cacheKey = `${this.key}:${token}`;

      const cachedPayload = await this.cacheService.get<JwtPayload>(cacheKey);

      if (cachedPayload) {
        return cachedPayload;
      }

      const decoded = await this.jwtService.verifyAsync<JwtPayload>(token);

      await this.set({ payload: decoded, token });

      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async del(key: string): Promise<void> {
    await this.cacheService.del(key);
  }
}
