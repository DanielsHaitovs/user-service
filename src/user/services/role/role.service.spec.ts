import { EntityQueryService } from '@/baseServices/query.service';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import type { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { RoleHelperService } from '@/roleServices/helper.service';
import type { UserRolesQueryRequest } from '@/userDto/roles.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { type DeleteResult, In } from 'typeorm';

describe('UserRolesService', () => {
  let service: UserRolesService;

  let mockRoleRepository: {
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let mockRoleHelperService: {
    checkIfManyExistOrThrow: jest.Mock;
    getAllPermissions: jest.Mock;
  };

  let mockEntityQueryService: {
    initQuery: jest.Mock;
    joinRelation: jest.Mock;
    where: jest.Mock;
    dateGreaterThan: jest.Mock;
    dateLessThan: jest.Mock;
    whereIn: jest.Mock;
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
  const mockRoleId = randomUUID();
  const mockAssignedById = randomUUID();

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    mockRoleRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest
        .fn()
        .mockResolvedValue({ raw: [], affected: 1 } as DeleteResult),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockRoleHelperService = {
      checkIfManyExistOrThrow: jest.fn().mockResolvedValue([mockRoleId]),
      getAllPermissions: jest.fn(),
    };

    mockEntityQueryService = {
      initQuery: jest.fn().mockReturnValue(mockQueryInstance),
      joinRelation: jest.fn(),
      where: jest.fn(),
      dateGreaterThan: jest.fn(),
      dateLessThan: jest.fn(),
      whereIn: jest.fn(),
      sort: jest.fn(),
      paginate: jest.fn(),
      paginatedResult: jest.fn(),
      getAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesService,
        {
          provide: getRepositoryToken(UserRoles),
          useValue: mockRoleRepository,
        },
        {
          provide: RoleHelperService,
          useValue: mockRoleHelperService,
        },
        {
          provide: EntityQueryService,
          useValue: mockEntityQueryService,
        },
      ],
    }).compile();

    service = module.get<UserRolesService>(UserRolesService);

    mockQueryInstance.select.mockReturnValue(mockQueryInstance);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoles', () => {
    it('should invoke complete query service composition including dynamic filter structures', async () => {
      const fullRequest: UserRolesQueryRequest = {
        userId: mockUserId,
        names: ['Admin', 'Manager'],
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'DESC',
        dateFilterParam: 'createdAt',
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-12-31'),
      };

      const mockOutput = {
        data: [{ id: randomUUID(), role: { id: mockRoleId, name: 'Admin' } }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      mockEntityQueryService.paginatedResult.mockResolvedValue(mockOutput);

      const result = await service.getRoles(fullRequest);

      expect(result).toEqual(mockOutput);
      expect(mockEntityQueryService.initQuery).toHaveBeenCalledWith({
        entity: UserRoles,
        alias: USER_ROLE_QUERY_ALIAS,
      });

      expect(mockEntityQueryService.joinRelation).toHaveBeenCalledWith({
        query: mockQueryInstance,
        alias: 'user',
      });
      expect(mockEntityQueryService.joinRelation).toHaveBeenCalledWith({
        query: mockQueryInstance,
        alias: 'role',
      });

      expect(mockEntityQueryService.where).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'user.id',
        condition: 'AND',
        value: mockUserId,
      });

      expect(mockEntityQueryService.dateGreaterThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: fullRequest.dateFrom,
      });
      expect(mockEntityQueryService.dateLessThan).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'createdAt',
        condition: 'AND',
        date: fullRequest.dateTo,
      });

      expect(mockEntityQueryService.whereIn).toHaveBeenCalledWith({
        query: mockQueryInstance,
        field: 'role.name',
        condition: 'AND',
        values: ['Admin', 'Manager'],
      });

      expect(mockQueryInstance.select).toHaveBeenCalledWith([
        `${USER_ROLE_QUERY_ALIAS}.id`,
        `${USER_ROLE_QUERY_ALIAS}.createdAt`,
        `${USER_ROLE_QUERY_ALIAS}.updatedAt`,
        'role.id',
        'role.name',
        'role.createdAt',
      ]);
    });

    it('should cleanly skip execution blocks for dates and name lists when context arrays are absent', async () => {
      const leanRequest: UserRolesQueryRequest = {
        userId: mockUserId,
        page: 2,
        limit: 20,
        sortField: 'createdAt',
        sortOrder: 'ASC',
      };

      await service.getRoles(leanRequest);

      expect(mockEntityQueryService.dateGreaterThan).not.toHaveBeenCalled();
      expect(mockEntityQueryService.dateLessThan).not.toHaveBeenCalled();
      expect(mockEntityQueryService.whereIn).not.toHaveBeenCalled();
    });
  });

  describe('getPermissions', () => {
    it('should return empty collection arrays immediately if input roleIds list is empty', async () => {
      const result = await service.getPermissions([]);

      expect(result).toEqual([]);
      expect(mockRoleHelperService.getAllPermissions).not.toHaveBeenCalled();
    });

    it('should query helper layer directly using explicit role ids array', async () => {
      const targetRoleIds = [mockRoleId];
      mockRoleHelperService.getAllPermissions.mockResolvedValue([
        'READ_USER',
        'WRITE_USER',
      ]);

      const result = await service.getPermissions(targetRoleIds);

      expect(result).toEqual(['READ_USER', 'WRITE_USER']);
      expect(mockRoleHelperService.getAllPermissions).toHaveBeenCalledWith(
        targetRoleIds,
      );
    });
  });

  describe('assignRolesToUser', () => {
    it('should break out early returning false if incoming payload changes overlap fully with existing lists', async () => {
      const preAssignedRoles: GetRelatedRoleDto[] = [
        {
          id: mockRoleId,
          name: 'Admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.assignRolesToUser({
        userId: mockUserId,
        assignedRoles: preAssignedRoles,
        data: { roleIds: [mockRoleId] },
        assignedById: mockAssignedById,
      });

      expect(result).toBe(false);
      expect(
        mockRoleHelperService.checkIfManyExistOrThrow,
      ).toHaveBeenCalledWith([mockRoleId]);
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should break out early returning false if incoming roleIds array is entirely empty', async () => {
      const result = await service.assignRolesToUser({
        userId: mockUserId,
        assignedRoles: [],
        data: { roleIds: [] },
        assignedById: mockAssignedById,
      });

      expect(result).toBe(false);
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should isolate differential items and update repository tables context entries', async () => {
      const newRoleId = randomUUID();
      const preAssignedRoles: GetRelatedRoleDto[] = [
        {
          id: mockRoleId,
          name: 'Admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.assignRolesToUser({
        userId: mockUserId,
        assignedRoles: preAssignedRoles,
        data: { roleIds: [mockRoleId, newRoleId] },
        assignedById: mockAssignedById,
      });

      expect(result).toBe(true);
      expect(mockRoleRepository.save).toHaveBeenCalledWith([
        {
          user: { id: mockUserId },
          role: { id: newRoleId },
          assignedBy: { id: mockAssignedById },
        },
      ]);
    });
  });

  describe('unassignRolesFromUser', () => {
    it('should stop modification routines early if the provided pre-assigned role array is completely empty', async () => {
      const result = await service.unassignRolesFromUser({
        userId: mockUserId,
        assignedRoles: [],
        data: { roleIds: [mockRoleId] },
      });

      expect(result).toBe(false);
      expect(mockRoleRepository.delete).not.toHaveBeenCalled();
    });

    it('should bypass data mutation layers entirely if intersection evaluation yields zero overlaps', async () => {
      const alternativeRoleId = randomUUID();
      const preAssignedRoles: GetRelatedRoleDto[] = [
        {
          id: mockRoleId,
          name: 'Admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.unassignRolesFromUser({
        userId: mockUserId,
        assignedRoles: preAssignedRoles,
        data: { roleIds: [alternativeRoleId] },
      });

      expect(result).toBe(false);
      expect(mockRoleRepository.delete).not.toHaveBeenCalled();
    });

    it('should successfully execute storage drops using explicit array identifiers when matching overlaps are resolved', async () => {
      const preAssignedRoles: GetRelatedRoleDto[] = [
        {
          id: mockRoleId,
          name: 'Admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await service.unassignRolesFromUser({
        userId: mockUserId,
        assignedRoles: preAssignedRoles,
        data: { roleIds: [mockRoleId] },
      });

      expect(result).toBe(true);
      expect(mockRoleRepository.delete).toHaveBeenCalledWith({
        user: { id: mockUserId },
        role: { id: In([mockRoleId]) },
      });
    });
  });

  describe('getAssignedRoles', () => {
    it('should assemble structured parameters onto a query builder instance and return unnested role maps', async () => {
      const mockUserRoleRecords = [
        { id: 'relation-id-1', role: { id: mockRoleId, name: 'Support' } },
      ];
      mockEntityQueryService.getAll.mockResolvedValue(mockUserRoleRecords);

      const result = await service.getAssignedRoles(mockUserId);

      expect(result).toEqual([{ id: mockRoleId, name: 'Support' }]);
      expect(mockRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
        USER_ROLE_QUERY_ALIAS,
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${USER_ROLE_QUERY_ALIAS}.role`,
        'role',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${USER_ROLE_QUERY_ALIAS}.user`,
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.id = :userId', {
        userId: mockUserId,
      });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        `${USER_ROLE_QUERY_ALIAS}.id`,
        'role.id',
        'role.name',
        'role.createdAt',
        'role.updatedAt',
      ]);
    });
  });
});
