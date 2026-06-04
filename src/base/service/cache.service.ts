import { EnvConfigService } from '@/config/env/env.config.service';
import KeyvRedis, { Keyv, RedisClientType } from '@keyv/redis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Cache } from 'cache-manager';

@Injectable()
export class BaseCacheService {
  private readonly cacheTtl;
  private readonly logService = new Logger(BaseCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
    private readonly envConfigService: EnvConfigService,
  ) {
    this.cacheTtl = this.envConfigService.userCacheTtl * 1000;
  }

  async invalidatePaginatedCache(alias: string): Promise<void> {
    const keyv: Keyv | undefined = this.cacheManager.stores[0];

    if (!keyv) {
      return;
    }

    const store = keyv.opts.store as KeyvRedis<unknown> | undefined;
    const redisClient = store?.client as RedisClientType | undefined;

    if (!redisClient) {
      return;
    }

    const pattern = `*${alias}_paginated_*`;
    const keysToDelete: string[] = [];

    for await (const result of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (Array.isArray(result)) {
        keysToDelete.push(...result);
      } else if (typeof result === 'string') {
        keysToDelete.push(result);
      }
    }

    if (keysToDelete.length > 0) {
      await redisClient.sendCommand(['UNLINK', ...keysToDelete]);
    }
  }

  async set<T>({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: T;
    ttl?: number;
  }): Promise<T | undefined> {
    try {
      const finalTtl = ttl ?? this.cacheTtl;

      await this.cacheManager.set(key, value, finalTtl);

      return value;
    } catch (e) {
      const error = e as Error;

      this.logService.error(
        `Failed to set cache for key [${key}]): ${error.message}`,
      );

      return undefined;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (e) {
      const error = e as Error;

      this.logService.error(
        `Failed to get cache for key [${key}]): ${error.message}`,
      );

      return undefined;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (e) {
      const error = e as Error;

      this.logService.error(
        `Failed to delete cache for key [${key}]): ${error.message}`,
      );
    }
  }
}
