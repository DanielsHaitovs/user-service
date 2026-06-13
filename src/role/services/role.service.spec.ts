import { EntityQueryService } from '@/baseServices/query.service';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import type { RolesQueryRequest } from '@/roleDto/query.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;

  let mockRoleRepository: {
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
  const mockRoleId = randomUUID();

  beforeEach(async () => {
    mockRoleRepository = {
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
        RoleService,
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRoleRepository,
        },
        {
          provide: EntityQueryService,
          useValue: mockEntityQueryService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByIdOrThrow', () => {
    it('should successfully fetch and return a targeted role if it exists', async () => {
      const mockRoleRecord = { id: mockRoleId, name: 'Moderator' };
      mockRoleRepository.findOneOrFail.mockResolvedValue(mockRoleRecord);

      const result = await service.getByIdOrThrow(mockRoleId);

      expect(result).toEqual(mockRoleRecord);
      expect(mockRoleRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockRoleId },
      });
    });

    it('should propagate core exceptions if findOneOrFail rejects', async () => {
      mockRoleRepository.findOneOrFail.mockRejectedValue(
        new Error('EntityNotFound'),
      );

      await expect(service.getByIdOrThrow(mockRoleId)).rejects.toThrow(
        'EntityNotFound',
      );
    });
  });

  describe('getMany', () => {
    it('should invoke all query configuration steps including date filtering when complete parameters are passed', async () => {
      const fullQueryRequest: RolesQueryRequest = {
        ids: [mockRoleId],
        names: ['Admin'],
        page: 1,
        limit: 10,
        sortField: 'name',
        sortOrder: 'ASC',
        dateFilterParam: 'createdAt',
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      const mockPaginatedOutput = {
        data: [{ id: mockRoleId, name: 'Admin' }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockEntityQueryService.paginatedResult.mockResolvedValue(
        mockPaginatedOutput,
      );

      const result = await service.getMany(fullQueryRequest);

      expect(result).toEqual(mockPaginatedOutput);

      expect(mockEntityQueryService.initQuery).toHaveBeenCalledWith({
        entity: Roles,
        alias: ROLE_QUERY_ALIAS,
      });

      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'name',
        condition: 'AND',
        values: ['Admin'],
      });
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'id',
        condition: 'AND',
        values: [mockRoleId],
      });

      expect(mockEntityQueryService.dateGreaterThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: new Date('2026-01-01'),
      });
      expect(mockEntityQueryService.dateLessThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: new Date('2026-12-31'),
      });

      expect(mockEntityQueryService.sort).toHaveBeenCalledWith({
        query: mockQueryInstance,
        sort: { sortField: 'name', sortOrder: 'ASC' },
      });
      expect(mockEntityQueryService.paginate).toHaveBeenCalledWith({
        query: mockQueryInstance,
        pagination: { page: 1, limit: 10 },
      });

      expect(mockEntityQueryService.paginatedResult).toHaveBeenCalledWith({
        query: mockQueryInstance,
        cache: true,
      });
    });

    it('should cleanly skip date filter hooks if dateFilterParam is completely omitted or undefined', async () => {
      const leanQueryRequest: RolesQueryRequest = {
        page: 2,
        limit: 25,
        sortField: 'id',
        sortOrder: 'DESC',
        dateFrom: undefined,
        dateTo: undefined,
      };

      mockEntityQueryService.paginatedResult.mockResolvedValue({
        data: [],
        meta: {},
      });

      await service.getMany(leanQueryRequest);

      expect(mockEntityQueryService.initQuery).toHaveBeenCalled();
      expect(mockEntityQueryService.sort).toHaveBeenCalled();
      expect(mockEntityQueryService.paginate).toHaveBeenCalledWith({
        query: mockQueryInstance,
        pagination: { page: 2, limit: 25 },
      });

      expect(mockEntityQueryService.dateGreaterThan).not.toHaveBeenCalled();
      expect(mockEntityQueryService.dateLessThan).not.toHaveBeenCalled();
    });
  });
});
