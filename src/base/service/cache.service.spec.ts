import { CacheService } from '@/baseServices/cache.service';
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
import type { EnvConfigService } from '@/config/env/env.config.service';
import { InternalServerErrorException, Logger } from '@nestjs/common';

import type { Cache } from 'cache-manager';
import { setTimeout } from 'timers/promises';

interface CacheServiceInternals {
  cacheTtl: number;
  pendingOperations: Map<string, Promise<unknown>>;
}

describe('CacheService (Unit)', () => {
  let service: CacheService;
  let mockCacheManager: jest.Mocked<Cache>;
  let mockEnvConfigService: jest.Mocked<EnvConfigService>;
  let loggerErrorSpy: jest.SpyInstance;

  let mockScanIterator: jest.Mock;
  let mockSendCommand: jest.Mock;

  const mockTtlSeconds = 5;
  const mockTtlMilliseconds = mockTtlSeconds * 1000;

  const allAliases = [
    USER_QUERY_ALIAS,
    STORE_QUERY_ALIAS,
    ROLE_QUERY_ALIAS,
    PERMISSION_QUERY_ALIAS,
    `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    USER_ROLE_QUERY_ALIAS,
    USER_ROLE_PERMISSIONS_QUERY_ALIAS,
    USER_STORES_QUERY_ALIAS,
  ] as const;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnvConfigService = {
      userCacheTtl: mockTtlSeconds,
    } as unknown as jest.Mocked<EnvConfigService>;

    mockScanIterator = jest.fn();
    mockSendCommand = jest.fn().mockResolvedValue('OK');

    const mockRedisStore = {
      opts: {
        store: {
          client: {
            scanIterator: mockScanIterator,
            sendCommand: mockSendCommand,
          },
        },
      },
    };

    mockCacheManager = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
      stores: [mockRedisStore],
    } as unknown as jest.Mocked<Cache>;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    service = new CacheService(mockCacheManager, mockEnvConfigService);
  });

  describe('Constructor Initialization', () => {
    it('should correctly calculate the default cache TTL configuration value in milliseconds', () => {
      const internals = service as unknown as CacheServiceInternals;
      expect(internals.cacheTtl).toBe(mockTtlMilliseconds);
    });
  });

  describe('set()', () => {
    it('should successfully store value in cache using the application default TTL configuration', async () => {
      const result = await service.set({
        key: 'test-key',
        value: 'data-payload',
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test-key',
        'data-payload',
        mockTtlMilliseconds,
      );
      expect(result).toBe('data-payload');
    });

    it('should explicitly prioritize custom parameter overrides for TTL execution windows', async () => {
      const customTtl = 99000;
      const result = await service.set({
        key: 'test-key',
        value: 'data-payload',
        ttl: customTtl,
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test-key',
        'data-payload',
        customTtl,
      );
      expect(result).toBe('data-payload');
    });

    it('should capture storage exceptions safely, issue system logs, and return undefined', async () => {
      mockCacheManager.set.mockRejectedValueOnce(
        new Error('Redis connection dropped'),
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
    it('should retrieve accurate value mappings from the cache store container', async () => {
      mockCacheManager.get.mockResolvedValueOnce('cached-value');

      const result = await service.get('target-key');

      expect(mockCacheManager.get).toHaveBeenCalledWith('target-key');
      expect(result).toBe('cached-value');
    });

    it('should trap retrieval exceptions safely, log error properties, and return undefined', async () => {
      mockCacheManager.get.mockRejectedValueOnce(
        new Error('Timeout exception'),
      );

      const result = await service.get('broken-key');

      expect(result).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get cache for key [broken-key]'),
      );
    });
  });

  describe('del()', () => {
    it('should delete keys from data arrays completely', async () => {
      await service.del('delete-key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('delete-key');
    });

    it('should capture deletion exception spikes safely inside internal try-catch branches', async () => {
      mockCacheManager.del.mockRejectedValueOnce(
        new Error('Eviction failure lock'),
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
        return 'data-payload';
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

      expect(res1).toBe('data-payload');
      expect(res2).toBe('data-payload');
      expect(res3).toBe('data-payload');
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
    it('should exit execution loops early if cache stores are missing', async () => {
      (mockCacheManager as any).stores = [];

      await service.invalidateByKeyPattern('pattern_*');

      expect(mockScanIterator).not.toHaveBeenCalled();
    });

    it('should exit execution loops early if core redis layout elements are missing', async () => {
      (mockCacheManager as any).stores = [{ opts: {} }];

      await service.invalidateByKeyPattern('pattern_*');

      expect(mockScanIterator).not.toHaveBeenCalled();
    });

    it('should process pattern lookup arrays using UNLINK command maps successfully', async () => {
      const simulatedScanResults = [['key_1', 'key_2']];
      mockScanIterator.mockReturnValueOnce(simulatedScanResults);

      await service.invalidateByKeyPattern('users_*');

      expect(mockScanIterator).toHaveBeenCalledWith({
        MATCH: 'users_*',
        COUNT: 100,
      });
      expect(mockSendCommand).toHaveBeenCalledWith([
        'UNLINK',
        'key_1',
        'key_2',
      ]);
    });

    it('should process separate simple string item yields from scanner returns cleanly', async () => {
      const simulatedScanResults = ['single_key_1', 'single_key_2'];
      mockScanIterator.mockReturnValueOnce(simulatedScanResults);

      await service.invalidateByKeyPattern('roles_*');

      expect(mockSendCommand).toHaveBeenCalledWith([
        'UNLINK',
        'single_key_1',
        'single_key_2',
      ]);
    });

    it('should bypass data execution commands if no matching records are gathered', async () => {
      mockScanIterator.mockReturnValueOnce([]);

      await service.invalidateByKeyPattern('empty_*');

      expect(mockSendCommand).not.toHaveBeenCalled();
    });

    it('should catch runtime internal errors safely and pass metrics down to error logging modules', async () => {
      mockScanIterator.mockImplementationOnce(() => {
        throw new Error('Scan memory leak threshold error');
      });

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
        .spyOn(service, 'invalidateByKeyPattern')
        .mockResolvedValue(undefined);
    });

    it('should generate accurate pattern targets when evaluating purge command actions', async () => {
      await service.invalidateByTags({
        tag: { purge: true },
        alias: USER_QUERY_ALIAS,
      });
      expect(patternSpy).toHaveBeenCalledWith(`${USER_QUERY_ALIAS}_*`);
    });

    it('should generate accurate pattern targets when evaluating fetch all tracking requests', async () => {
      await service.invalidateByTags({
        tag: { all: true },
        alias: STORE_QUERY_ALIAS,
      });
      expect(patternSpy).toHaveBeenCalledWith(`${STORE_QUERY_ALIAS}_all_*`);
    });

    it('should generate accurate pattern targets when evaluating paginated request commands', async () => {
      await service.invalidateByTags({
        tag: { paginated: true },
        alias: ROLE_QUERY_ALIAS,
      });
      expect(patternSpy).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}_paginated_*`,
      );
    });

    it('should bypass operational patterns completely if all tag configurations are set to false or undefined', async () => {
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

      await service.invalidateById({ id: '123', alias: USER_QUERY_ALIAS });

      expect(delSpy).toHaveBeenCalledWith(`id:123:${USER_QUERY_ALIAS}`);
    });

    it('should accurately bridge execution calls into core retrieval methods via getById', async () => {
      const getSpy = jest
        .spyOn(service, 'get')
        .mockResolvedValue('recovered-data');

      const result = await service.getById({
        id: '456',
        alias: STORE_QUERY_ALIAS,
      });

      expect(getSpy).toHaveBeenCalledWith(`id:456:${STORE_QUERY_ALIAS}`);
      expect(result).toBe('recovered-data');
    });
  });

  describe('Cache Key Prefix - getIdKeyPrefixByAlias()', () => {
    it('should properly loop and transform all system alias metrics into exact id string prefixes', () => {
      for (const alias of allAliases) {
        const generated = service.getIdKeyPrefixByAlias({
          id: 'test-id',
          alias,
        });
        expect(generated).toBe(`id:test-id:${alias}`);
      }
    });

    it('should throw an InternalServerErrorException if an unrecognized or malformed string alias bypasses types', () => {
      expect(() => {
        service.getIdKeyPrefixByAlias({
          id: 'id',
          alias: 'GHOST_ALIAS' as unknown as typeof USER_QUERY_ALIAS,
        });
      }).toThrow(InternalServerErrorException);
    });
  });

  describe('Cache Key Prefix - getAllKeyPrefixByAlias()', () => {
    it('should properly loop and transform all system alias metrics into exact global array match keys', () => {
      for (const alias of allAliases) {
        const generated = service.getAllKeyPrefixByAlias(alias);
        expect(generated).toBe(`${alias}_all_`);
      }
    });

    it('should throw an InternalServerErrorException if an invalid tracking variable maps to global targets', () => {
      expect(() => {
        service.getAllKeyPrefixByAlias(
          'GHOST_ALIAS' as unknown as typeof USER_QUERY_ALIAS,
        );
      }).toThrow(InternalServerErrorException);
    });
  });

  describe('Cache Key Prefix - getPaginatedKeyPrefixByAlias()', () => {
    it('should properly loop and transform all system alias metrics into accurate data grid selectors', () => {
      for (const alias of allAliases) {
        const generated = service.getPaginatedKeyPrefixByAlias(alias);
        expect(generated).toBe(`${alias}_paginated_`);
      }
    });

    it('should throw an InternalServerErrorException if an unrecognized variable maps to index layouts', () => {
      expect(() => {
        service.getPaginatedKeyPrefixByAlias(
          'GHOST_ALIAS' as unknown as typeof USER_QUERY_ALIAS,
        );
      }).toThrow(InternalServerErrorException);
    });
  });
});
