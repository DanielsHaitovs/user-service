import type { PaginationDto, SortDto } from '@/baseDto/pagination.dto';
import type { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';

import type { EntityManager, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

jest.mock('@/utils/token-generator.util', () => ({
  hashObject: jest.fn().mockReturnValue('mocked_hash_token_string'),
}));

describe('EntityQueryService - Base Logic and Filters', () => {
  let service: EntityQueryService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

  let andWhereSpy: jest.Mock;
  let orWhereSpy: jest.Mock;
  let skipSpy: jest.Mock;
  let takeSpy: jest.Mock;
  let distinctSpy: jest.Mock;
  let orderBySpy: jest.Mock;
  let leftJoinAndSelectSpy: jest.Mock;
  let cloneSpy: jest.Mock;
  let getManySpy: jest.Mock;
  let getManyAndCountSpy: jest.Mock;
  let getQueryAndParametersSpy: jest.Mock;
  let createQueryBuilderSpy: jest.Mock;
  let cacheGetSpy: jest.Mock;
  let cacheSetSpy: jest.Mock;
  let cacheCoalesceSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    andWhereSpy = jest.fn();
    orWhereSpy = jest.fn();
    skipSpy = jest.fn();
    takeSpy = jest.fn();
    distinctSpy = jest.fn();
    orderBySpy = jest.fn();
    leftJoinAndSelectSpy = jest.fn();
    cloneSpy = jest.fn();
    getManySpy = jest.fn();
    getManyAndCountSpy = jest.fn();
    getQueryAndParametersSpy = jest
      .fn()
      .mockReturnValue(['SELECT * FROM base', []]);

    mockQueryBuilder = {
      alias: 'base_alias',
      andWhere: andWhereSpy,
      orWhere: orWhereSpy,
      skip: skipSpy,
      take: takeSpy,
      distinct: distinctSpy,
      orderBy: orderBySpy,
      leftJoinAndSelect: leftJoinAndSelectSpy,
      clone: cloneSpy,
      getMany: getManySpy,
      getManyAndCount: getManyAndCountSpy,
      getQueryAndParameters: getQueryAndParametersSpy,
      expressionMap: {
        skip: 0,
        take: 10,
        joinAttributes: [],
        mainAlias: {
          metadata: {
            findColumnWithPropertyName: jest.fn(),
          },
        },
      },
    } as unknown as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

    andWhereSpy.mockReturnValue(mockQueryBuilder);
    orWhereSpy.mockReturnValue(mockQueryBuilder);
    skipSpy.mockReturnValue(mockQueryBuilder);
    takeSpy.mockReturnValue(mockQueryBuilder);
    distinctSpy.mockReturnValue(mockQueryBuilder);
    orderBySpy.mockReturnValue(mockQueryBuilder);
    leftJoinAndSelectSpy.mockReturnValue(mockQueryBuilder);
    cloneSpy.mockReturnValue(mockQueryBuilder);

    createQueryBuilderSpy = jest.fn().mockReturnValue(mockQueryBuilder);
    mockEntityManager = {
      createQueryBuilder: createQueryBuilderSpy,
    } as unknown as jest.Mocked<EntityManager>;

    cacheGetSpy = jest.fn();
    cacheSetSpy = jest.fn();
    cacheCoalesceSpy = jest
      .fn()
      .mockImplementation(
        async (options: { operation: () => Promise<unknown> }) => {
          return await options.operation();
        },
      );

    mockCacheService = {
      get: cacheGetSpy,
      set: cacheSetSpy,
      coalesce: cacheCoalesceSpy,
    } as unknown as jest.Mocked<CacheService>;

    service = new EntityQueryService(mockEntityManager, mockCacheService);
  });

  it('should return early from whereIn operations if values are completely empty or missing', () => {
    service.whereIn({
      query: mockQueryBuilder,
      field: 'id',
      values: [],
      condition: 'AND',
    });

    expect(andWhereSpy).not.toHaveBeenCalled();
    expect(orWhereSpy).not.toHaveBeenCalled();
  });

  it('should successfully apply strict AND logic parameter arrays inside whereIn filter runs', () => {
    service.whereIn({
      query: mockQueryBuilder,
      field: 'id',
      values: ['uuid-1', 'uuid-2'],
      condition: 'AND',
    });

    expect(andWhereSpy).toHaveBeenCalledWith(
      'base_alias.id IN (:...base_alias_ids)',
      { base_alias_ids: ['uuid-1', 'uuid-2'] },
    );
  });

  it('should successfully apply looser OR logic configuration variables inside whereIn filter runs', () => {
    service.whereIn({
      query: mockQueryBuilder,
      field: 'status',
      values: ['ACTIVE', 'PENDING'],
      condition: 'OR',
      relationAlias: 'custom_alias',
    });

    expect(orWhereSpy).toHaveBeenCalledWith(
      'custom_alias.status IN (:...custom_alias_statuss)',
      { custom_alias_statuss: ['ACTIVE', 'PENDING'] },
    );
  });

  it('should bypass field prefix rules within resolveFieldPath if target properties contain explicit relation dots', () => {
    service.whereIn({
      query: mockQueryBuilder,
      field: 'explicit_relation.target_property' as any,
      values: ['val'],
      condition: 'AND',
    });

    expect(andWhereSpy).toHaveBeenCalledWith(
      'explicit_relation.target_property IN (:...base_alias_explicit_relation_target_propertys)',
      expect.any(Object),
    );
  });

  it('should return early from base where scalar methods if target value objects are undefined', () => {
    service.where({
      query: mockQueryBuilder,
      field: 'email',
      value: undefined,
      condition: 'AND',
    });

    expect(andWhereSpy).not.toHaveBeenCalled();
  });

  it('should execute basic equality where bindings using strict AND options cleanly', () => {
    service.where({
      query: mockQueryBuilder,
      field: 'email',
      value: 'test@example.com',
      condition: 'AND',
    });

    expect(andWhereSpy).toHaveBeenCalledWith(
      'base_alias.email = :base_alias_email_to',
      { base_alias_email_to: 'test@example.com' },
    );
  });

  it('should execute basic equality where bindings using loose OR choices cleanly', () => {
    service.where({
      query: mockQueryBuilder,
      field: 'name',
      value: 'John',
      condition: 'OR',
    });

    expect(orWhereSpy).toHaveBeenCalledWith(
      'base_alias.name = :base_alias_name_to',
      { base_alias_name_to: 'John' },
    );
  });
});

describe('EntityQueryService - Range Boundaries and Relational Joins', () => {
  let service: EntityQueryService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

  let andWhereSpy: jest.Mock;
  let orWhereSpy: jest.Mock;
  let skipSpy: jest.Mock;
  let takeSpy: jest.Mock;
  let leftJoinAndSelectSpy: jest.Mock;
  let createQueryBuilderSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    andWhereSpy = jest.fn();
    orWhereSpy = jest.fn();
    skipSpy = jest.fn();
    takeSpy = jest.fn();
    leftJoinAndSelectSpy = jest.fn();

    mockQueryBuilder = {
      alias: 'base_alias',
      andWhere: andWhereSpy,
      orWhere: orWhereSpy,
      skip: skipSpy,
      take: takeSpy,
      distinct: jest.fn(),
      orderBy: jest.fn(),
      leftJoinAndSelect: leftJoinAndSelectSpy,
      clone: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getQueryAndParameters: jest
        .fn()
        .mockReturnValue(['SELECT * FROM base', []]),
      expressionMap: {
        skip: 0,
        take: 10,
        joinAttributes: [],
        mainAlias: {
          metadata: {
            findColumnWithPropertyName: jest.fn(),
          },
        },
      },
    } as unknown as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

    andWhereSpy.mockReturnValue(mockQueryBuilder);
    orWhereSpy.mockReturnValue(mockQueryBuilder);
    skipSpy.mockReturnValue(mockQueryBuilder);
    takeSpy.mockReturnValue(mockQueryBuilder);
    leftJoinAndSelectSpy.mockReturnValue(mockQueryBuilder);

    createQueryBuilderSpy = jest.fn().mockReturnValue(mockQueryBuilder);
    mockEntityManager = {
      createQueryBuilder: createQueryBuilderSpy,
    } as unknown as jest.Mocked<EntityManager>;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      coalesce: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    service = new EntityQueryService(mockEntityManager, mockCacheService);
  });

  it('should manage dateGreaterThan queries safely under loose OR conditional pipelines', () => {
    const testDate = new Date();
    service.dateGreaterThan({
      query: mockQueryBuilder,
      field: 'createdAt',
      date: testDate,
      condition: 'OR',
    });

    expect(orWhereSpy).toHaveBeenCalledWith(
      'base_alias.createdAt > :base_alias_createdAt_from',
      { base_alias_createdAt_from: testDate },
    );
  });

  it('should manage dateGreaterThan queries safely under strict AND conditional pipelines', () => {
    const testDate = new Date();
    service.dateGreaterThan({
      query: mockQueryBuilder,
      field: 'createdAt',
      date: testDate,
      condition: 'AND',
    });

    expect(andWhereSpy).toHaveBeenCalledWith(
      'base_alias.createdAt > :base_alias_createdAt_from',
      { base_alias_createdAt_from: testDate },
    );
  });

  it('should manage dateLessThan queries safely under loose OR configurations', () => {
    const testDate = new Date();
    service.dateLessThan({
      query: mockQueryBuilder,
      field: 'updatedAt',
      date: testDate,
      condition: 'OR',
    });

    expect(orWhereSpy).toHaveBeenCalledWith(
      'base_alias.updatedAt < :base_alias_updatedAt',
      { base_alias_updatedAt: testDate },
    );
  });

  it('should manage dateLessThan queries safely under strict AND configurations', () => {
    const testDate = new Date();
    service.dateLessThan({
      query: mockQueryBuilder,
      field: 'updatedAt',
      date: testDate,
      condition: 'AND',
    });

    expect(andWhereSpy).toHaveBeenCalledWith(
      'base_alias.updatedAt < :base_alias_updatedAt',
      { base_alias_updatedAt: testDate },
    );
  });

  it('should exit range validations early if incoming date items are completely missing', () => {
    service.dateGreaterThan({
      query: mockQueryBuilder,
      field: 'createdAt',
      date: undefined,
      condition: 'AND',
    });
    service.dateLessThan({
      query: mockQueryBuilder,
      field: 'updatedAt',
      date: undefined,
      condition: 'AND',
    });

    expect(andWhereSpy).not.toHaveBeenCalled();
  });

  it('should successfully route construction settings to managers via initQuery setups', () => {
    const result = service.initQuery({ entity: 'UserEntity', alias: 'u' });

    expect(createQueryBuilderSpy).toHaveBeenCalledWith('UserEntity', 'u');
    expect(result).toBe(mockQueryBuilder);
  });

  it('should evaluate expression presence criteria variables correctly inside isJoinPresent blocks', () => {
    mockQueryBuilder.expressionMap.joinAttributes = [
      { alias: { name: 'existing_relation_alias' } },
    ] as unknown as any[];

    const checkTrue = service.isJoinPresent({
      query: mockQueryBuilder,
      relationAlias: 'existing_relation_alias',
    });
    const checkFalse = service.isJoinPresent({
      query: mockQueryBuilder,
      relationAlias: 'ghost_alias',
    });

    expect(checkTrue).toBe(true);
    expect(checkFalse).toBe(false);
  });

  it('should append primary table links dynamically if checks within joinRelation determine it is missing', () => {
    service.joinRelation({
      query: mockQueryBuilder,
      alias: 'roles',
    });

    expect(leftJoinAndSelectSpy).toHaveBeenCalledWith(
      'base_alias.roles',
      'roles',
    );
  });

  it('should append deep multi-tiered nested relations correctly if structural parameters contain target aliases', () => {
    service.joinRelation({
      query: mockQueryBuilder,
      nestedFrom: 'roles',
      alias: 'permissions',
      relationAlias: 'custom_perms',
    });

    expect(leftJoinAndSelectSpy).toHaveBeenCalledWith(
      'roles.permissions',
      'custom_perms',
    );
  });
});

describe('EntityQueryService - Pagination, Ordering and Data Extraction Pipelines', () => {
  let service: EntityQueryService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

  let skipSpy: jest.Mock;
  let takeSpy: jest.Mock;
  let distinctSpy: jest.Mock;
  let orderBySpy: jest.Mock;
  let cloneSpy: jest.Mock;
  let getManySpy: jest.Mock;
  let getManyAndCountSpy: jest.Mock;
  let cacheGetSpy: jest.Mock;
  let cacheSetSpy: jest.Mock;
  let cacheCoalesceSpy: jest.Mock;
  let findColumnSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    skipSpy = jest.fn();
    takeSpy = jest.fn();
    distinctSpy = jest.fn();
    orderBySpy = jest.fn();
    cloneSpy = jest.fn();
    getManySpy = jest.fn();
    getManyAndCountSpy = jest.fn();
    findColumnSpy = jest.fn();

    mockQueryBuilder = {
      alias: 'base_alias',
      andWhere: jest.fn(),
      orWhere: jest.fn(),
      skip: skipSpy,
      take: takeSpy,
      distinct: distinctSpy,
      orderBy: orderBySpy,
      leftJoinAndSelect: jest.fn(),
      clone: cloneSpy,
      getMany: getManySpy,
      getManyAndCount: getManyAndCountSpy,
      getQueryAndParameters: jest
        .fn()
        .mockReturnValue(['SELECT * FROM base', []]),
      expressionMap: {
        skip: 0,
        take: 10,
        joinAttributes: [],
        mainAlias: {
          metadata: {
            findColumnWithPropertyName: findColumnSpy,
          },
        },
      },
    } as unknown as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;

    skipSpy.mockReturnValue(mockQueryBuilder);
    takeSpy.mockReturnValue(mockQueryBuilder);
    distinctSpy.mockReturnValue(mockQueryBuilder);
    orderBySpy.mockReturnValue(mockQueryBuilder);
    cloneSpy.mockReturnValue(mockQueryBuilder);

    mockEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<EntityManager>;

    cacheGetSpy = jest.fn();
    cacheSetSpy = jest.fn();
    cacheCoalesceSpy = jest
      .fn()
      .mockImplementation(
        async (options: { operation: () => Promise<unknown> }) => {
          return await options.operation();
        },
      );

    mockCacheService = {
      get: cacheGetSpy,
      set: cacheSetSpy,
      coalesce: cacheCoalesceSpy,
    } as unknown as jest.Mocked<CacheService>;

    service = new EntityQueryService(mockEntityManager, mockCacheService);
  });

  it('should accurately calculate pagination math bounds using input metrics', () => {
    const config: PaginationDto = { page: 3, limit: 25 };
    service.paginate({ query: mockQueryBuilder, pagination: config });

    expect(skipSpy).toHaveBeenCalledWith(50);
    expect(takeSpy).toHaveBeenCalledWith(25);
  });

  it('should default pagination structures securely if parameters are missing', () => {
    service.paginate({ query: mockQueryBuilder });

    expect(skipSpy).toHaveBeenCalledWith(0);
    expect(takeSpy).toHaveBeenCalledWith(10);
  });

  it('should safely exit sort mutation execution sequences if ordering parameter sets are empty', () => {
    service.sort({ query: mockQueryBuilder, sort: undefined });
    expect(orderBySpy).not.toHaveBeenCalled();
  });

  it('should successfully map order targets if reflection methods reveal valid data structures', () => {
    const sortConfig: SortDto = { sortField: 'username', sortOrder: 'DESC' };
    findColumnSpy.mockReturnValue({ propertyName: 'username' });

    service.sort({ query: mockQueryBuilder, sort: sortConfig });

    expect(orderBySpy).toHaveBeenCalledWith('base_alias.username', 'DESC');
  });

  it('should loop chunk iterations completely during getAll processing runs until boundaries clear completely', async () => {
    const dummyRecord = { id: 1 };
    const completeBatch = new Array(100).fill(dummyRecord) as ObjectLiteral[];
    const trailingBatch = new Array(30).fill(dummyRecord) as ObjectLiteral[];

    getManySpy
      .mockResolvedValueOnce(completeBatch)
      .mockResolvedValueOnce(trailingBatch);

    const data = await service.getAll({ query: mockQueryBuilder });

    expect(data.length).toBe(130);
    expect(getManySpy).toHaveBeenCalledTimes(2);
  });

  it('should return live active records instantly if paginatedResult catches target information inside caching networks', async () => {
    const mockCachedPayload = {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      data: [{ id: 'cached' }],
    };
    cacheGetSpy.mockResolvedValueOnce(mockCachedPayload);

    const result = await service.paginatedResult({
      query: mockQueryBuilder,
      cache: true,
    });

    expect(result).toEqual(mockCachedPayload);
    expect(getManyAndCountSpy).not.toHaveBeenCalled();
  });

  it('should fetch database assets directly and commit them to cache structures if search flags request persistence', async () => {
    cacheGetSpy.mockResolvedValueOnce(undefined);
    getManyAndCountSpy.mockResolvedValueOnce([[{ id: 'db-item' }], 1]);

    const result = await service.paginatedResult({
      query: mockQueryBuilder,
      cache: true,
    });

    expect(result.data).toEqual([{ id: 'db-item' }]);
    expect(cacheSetSpy).toHaveBeenCalled();
  });

  it('should load database records directly without interacting with cache networks if configuration cache directives are disabled', async () => {
    cacheGetSpy.mockResolvedValueOnce(undefined);
    getManyAndCountSpy.mockResolvedValueOnce([[{ id: 'no-cache-item' }], 1]);

    const result = await service.paginatedResult({
      query: mockQueryBuilder,
      cache: false,
    });

    expect(result.data).toEqual([{ id: 'no-cache-item' }]);
    expect(cacheCoalesceSpy).not.toHaveBeenCalled();
    expect(cacheSetSpy).not.toHaveBeenCalled();
  });
});
