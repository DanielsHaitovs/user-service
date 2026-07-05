import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import {
  ROLE_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/commonConst/role.const';
import {
  STORE_QUERY_ALIAS,
  USER_STORES_QUERY_ALIAS,
} from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import KeyvRedis, { Keyv, RedisClientType } from '@keyv/redis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { Cache } from 'cache-manager';

type alias =
  | typeof USER_QUERY_ALIAS
  | typeof STORE_QUERY_ALIAS
  | typeof ROLE_QUERY_ALIAS
  | typeof PERMISSION_QUERY_ALIAS
  | `${typeof ROLE_QUERY_ALIAS}_${typeof PERMISSION_QUERY_ALIAS}`
  | typeof USER_ROLE_QUERY_ALIAS
  | typeof USER_STORES_QUERY_ALIAS;

@Injectable()
export class CacheService {
  private readonly cacheTtl;
  private readonly logService = new Logger(CacheService.name);
  private readonly pendingOperations = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
    private readonly envConfigService: EnvConfigService,
  ) {
    this.cacheTtl = this.envConfigService.userCacheTtl * 1000;
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

  async coalesce<T>({
    key,
    operation,
  }: {
    key: string;
    operation: () => Promise<T>;
  }): Promise<T> {
    if (this.pendingOperations.has(key)) {
      return this.pendingOperations.get(key) as Promise<T>;
    }

    const promise = operation().finally(() => {
      this.pendingOperations.delete(key);
    });

    this.pendingOperations.set(key, promise);

    return promise;
  }

  async invalidateByKeyPattern(pattern: string): Promise<void> {
    try {
      const keyv: Keyv | undefined = this.cacheManager.stores[0];

      if (!keyv) {
        return;
      }

      const store = keyv.opts.store as KeyvRedis<unknown> | undefined;
      const redisClient = store?.client as RedisClientType | undefined;

      if (!redisClient) {
        return;
      }

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
    } catch (e) {
      const error = e as Error;

      this.logService.error(
        `Failed to invalidate cache for pattern [${pattern}]): ${error.message}`,
      );
    }
  }

  async invalidateByPartialKeyPattern(pattern: string): Promise<void> {
    try {
      const cutIndex = pattern.indexOf('_all_') + 5;

      const prefix = pattern.slice(0, cutIndex);
      const cacheId = pattern.slice(cutIndex, -1);

      const keyv: Keyv | undefined = this.cacheManager.stores[0];

      if (!keyv) {
        return;
      }

      const store = keyv.opts.store as KeyvRedis<unknown> | undefined;
      const redisClient = store?.client as RedisClientType | undefined;

      if (!redisClient) {
        return;
      }

      const keysToDelete: string[] = [];
      const keysMatchPattern: string[] = [];

      for await (const result of redisClient.scanIterator({
        MATCH: `${pattern}*`,
        COUNT: 100,
      })) {
        if (Array.isArray(result)) {
          keysMatchPattern.push(...result);
        } else if (typeof result === 'string') {
          keysMatchPattern.push(result);
        }
      }

      for (const key of keysMatchPattern) {
        if (key.startsWith(prefix) && key.includes(cacheId)) {
          keysToDelete.push(key);
        }
      }

      if (keysToDelete.length > 0) {
        await redisClient.sendCommand(['UNLINK', ...keysToDelete]);
      }
    } catch (e) {
      const error = e as Error;

      this.logService.error(
        `Failed to invalidate cache for pattern [${pattern}]): ${error.message}`,
      );
    }
  }

  async invalidateByTags({
    tag,
    alias,
  }: {
    tag: {
      purge?: boolean | undefined;
      all?: {
        purge?: boolean | undefined;
        cacheId?: string | undefined;
      };
      paginated?: boolean | undefined;
    };
    alias: alias;
  }): Promise<void> {
    if (tag.purge != undefined && tag.purge) {
      await this.invalidateByKeyPattern(`${alias}_*`);
      return;
    }

    if (tag.all != undefined && tag.all.purge === true) {
      await this.invalidateByKeyPattern(`${alias}_all_*`);
      return;
    } else if (tag.all?.cacheId != undefined) {
      await this.invalidateByPartialKeyPattern(
        `${alias}_all_${tag.all.cacheId}:*`,
      );
    }

    if (tag.paginated != undefined && tag.paginated) {
      await this.invalidateByKeyPattern(`${alias}_paginated_*`);
    }
  }

  async invalidateById({
    id,
    alias,
  }: {
    id: string;
    alias: alias;
  }): Promise<void> {
    await this.del(this.getIdKeyPrefixByAlias({ id, alias }));
  }

  async getById<T>({
    id,
    alias,
  }: {
    id: string;
    alias: alias;
  }): Promise<T | undefined> {
    return await this.get<T>(this.getIdKeyPrefixByAlias({ id, alias }));
  }

  getIdKeyPrefixByAlias({ id, alias }: { id: string; alias: alias }): string {
    switch (alias) {
      case USER_QUERY_ALIAS:
        return `id:${id}:${USER_QUERY_ALIAS}`;
      case STORE_QUERY_ALIAS:
        return `id:${id}:${STORE_QUERY_ALIAS}`;
      case ROLE_QUERY_ALIAS:
        return `id:${id}:${ROLE_QUERY_ALIAS}`;
      case PERMISSION_QUERY_ALIAS:
        return `id:${id}:${PERMISSION_QUERY_ALIAS}`;
      case `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`:
        return `id:${id}:${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`;
      case USER_ROLE_QUERY_ALIAS:
        return `id:${id}:${USER_ROLE_QUERY_ALIAS}`;
      case USER_STORES_QUERY_ALIAS:
        return `id:${id}:${USER_STORES_QUERY_ALIAS}`;
      default:
        throw new InternalServerErrorException(
          'Failed to construct cache key: Unsupported alias provided for cache key generation',
        );
    }
  }

  getAllKeyPrefixByAlias(alias: alias): string {
    switch (alias) {
      case USER_QUERY_ALIAS:
        return `${USER_QUERY_ALIAS}_all_`;
      case STORE_QUERY_ALIAS:
        return `${STORE_QUERY_ALIAS}_all_`;
      case ROLE_QUERY_ALIAS:
        return `${ROLE_QUERY_ALIAS}_all_`;
      case PERMISSION_QUERY_ALIAS:
        return `${PERMISSION_QUERY_ALIAS}_all_`;
      case `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`:
        return `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}_all_`;
      case USER_ROLE_QUERY_ALIAS:
        return `${USER_ROLE_QUERY_ALIAS}_all_`;
      case USER_STORES_QUERY_ALIAS:
        return `${USER_STORES_QUERY_ALIAS}_all_`;
      default:
        throw new InternalServerErrorException(
          'Unsupported alias provided for cache key generation',
        );
    }
  }

  getPaginatedKeyPrefixByAlias(alias: alias): string {
    switch (alias) {
      case USER_QUERY_ALIAS:
        return `${USER_QUERY_ALIAS}_paginated_`;
      case STORE_QUERY_ALIAS:
        return `${STORE_QUERY_ALIAS}_paginated_`;
      case ROLE_QUERY_ALIAS:
        return `${ROLE_QUERY_ALIAS}_paginated_`;
      case PERMISSION_QUERY_ALIAS:
        return `${PERMISSION_QUERY_ALIAS}_paginated_`;
      case `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`:
        return `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}_paginated_`;
      case USER_ROLE_QUERY_ALIAS:
        return `${USER_ROLE_QUERY_ALIAS}_paginated_`;
      case USER_STORES_QUERY_ALIAS:
        return `${USER_STORES_QUERY_ALIAS}_paginated_`;
      default:
        throw new InternalServerErrorException(
          'Unsupported alias provided for cache key generation',
        );
    }
  }
}
