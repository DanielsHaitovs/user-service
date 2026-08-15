/* eslint-disable @typescript-eslint/no-misused-spread */
import { PermissionHelperService } from '@/permissionServices/helper.service';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { RolePermissionService } from '@/roleServices/permission.service';
import type { User } from '@/userEntities/user.entity';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

describe('RolePermissionService', () => {
  let service: RolePermissionService;

  let mockRoleRepository: {
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };

  let mockPermissionHelper: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  const mockRoleId = randomUUID();
  const mockPermissionId1 = randomUUID();
  const mockPermissionId2 = randomUUID();
  const mockRole: RoleResponseDto = {
    id: mockRoleId,
    name: 'Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: randomUUID() } as User,
    permissions: [],
  };
  const mockPermissions = [
    {
      id: mockPermissionId1,
      code: 'READ_ONLY',
      name: 'abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: mockPermissionId2,
      code: 'WRITE_ALL',
      name: 'abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const mockRoleWithPermissions: RoleResponseDto = {
    ...mockRole,
    permissions: mockPermissions,
  };

  beforeEach(async () => {
    mockRoleRepository = {
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    };

    mockPermissionHelper = {
      checkIfManyExistOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRoleRepository,
        },
        {
          provide: PermissionHelperService,
          useValue: mockPermissionHelper,
        },
      ],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPermissionsOrThrow', () => {
    it('should cleanly fetch and return a role with its relations when it exists', async () => {
      const mockResult = { id: mockRoleId, name: 'Admin', permissions: [] };
      mockRoleRepository.findOneOrFail.mockResolvedValue(mockResult);

      const result = await service.getPermissionsOrThrow(mockRoleId);

      expect(result).toEqual(mockResult);
      expect(mockRoleRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockRoleId },
        relations: ['permissions'],
      });
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should throw an UnprocessableEntityException if the permissionCodes array is empty', async () => {
      await expect(
        service.assignPermissionsToRole({
          assignPayload: {
            permissionCodes: [],
          },
          role: mockRole,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'At least one permission code must be provided to assign permissions to the role.',
        ),
      );
      expect(mockRoleRepository.findOneOrFail).not.toHaveBeenCalled();
    });

    it('should successfully append new permissions to a role without modifying its existing assignments', async () => {
      const newPermissionId = randomUUID();
      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        permissions: mockPermissions,
      });

      mockPermissionHelper.checkIfManyExistOrThrow.mockResolvedValue([
        { id: newPermissionId, code: 'TEST_ALL' },
      ]);

      mockRoleRepository.save.mockResolvedValue({});

      await service.assignPermissionsToRole({
        assignPayload: {
          permissionCodes: ['TEST_ALL'],
        },
        role: mockRoleWithPermissions,
      });

      expect(mockPermissionHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith(
        ['TEST_ALL'],
      );

      expect(mockRoleRepository.save).toHaveBeenCalledWith({
        id: mockRoleId,
        permissions: [
          { id: newPermissionId },
          { id: mockPermissionId1 },
          { id: mockPermissionId2 },
        ],
      });
    });

    // it('should bypass helper validation calls if all incoming permission codes are already assigned to the role', async () => {
    //   mockRoleRepository.findOneOrFail.mockResolvedValue({
    //     id: mockRoleId,
    //     permissions: mockPermissions,
    //   });

    //   mockPermissionHelper.checkIfManyExistOrThrow.mockResolvedValue([
    //     mockPermissionId1,
    //     mockPermissionId2,
    //   ]);

    //   mockRoleRepository.save.mockResolvedValue({});

    //   await service.assignPermissionsToRole({
    //     assignPayload: {
    //       permissionCodes: ['READ_ONLY'],
    //     },
    //     role: mockRoleWithPermissions,
    //   });

    //   expect(
    //     mockPermissionHelper.checkIfManyExistOrThrow,
    //   ).not.toHaveBeenCalled();
    //   expect(mockRoleRepository.save).toHaveBeenCalledWith({
    //     id: mockRoleId,
    //     permissions: [{ id: mockPermissionId1 }, { id: mockPermissionId2 }],
    //   });
    // });
  });

  describe('unassignPermissionsFromRole', () => {
    it('should throw an UnprocessableEntityException if the permissionCodes unassign array is empty', async () => {
      await expect(
        service.unassignPermissionsFromRole({
          unassignPayload: {
            permissionCodes: [],
          },
          role: mockRole,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'At least one permission code must be provided to unassign permissions from the role.',
        ),
      );
    });

    it('should successfully remove specified permission matches and save remaining entries', async () => {
      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        permissions: mockPermissions,
      });

      mockRoleRepository.save.mockResolvedValue({});
      mockRole.permissions = mockPermissions;

      await service.unassignPermissionsFromRole({
        unassignPayload: {
          permissionCodes: ['WRITE_ALL'],
        },
        role: mockRole,
      });

      expect(mockRoleRepository.save).toHaveBeenCalledWith({
        id: mockRoleId,
        permissions: [{ id: mockPermissionId1 }],
      });
    });

    it('should throw an UnprocessableEntityException if none of the incoming unassign codes match active role assignments', async () => {
      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        permissions: [{ id: mockPermissionId1, code: 'READ_ONLY' }],
      });

      await expect(
        service.unassignPermissionsFromRole({
          unassignPayload: {
            permissionCodes: ['DELETE_ALL'],
          },
          role: mockRole,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Some of the provided permission codes are not currently assigned to the role.',
        ),
      );

      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });
  });
});
