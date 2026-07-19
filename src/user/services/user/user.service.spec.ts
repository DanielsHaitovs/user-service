import { EntityQueryService } from '@/baseServices/query.service';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import type { UserQueryRequest } from '@/userDto/query.dto';
import { User } from '@/userEntities/user.entity';
import { UserService } from '@/userServices/user.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

describe('UserService', () => {
  let service: UserService;

  let mockUserRepository: {
    findOneOrFail: jest.Mock;
  };

  let mockEntityQueryService: {
    initQuery: jest.Mock;
    whereIn: jest.Mock;
    where: jest.Mock;
    dateGreaterThan: jest.Mock;
    dateLessThan: jest.Mock;
    sort: jest.Mock;
    paginate: jest.Mock;
    paginatedResult: jest.Mock;
  };

  const mockQueryInstance = { type: 'SelectQueryBuilder' };
  const mockUserId = randomUUID();
  const mockEmail = 'user.service@example.com';
  const mockUserRecord = {
    id: mockUserId,
    email: mockEmail,
    firstName: 'Jane',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOneOrFail: jest.fn(),
    };

    mockEntityQueryService = {
      initQuery: jest.fn().mockReturnValue(mockQueryInstance),
      whereIn: jest.fn(),
      where: jest.fn(),
      dateGreaterThan: jest.fn(),
      dateLessThan: jest.fn(),
      sort: jest.fn(),
      paginate: jest.fn(),
      paginatedResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EntityQueryService,
          useValue: mockEntityQueryService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMany', () => {
    it('should invoke full query service architecture configuration including date filters when all keys are passed', async () => {
      const fullQueryRequest: UserQueryRequest = {
        ids: [mockUserId],
        firstNames: ['Jane'],
        emails: [mockEmail],
        isActive: true,
        page: 1,
        limit: 10,
        sortField: 'firstName',
        sortOrder: 'ASC',
        dateFilterParam: 'createdAt',
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      const mockPaginatedOutput = {
        data: [mockUserRecord],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockEntityQueryService.paginatedResult.mockResolvedValue(
        mockPaginatedOutput,
      );

      const result = await service.getMany(fullQueryRequest);

      expect(result).toEqual(mockPaginatedOutput);

      expect(mockEntityQueryService.initQuery).toHaveBeenCalledWith({
        entity: User,
        alias: USER_QUERY_ALIAS,
      });

      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'id',
        condition: 'AND',
        values: [mockUserId],
      });
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'firstName',
        condition: 'AND',
        values: ['Jane'],
      });
      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'email',
        condition: 'AND',
        values: [mockEmail],
      });

      expect(mockEntityQueryService.where).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'isActive',
        condition: 'AND',
        value: true,
      });

      expect(mockEntityQueryService.dateGreaterThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: fullQueryRequest.dateFrom,
      });
      expect(mockEntityQueryService.dateLessThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: fullQueryRequest.dateTo,
      });

      expect(mockEntityQueryService.sort).toHaveBeenCalledWith({
        query: mockQueryInstance,
        sort: { sortField: 'firstName', sortOrder: 'ASC' },
      });
      expect(mockEntityQueryService.paginate).toHaveBeenCalledWith({
        query: mockQueryInstance,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should cleanly skip date filter hooks if dateFilterParam is omitted or undefined', async () => {
      const leanQueryRequest: UserQueryRequest = {
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'DESC',
      };

      mockEntityQueryService.paginatedResult.mockResolvedValue({
        data: [],
        meta: {},
      });

      await service.getMany(leanQueryRequest);

      expect(mockEntityQueryService.initQuery).toHaveBeenCalled();
      expect(mockEntityQueryService.sort).toHaveBeenCalled();
      expect(mockEntityQueryService.paginate).toHaveBeenCalled();

      expect(mockEntityQueryService.dateGreaterThan).not.toHaveBeenCalled();
      expect(mockEntityQueryService.dateLessThan).not.toHaveBeenCalled();
    });
  });

  describe('getByIdOrThrow', () => {
    it('should successfully fetch and return a targeted user if it exists in storage', async () => {
      mockUserRepository.findOneOrFail.mockResolvedValue(mockUserRecord);

      const result = await service.getByIdOrThrow(mockUserId);

      expect(result).toEqual(mockUserRecord);
      expect(mockUserRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should propagate core exceptions up the thread stack if findOneOrFail rejects', async () => {
      mockUserRepository.findOneOrFail.mockRejectedValue(
        new Error('EntityNotFound'),
      );

      await expect(service.getByIdOrThrow(mockUserId)).rejects.toThrow(
        'EntityNotFound',
      );
    });
  });

  describe('getByEmailOrThrow', () => {
    it('should successfully fetch and return a targeted user based on email parameters', async () => {
      mockUserRepository.findOneOrFail.mockResolvedValue(mockUserRecord);

      const result = await service.getByEmailOrThrow(mockEmail);

      expect(result).toEqual(mockUserRecord);
      expect(mockUserRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });

    it('should propagate core exceptions up the thread stack if email lookup operations reject', async () => {
      mockUserRepository.findOneOrFail.mockRejectedValue(
        new Error('EntityNotFound'),
      );

      await expect(service.getByEmailOrThrow(mockEmail)).rejects.toThrow(
        'EntityNotFound',
      );
    });
  });
});
