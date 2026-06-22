import { EntityQueryService } from '@/baseServices/query.service';
import { STORE_QUERY_ALIAS } from '@/commonConst/store.const';
import type { StoreQueryRequest } from '@/storeDto/query.dto';
import { Store } from '@/storeEntities/store.entity';
import { StoreService } from '@/storeServices/store.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

describe('StoreService', () => {
  let service: StoreService;

  let mockStoreRepository: {
    findOneOrFail: jest.Mock;
  };

  let mockEntityQueryService: {
    initQuery: jest.Mock;
    whereIn: jest.Mock;
    dateGreaterThan: jest.Mock;
    dateLessThan: jest.Mock;
    sort: jest.Mock;
    paginate: jest.Mock;
    paginatedResult: jest.Mock;
  };

  const mockQueryInstance = { type: 'SelectQueryBuilder' };
  const mockStoreId = randomUUID();

  beforeEach(async () => {
    mockStoreRepository = {
      findOneOrFail: jest.fn(),
    };

    mockEntityQueryService = {
      initQuery: jest.fn().mockReturnValue(mockQueryInstance),
      whereIn: jest.fn(),
      dateGreaterThan: jest.fn(),
      dateLessThan: jest.fn(),
      sort: jest.fn(),
      paginate: jest.fn(),
      paginatedResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: EntityQueryService,
          useValue: mockEntityQueryService,
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByIdOrThrow', () => {
    it('should successfully fetch and return a store if it exists', async () => {
      const mockStoreRecord = { id: mockStoreId, name: 'Main Store' };
      mockStoreRepository.findOneOrFail.mockResolvedValue(mockStoreRecord);

      const result = await service.getByIdOrThrow(mockStoreId);

      expect(result).toEqual(mockStoreRecord);
      expect(mockStoreRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockStoreId },
      });
    });
  });

  describe('getMany', () => {
    it('should invoke all query configuration steps including date filtering', async () => {
      const fullQueryRequest: StoreQueryRequest = {
        ids: [mockStoreId],
        names: ['Main Store'],
        codes: ['MS01'],
        viewCodes: ['VC01'],
        page: 1,
        limit: 10,
        sortField: 'name',
        sortOrder: 'ASC',
        dateFilterParam: 'createdAt' as const,
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      const mockPaginatedOutput = {
        data: [{ id: mockStoreId, name: 'Main Store' }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockEntityQueryService.paginatedResult.mockResolvedValue(
        mockPaginatedOutput,
      );

      const result = await service.getMany(fullQueryRequest);

      expect(result).toEqual(mockPaginatedOutput);
      expect(mockEntityQueryService.initQuery).toHaveBeenCalledWith({
        entity: Store,
        alias: STORE_QUERY_ALIAS,
      });

      // Verify all whereIn filters
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'name', values: ['Main Store'] }),
      );
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'id', values: [mockStoreId] }),
      );
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'code', values: ['MS01'] }),
      );
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'viewCode', values: ['VC01'] }),
      );

      // Verify Date Filters
      expect(mockEntityQueryService.dateGreaterThan).toHaveBeenCalled();
      expect(mockEntityQueryService.dateLessThan).toHaveBeenCalled();
    });
  });
});
