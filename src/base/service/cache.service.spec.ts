import { CacheService } from '@/baseServices/cache.service';
import type { RedisService } from '@/baseServices/redis.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { STORE_QUERY_ALIAS } from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import type { EnvConfigService } from '@/config/env/env.config.service';
import { Logger } from '@nestjs/common';

import { setTimeout } from 'timers/promises';

interface CacheServiceInternals {
  cacheTtl: number;
  pendingOperations: Map<string, Promise<unknown>>;
}

describe('CacheService (Unit)', () => {
  let service: CacheService;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockEnvConfigService: jest.Mocked<EnvConfigService>;
  let loggerErrorSpy: jest.SpyInstance;

  let redisSetMock: jest.Mock;
  let redisGetMock: jest.Mock;
  let redisDeleteMock: jest.Mock;
  let redisDeleteKeysMock: jest.Mock;

  const mockTtlSeconds = 5;
  const mockTtlMilliseconds = mockTtlSeconds * 1000;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnvConfigService = {
      userCacheTtl: mockTtlSeconds,
    } as unknown as jest.Mocked<EnvConfigService>;

    redisSetMock = jest.fn().mockResolvedValue('OK');
    redisGetMock = jest.fn();
    redisDeleteMock = jest.fn().mockResolvedValue(1);
    redisDeleteKeysMock = jest.fn().mockResolvedValue(undefined);

    mockRedisService = {
      set: redisSetMock,
      get: redisGetMock,
      delete: redisDeleteMock,
      deleteKeysByPattern: redisDeleteKeysMock,
    } as unknown as jest.Mocked<RedisService>;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    service = new CacheService(mockRedisService, mockEnvConfigService);
  });

  describe('Constructor Initialization', () => {
    it('should correctly calculate the default cache TTL configuration value in milliseconds', () => {
      const internals = service as unknown as CacheServiceInternals;
      expect(internals.cacheTtl).toBe(mockTtlMilliseconds);
    });
  });

  describe('set()', () => {
    it('should successfully serialize objects to JSON and store them using default TTL windows', async () => {
      const payload = { roles: ['ADMIN'], active: true };
      const result = await service.set({
        key: 'test-key',
        value: payload,
      });

      expect(redisSetMock).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(payload),
        mockTtlMilliseconds,
      );
      expect(result).toEqual(payload);
    });

    it('should store raw strings directly without adding double JSON escaping characters', async () => {
      const result = await service.set({
        key: 'string-key',
        value: 'raw-string-data',
      });

      expect(redisSetMock).toHaveBeenCalledWith(
        'string-key',
        'raw-string-data',
        mockTtlMilliseconds,
      );
      expect(result).toBe('raw-string-data');
    });

    it('should explicitly prioritize custom parameter overrides for TTL execution windows', async () => {
      const customTtl = 99000;
      await service.set({
        key: 'test-key',
        value: 'payload',
        ttl: customTtl,
      });

      expect(redisSetMock).toHaveBeenCalledWith(
        'test-key',
        'payload',
        customTtl,
      );
    });

    it('should capture storage exceptions safely, issue system logs, and return undefined', async () => {
      redisSetMock.mockRejectedValueOnce(
        new Error('Command execution timeout'),
      );

      const result = await service.set({
        key: 'failed-key',
        value: 'lost-payload',
      });

      expect(result).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set cache for key [failed-key]'),
      );
    });
  });

  describe('get()', () => {
    it('should retrieve accurate value mappings and parse JSON structures back to objects', async () => {
      const cachedData = { id: 1, name: 'Test' };
      redisGetMock.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await service.get('target-key');

      expect(redisGetMock).toHaveBeenCalledWith('target-key');
      expect(result).toEqual(cachedData);
    });

    it('should fallback to returning raw strings if JSON compilation fails during recovery parsing', async () => {
      redisGetMock.mockResolvedValueOnce('plain-text-uncached');

      const result = await service.get('string-key');

      expect(result).toBe('plain-text-uncached');
    });

    it('should return undefined cleanly if the key does not exist inside the Redis engine', async () => {
      redisGetMock.mockResolvedValueOnce(null);

      const result = await service.get('missing-key');

      expect(result).toBeUndefined();
    });

    it('should trap retrieval exceptions safely, log error properties, and return undefined', async () => {
      redisGetMock.mockRejectedValueOnce(new Error('Socket disconnected'));

      const result = await service.get('broken-key');

      expect(result).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get cache for key [broken-key]'),
      );
    });
  });

  describe('del()', () => {
    it('should completely evict specific keys by calling direct service destruction methods', async () => {
      await service.del('evict-key');

      expect(redisDeleteMock).toHaveBeenCalledWith('evict-key');
    });

    it('should capture deletion exceptions safely inside internal try-catch branches', async () => {
      redisDeleteMock.mockRejectedValueOnce(
        new Error('Cluster node read-only error'),
      );

      await service.del('locked-key');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete cache for key [locked-key]'),
      );
    });
  });

  describe('coalesce() [Request Collapsing Engine]', () => {
    it('should group concurrent operation queries to return a single shared promise instance', async () => {
      let resolutionCounter = 0;

      const delayedOperation = async (): Promise<string> => {
        resolutionCounter++;
        await setTimeout(10);
        return 'collapsed-data';
      };

      const [res1, res2, res3] = await Promise.all([
        service.coalesce({
          key: 'collapse-track',
          operation: delayedOperation,
        }),
        service.coalesce({
          key: 'collapse-track',
          operation: delayedOperation,
        }),
        service.coalesce({
          key: 'collapse-track',
          operation: delayedOperation,
        }),
      ]);

      expect(res1).toBe('collapsed-data');
      expect(res2).toBe('collapsed-data');
      expect(res3).toBe('collapsed-data');
      expect(resolutionCounter).toBe(1);
    });

    it('should remove keys from internal maps completely once operations settle entirely', async () => {
      const standardOperation = (): Promise<string> =>
        Promise.resolve('resolved-state');

      await service.coalesce({
        key: 'transient-track',
        operation: standardOperation,
      });

      const internals = service as unknown as CacheServiceInternals;
      expect(internals.pendingOperations.has('transient-track')).toBe(false);
    });
  });

  describe('invalidateByKeyPattern()', () => {
    it('should pass pattern targets directly down to the Redis streaming UNLINK module layer', async () => {
      await service.invalidateByKeyPattern('users_all_*');

      expect(redisDeleteKeysMock).toHaveBeenCalledWith('users_all_*');
    });

    it('should catch runtime pattern errors safely and route parameters to logging contexts', async () => {
      redisDeleteKeysMock.mockRejectedValueOnce(
        new Error('Scan block lock fault'),
      );

      await service.invalidateByKeyPattern('broken_*');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to invalidate cache for pattern [broken_*]',
        ),
      );
    });
  });

  describe('invalidateByTags()', () => {
    let patternSpy: jest.SpyInstance;

    beforeEach(() => {
      patternSpy = jest
        .spyOn(mockRedisService, 'deleteKeysByPattern')
        .mockResolvedValue(undefined);
    });

    it('should execute parallel wildcards for both all and paginated fields when triggering complete purges', async () => {
      await service.invalidateByTags({
        tag: { purge: true },
        alias: ROLE_QUERY_ALIAS,
      });

      expect(patternSpy).toHaveBeenCalledTimes(2);
      expect(patternSpy).toHaveBeenCalledWith(`${ROLE_QUERY_ALIAS}_all_*`);
      expect(patternSpy).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}_paginated_*`,
      );
    });

    it('should generate accurate pattern targets when evaluating generic collection track indices', async () => {
      await service.invalidateByTags({
        tag: { all: true },
        alias: STORE_QUERY_ALIAS,
      });

      expect(patternSpy).toHaveBeenCalledWith(`${STORE_QUERY_ALIAS}_all_*`);
    });

    it('should generate accurate pattern targets when evaluating data grid rows', async () => {
      await service.invalidateByTags({
        tag: { paginated: true },
        alias: USER_QUERY_ALIAS,
      });

      expect(patternSpy).toHaveBeenCalledWith(
        `${USER_QUERY_ALIAS}_paginated_*`,
      );
    });

    it('should skip operational pipelines entirely if tag targets resolve as falsy or undefined', async () => {
      await service.invalidateByTags({
        tag: {},
        alias: PERMISSION_QUERY_ALIAS,
      });

      expect(patternSpy).not.toHaveBeenCalled();
    });
  });

  describe('High-Level Wrapper Pipeline Methods (invalidateById / getById)', () => {
    it('should accurately bridge execution calls into core deletion methods via invalidateById', async () => {
      const delSpy = jest.spyOn(service, 'del').mockResolvedValue(undefined);

      await service.invalidateById({ id: 'uuid-123', alias: USER_QUERY_ALIAS });

      expect(delSpy).toHaveBeenCalledWith(`id:uuid-123:${USER_QUERY_ALIAS}`);
    });

    it('should accurately bridge execution calls into core retrieval methods via getById', async () => {
      const getSpy = jest
        .spyOn(service, 'get')
        .mockResolvedValue('cached-entity');

      const result = await service.getById({
        id: 'uuid-456',
        alias: STORE_QUERY_ALIAS,
      });

      expect(getSpy).toHaveBeenCalledWith(`id:uuid-456:${STORE_QUERY_ALIAS}`);
      expect(result).toBe('cached-entity');
    });
  });

  describe('Cache Key Prefixes Logic validation', () => {
    it('should verify precise key transformations for typical atomic switch schemas', () => {
      expect(
        service.getIdKeyPrefixByAlias({ id: '1', alias: USER_QUERY_ALIAS }),
      ).toBe(`id:1:${USER_QUERY_ALIAS}`);
      expect(
        service.getIdKeyPrefixByAlias({ id: '2', alias: STORE_QUERY_ALIAS }),
      ).toBe(`id:2:${STORE_QUERY_ALIAS}`);
      expect(
        service.getIdKeyPrefixByAlias({ id: '3', alias: ROLE_QUERY_ALIAS }),
      ).toBe(`id:3:${ROLE_QUERY_ALIAS}`);
    });

    it('should evaluate the precise non-underscore character layout for composite queries', () => {
      const compositeAlias =
        `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}` as const;
      const expectedPrefix = `id:abc:${ROLE_QUERY_ALIAS}${PERMISSION_QUERY_ALIAS}`;

      expect(
        service.getIdKeyPrefixByAlias({ id: 'abc', alias: compositeAlias }),
      ).toBe(expectedPrefix);
    });

    it('should verify matching global selector patterns maps completely across all valid aliases', () => {
      expect(service.getAllKeyPrefixByAlias(USER_QUERY_ALIAS)).toBe(
        `${USER_QUERY_ALIAS}_all_`,
      );
      expect(service.getPaginatedKeyPrefixByAlias(USER_QUERY_ALIAS)).toBe(
        `${USER_QUERY_ALIAS}_paginated_`,
      );
    });
  });
});
