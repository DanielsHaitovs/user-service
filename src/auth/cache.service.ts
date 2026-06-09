import { JwtPayload } from '@/auth/auth.interface';
import { EnvConfigService } from '@/config/env/env.config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Cache } from 'cache-manager';

@Injectable()
export class AuthCacheService {
  private readonly key = 'auth_token';
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

    await this.cacheManager.set(
      cacheKey,
      payload,
      this.envConfigService.jwtExpiration * 1000,
    );
  }

  async get(token: string): Promise<JwtPayload> {
    try {
      const cacheKey = `${this.key}:${token}`;

      const cachedPayload = await this.cacheManager.get<JwtPayload>(cacheKey);

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
    await this.cacheManager.del(key);
  }
}
