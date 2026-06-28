import { EntityQueryService } from '@/baseServices/query.service';
import { USER_STORES_QUERY_ALIAS } from '@/commonConst/store.const';
import type { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { StoreHelperService } from '@/storeServices/helper.service';
import type { UserStoresQueryRequest } from '@/userDto/stores.dto';
import { UserStores } from '@/userEntities/userStores.entity';
import { UserStoresService } from '@/userStoreServices/store.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { type DeleteResult, In } from 'typeorm';

describe('UserStoresService', () => {
  let service: UserStoresService;

  let mockStoreRepository: {
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let mockStoreHelperService: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  let mockEntityQueryService: {
    initQuery: jest.Mock;
    joinRelation: jest.Mock;
    where: jest.Mock;
    whereIn: jest.Mock;
    dateGreaterThan: jest.Mock;
    dateLessThan: jest.Mock;
    sort: jest.Mock;
    paginate: jest.Mock;
    paginatedResult: jest.Mock;
    getAll: jest.Mock;
  };

  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    select: jest.Mock;
  };

  const mockQueryInstance = { type: 'SelectQueryBuilder', select: jest.fn() };
  const mockUserId = randomUUID();
  const mockStoreId = randomUUID();
  const mockAssignedById = randomUUID();

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    mockStoreRepository = {
      save: jest.fn(),
      delete: jest
        .fn()
        .mockResolvedValue({ raw: [], affected: 1 } as DeleteResult),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockStoreHelperService = {
      checkIfManyExistOrThrow: jest.fn().mockResolvedValue([mockStoreId]),
    };

    mockEntityQueryService = {
      initQuery: jest.fn().mockReturnValue(mockQueryInstance),
      joinRelation: jest.fn(),
      where: jest.fn(),
      whereIn: jest.fn(),
      dateGreaterThan: jest.fn(),
      dateLessThan: jest.fn(),
      sort: jest.fn(),
      paginate: jest.fn(),
      paginatedResult: jest.fn(),
      getAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStoresService,
        {
          provide: getRepositoryToken(UserStores),
          useValue: mockStoreRepository,
        },
        {
          provide: StoreHelperService,
          useValue: mockStoreHelperService,
        },
        {
          provide: EntityQueryService,
          useValue: mockEntityQueryService,
        },
      ],
    }).compile();

    service = module.get<UserStoresService>(UserStoresService);

    mockQueryInstance.select.mockReturnValue(mockQueryInstance);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStores', () => {
    it('should invoke full query service architecture configuration including multiple whereIn blocks', async () => {
      const fullRequest: UserStoresQueryRequest = {
        userId: mockUserId,
        codes: ['ST-001'],
        viewCodes: ['VW-001'],
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'ASC',
        dateFilterParam: 'createdAt',
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      const mockOutput = {
        data: [
          {
            id: randomUUID(),
            store: { id: mockStoreId, name: 'Main Retail HQ' },
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockEntityQueryService.paginatedResult.mockResolvedValue(mockOutput);

      const result = await service.getStores(fullRequest);

      expect(result).toEqual(mockOutput);
      expect(mockEntityQueryService.initQuery).toHaveBeenCalledWith({
        entity: UserStores,
        alias: 'userStore',
      });

      expect(mockEntityQueryService.joinRelation).toHaveBeenCalledWith({
        query: mockQueryInstance,
        alias: 'user',
      });
      expect(mockEntityQueryService.joinRelation).toHaveBeenCalledWith({
        query: mockQueryInstance,
        alias: 'store',
      });

      expect(mockEntityQueryService.where).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'user.id',
        condition: 'AND',
        value: mockUserId,
      });

      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'store.code',
        condition: 'AND',
        values: ['ST-001'],
      });

      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'store.viewCode',
        condition: 'AND',
        values: ['VW-001'],
      });

      expect(mockEntityQueryService.dateGreaterThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'userStore.createdAt',
        condition: 'AND',
        date: fullRequest.dateFrom,
      });
      expect(mockEntityQueryService.dateLessThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'userStore.createdAt',
        condition: 'AND',
        date: fullRequest.dateTo,
      });

      expect(mockQueryInstance.select).toHaveBeenCalledWith([
        'userStore.id',
        'userStore.createdAt',
        'userStore.updatedAt',
        'store.id',
        'store.name',
        'store.code',
        'store.viewCode',
        'store.createdAt',
      ]);
    });

    it('should cleanly bypass date tracking query blocks when dateFilterParam is undefined', async () => {
      const leanRequest: UserStoresQueryRequest = {
        userId: mockUserId,
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'ASC',
      };

      await service.getStores(leanRequest);

      expect(mockEntityQueryService.dateGreaterThan).not.toHaveBeenCalled();
      expect(mockEntityQueryService.dateLessThan).not.toHaveBeenCalled();
    });
  });

  describe('assignStoresToUser', () => {
    it('should break execution cycle early if all input storeIds are already mapped inside the assignedStores variable', async () => {
      const preAssignedStores: GetRelatedStoreDto[] = [
        {
          id: mockStoreId,
          name: 'HQ',
          code: 'HQ-1',
          viewCode: 'V1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await service.assignStoresToUser({
        userId: mockUserId,
        data: { storeIds: [mockStoreId] },
        assignedStores: preAssignedStores,
        assignedById: mockAssignedById,
      });

      expect(
        mockStoreHelperService.checkIfManyExistOrThrow,
      ).toHaveBeenCalledWith([mockStoreId]);
      expect(mockStoreRepository.save).not.toHaveBeenCalled();
    });

    it('should proceed to save input arrays if discrepancies exist between payload IDs and current allocations', async () => {
      const newStoreId = randomUUID();
      const preAssignedStores: GetRelatedStoreDto[] = [
        {
          id: mockStoreId,
          name: 'HQ',
          code: 'HQ-1',
          viewCode: 'V1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await service.assignStoresToUser({
        userId: mockUserId,
        data: { storeIds: [mockStoreId, newStoreId] },
        assignedStores: preAssignedStores,
        assignedById: mockAssignedById,
      });

      // Asserts mapping pattern tracks the raw data list input based on your service's map array code
      expect(mockStoreRepository.save).toHaveBeenCalledWith([
        {
          user: { id: mockUserId },
          store: { id: newStoreId },
          assignedBy: { id: mockAssignedById },
        },
      ]);
    });
  });

  describe('unassignStoresFromUser', () => {
    it('should stop modification routines early if the provided pre-assigned store array is completely empty', async () => {
      await service.unassignStoresFromUser({
        userId: mockUserId,
        assignedStores: [],
        data: { storeIds: [mockStoreId] },
      });

      expect(mockStoreRepository.delete).not.toHaveBeenCalled();
    });

    it('should return immediately if none of the input parameters overlap with historical tracking entities', async () => {
      const alternativeStoreId = randomUUID();
      const preAssignedStores: GetRelatedStoreDto[] = [
        {
          id: mockStoreId,
          name: 'HQ',
          code: 'HQ-1',
          viewCode: 'V1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await service.unassignStoresFromUser({
        userId: mockUserId,
        assignedStores: preAssignedStores,
        data: { storeIds: [alternativeStoreId] },
      });

      expect(mockStoreRepository.delete).not.toHaveBeenCalled();
    });

    it('should execute clear repository deletion routes with an In array wrapper when valid matches are handled', async () => {
      const preAssignedStores: GetRelatedStoreDto[] = [
        {
          id: mockStoreId,
          name: 'HQ',
          code: 'HQ-1',
          viewCode: 'V1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await service.unassignStoresFromUser({
        userId: mockUserId,
        assignedStores: preAssignedStores,
        data: { storeIds: [mockStoreId] },
      });

      expect(mockStoreRepository.delete).toHaveBeenCalledWith({
        user: { id: mockUserId },
        store: { id: In([mockStoreId]) },
      });
    });
  });

  describe('getAssignedStores', () => {
    it('should bind coordinates onto the query builder interface and extract structural nested store arrays', async () => {
      const mockRelationRecords = [
        {
          id: 'rel-unique-1',
          store: { id: mockStoreId, name: 'North Hub', code: 'N-01' },
        },
      ];
      mockEntityQueryService.getAll.mockResolvedValue(mockRelationRecords);

      const result = await service.getAssignedStores(mockUserId);

      expect(result).toEqual([
        { id: mockStoreId, name: 'North Hub', code: 'N-01' },
      ]);
      expect(mockStoreRepository.createQueryBuilder).toHaveBeenCalledWith(
        USER_STORES_QUERY_ALIAS,
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${USER_STORES_QUERY_ALIAS}.store`,
        'store',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${USER_STORES_QUERY_ALIAS}.user`,
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.id = :userId', {
        userId: mockUserId,
      });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        `${USER_STORES_QUERY_ALIAS}.id`,
        'store.id',
        'store.name',
        'store.code',
        'store.viewCode',
        'store.createdAt',
        'store.updatedAt',
      ]);
    });
  });
});
