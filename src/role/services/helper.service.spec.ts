import { EntityQueryService } from '@/baseServices/query.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { In } from 'typeorm';

describe('RoleHelperService', () => {
  let service: RoleHelperService;

  let mockRoleRepository: {
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let mockEntityQueryService: {
    getAll: jest.Mock;
  };

  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    select: jest.Mock;
  };

  const mockRoleId1 = randomUUID();
  const mockRoleId2 = randomUUID();

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    mockRoleRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockEntityQueryService = {
      getAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleHelperService,
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

    service = module.get<RoleHelperService>(RoleHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIfManyExistOrThrow', () => {
    it('should throw an UnprocessableEntityException if the input array is undefined', async () => {
      await expect(service.checkIfManyExistOrThrow()).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );
      expect(mockRoleRepository.find).not.toHaveBeenCalled();
    });

    it('should throw an UnprocessableEntityException if the input array is empty', async () => {
      await expect(service.checkIfManyExistOrThrow([])).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );
      expect(mockRoleRepository.find).not.toHaveBeenCalled();
    });

    it('should successfully return an array of UUIDs if all provided role IDs match database records', async () => {
      const inputIds = [mockRoleId1, mockRoleId2];
      const databaseRecords = [{ id: mockRoleId1 }, { id: mockRoleId2 }];
      mockRoleRepository.find.mockResolvedValue(databaseRecords);

      const result = await service.checkIfManyExistOrThrow(inputIds);

      expect(result).toEqual([mockRoleId1, mockRoleId2]);
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        where: { id: In(inputIds) },
        select: ['id'],
      });
    });

    it('should isolate non-existent IDs and throw a detailed exception message if a partial database mismatch occurs', async () => {
      const missingId = randomUUID();
      const inputIds = [mockRoleId1, missingId];
      const databaseRecords = [{ id: mockRoleId1 }]; // DB only contains one of them
      mockRoleRepository.find.mockResolvedValue(databaseRecords);

      await expect(service.checkIfManyExistOrThrow(inputIds)).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate role. The following role ids do not exist: ${missingId}`,
        ),
      );
    });
  });

  describe('getAllPermissions', () => {
    it('should compile query context parameters onto the query builder and unnest unique deduplicated permissions', async () => {
      const targetRoleIds = [mockRoleId1, mockRoleId2];

      // Simulate data structure returning duplicate permissions across different roles to test Set logic
      const mockRoleQueryResults = [
        {
          id: mockRoleId1,
          permissions: [{ code: 'READ_USERS' }, { code: 'WRITE_USERS' }],
        },
        {
          id: mockRoleId2,
          permissions: [
            { code: 'READ_USERS' }, // Duplicate entry
            { code: 'DELETE_USERS' },
          ],
        },
      ];

      mockEntityQueryService.getAll.mockResolvedValue(mockRoleQueryResults);

      const result = await service.getAllPermissions(targetRoleIds);

      // Verify that 'READ_USERS' only surfaces once due to the internal Set array mapping
      expect(result).toEqual(['READ_USERS', 'WRITE_USERS', 'DELETE_USERS']);

      expect(mockRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
        ROLE_QUERY_ALIAS,
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        'permission',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`,
        { roleIds: targetRoleIds },
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        `${ROLE_QUERY_ALIAS}.id`,
        'permission.code',
      ]);
      expect(mockEntityQueryService.getAll).toHaveBeenCalledWith({
        query: mockQueryBuilder,
      });
    });

    it('should return an empty array if the database records contain no underlying nested permission objects', async () => {
      mockEntityQueryService.getAll.mockResolvedValue([
        { id: mockRoleId1, permissions: [] },
      ]);

      const result = await service.getAllPermissions([mockRoleId1]);
      expect(result).toEqual([]);
    });
  });
});
