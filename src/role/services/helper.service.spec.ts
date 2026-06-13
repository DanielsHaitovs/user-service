import { EntityQueryService } from '@/baseServices/query.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { Roles } from '@/roleEntities/role.entity';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID, type UUID } from 'crypto';
import { In } from 'typeorm';

import { RoleHelperService } from './helper.service';

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

  const mockId1 = randomUUID();
  const mockId2 = randomUUID();

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
    it('should resolve perfectly with an array of UUIDs if all provided IDs match database records', async () => {
      const inputIds = [mockId1, mockId2];
      mockRoleRepository.find.mockResolvedValue([
        { id: mockId1 },
        { id: mockId2 },
      ]);

      const result = await service.checkIfManyExistOrThrow(inputIds);

      expect(result).toEqual([mockId1, mockId2]);

      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        where: { id: In(inputIds) },
        select: ['id'],
      });
    });

    it('should throw an UnprocessableEntityException if the input argument array is completely missing or undefined', async () => {
      await expect(service.checkIfManyExistOrThrow()).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );
      expect(mockRoleRepository.find).not.toHaveBeenCalled();
    });

    it('should throw an UnprocessableEntityException if the input array is empty', async () => {
      await expect(service.checkIfManyExistOrThrow([])).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );
    });

    it('should throw an UnprocessableEntityException identifying exactly which IDs are missing if a mismatch occurs', async () => {
      const inputIds = [mockId1, mockId2];
      mockRoleRepository.find.mockResolvedValue([{ id: mockId1 }]);

      await expect(service.checkIfManyExistOrThrow(inputIds)).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to create role. The following role ids do not exist: ${mockId2}`,
        ),
      );
    });
  });

  describe('getAllPermissions', () => {
    it('should compile, extract, and return an array of unique permission codes without duplicates', async () => {
      const inputRoleIds = [mockId1, mockId2] as UUID[];

      const mockDatabaseRoles = [
        {
          id: mockId1,
          permissions: [{ code: 'READ_USER' }, { code: 'WRITE_USER' }],
        },
        {
          id: mockId2,
          permissions: [{ code: 'READ_USER' }, { code: 'DELETE_USER' }],
        },
      ];

      mockEntityQueryService.getAll.mockResolvedValue(mockDatabaseRoles);

      const result = await service.getAllPermissions(inputRoleIds);

      expect(result).toEqual(['READ_USER', 'WRITE_USER', 'DELETE_USER']);

      expect(mockRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
        ROLE_QUERY_ALIAS,
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        'permission',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`,
        { roleIds: inputRoleIds },
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        `${ROLE_QUERY_ALIAS}.id`,
        'permission.code',
      ]);
      expect(mockEntityQueryService.getAll).toHaveBeenCalledWith({
        query: mockQueryBuilder,
        cache: true,
      });
    });

    it('should cleanly return an empty array if the downstream search locator matches zero active records', async () => {
      mockEntityQueryService.getAll.mockResolvedValue([]);

      const result = await service.getAllPermissions([mockId1] as UUID[]);

      expect(result).toEqual([]);
    });
  });
});
