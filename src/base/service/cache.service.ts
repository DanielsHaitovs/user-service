import { RedisService } from '@/baseServices/redis.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import {
  ROLE_QUERY_ALIAS,
  USER_ROLE_PERMISSIONS_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/commonConst/role.const';
import {
  STORE_QUERY_ALIAS,
  USER_STORES_QUERY_ALIAS,
} from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

type alias =
  | typeof USER_QUERY_ALIAS
  | typeof STORE_QUERY_ALIAS
  | typeof ROLE_QUERY_ALIAS
  | typeof PERMISSION_QUERY_ALIAS
  | `${typeof ROLE_QUERY_ALIAS}_${typeof PERMISSION_QUERY_ALIAS}`
  | typeof USER_ROLE_PERMISSIONS_QUERY_ALIAS
  | typeof USER_ROLE_QUERY_ALIAS
  | typeof USER_STORES_QUERY_ALIAS;

@Injectable()
export class CacheService {
  private readonly cacheTtl: number;
  private readonly logService = new Logger(CacheService.name);
  private readonly pendingOperations = new Map<string, Promise<unknown>>();

  constructor(
    private readonly redisService: RedisService,
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

      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);

      await this.redisService.set(key, serializedValue, finalTtl);

      return value;
    } catch (e) {
      const error = e as Error;
      this.logService.error(
        `Failed to set cache for key [${key}]: ${error.message}`,
      );
      return undefined;
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.redisService.get(key);

      if (data == undefined) return undefined;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (e) {
      const error = e as Error;
      this.logService.error(
        `Failed to get cache for key [${key}]: ${error.message}`,
      );
      return undefined;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisService.delete(key);
    } catch (e) {
      const error = e as Error;
      this.logService.error(
        `Failed to delete cache for key [${key}]: ${error.message}`,
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
      await this.redisService.deleteKeysByPattern(pattern);
    } catch (e) {
      const error = e as Error;
      this.logService.error(
        `Failed to invalidate cache for pattern [${pattern}]: ${error.message}`,
      );
    }
  }

  async invalidateByTags({
    tag,
    alias,
  }: {
    tag: {
      purge?: boolean | undefined;
      all?: boolean | undefined;
      paginated?: boolean | undefined;
    };
    alias: alias;
  }): Promise<void> {
    if (tag.purge != undefined && tag.purge) {
      await Promise.all([
        this.redisService.deleteKeysByPattern(`${alias}_all_*`),
        this.redisService.deleteKeysByPattern(`${alias}_paginated_*`),
      ]);
      return;
    }

    if (tag.all != undefined && tag.all) {
      await this.redisService.deleteKeysByPattern(`${alias}_all_*`);
      return;
    }

    if (tag.paginated != undefined && tag.paginated) {
      await this.redisService.deleteKeysByPattern(`${alias}_paginated_*`);
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
        return `id:${id}:${ROLE_QUERY_ALIAS}${PERMISSION_QUERY_ALIAS}`;
      case USER_ROLE_QUERY_ALIAS:
        return `id:${id}:${USER_ROLE_QUERY_ALIAS}`;
      case USER_ROLE_PERMISSIONS_QUERY_ALIAS:
        return `id:${id}:${USER_ROLE_PERMISSIONS_QUERY_ALIAS}`;
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
      case USER_ROLE_PERMISSIONS_QUERY_ALIAS:
        return `${USER_ROLE_PERMISSIONS_QUERY_ALIAS}_all_`;
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
      case USER_ROLE_PERMISSIONS_QUERY_ALIAS:
        return `${USER_ROLE_PERMISSIONS_QUERY_ALIAS}_paginated_`;
      case USER_STORES_QUERY_ALIAS:
        return `${USER_STORES_QUERY_ALIAS}_paginated_`;
      default:
        throw new InternalServerErrorException(
          'Unsupported alias provided for cache key generation',
        );
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.redisService.flushAll();
    } catch (e) {
      const error = e as Error;
      this.logService.error(`Failed to flush all cache: ${error.message}`);
    }
  }
}
