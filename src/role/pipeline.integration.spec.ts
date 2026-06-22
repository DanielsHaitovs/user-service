/* eslint-disable @typescript-eslint/no-misused-spread */
import { CacheService } from '@/baseServices/cache.service';
import type { Permission } from '@/permissionEntities/permissions.entity';
import { RolePipelineService } from '@/role/role.pipeline';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestPermissions } from '@/test/db/permission';
import { createTestUser } from '@/test/db/user';
import { assignRoleToUser } from '@/test/db/userRole';
import {
  createTestRole,
  createTestRoleWithPermissions,
  getTestRoleById,
  getTestRoleWithPermissionsById,
} from '@/test/pipeline/role';
import {
  validateRoleResponseDto,
  validateRoleWithPermissionsResponseDto,
} from '@/test/validate/role';
import type { GetCreatedByDto } from '@/userDto/user.dto';
import type { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('RolePipelineService (Integration)', () => {
  let pipelineService: RolePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let permissions: Permission[];

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService =
      moduleFixture.get<RolePipelineService>(RolePipelineService);
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheInvalidateByIdSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateById',
    );
    cacheInvalidateByTagsSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateByTags',
    );
    permissions = await createTestPermissions({
      dataSource,
      permissions: [
        {
          createdBy: { id: systemUserId } as User,
        },
        {
          createdBy: { id: systemUserId } as User,
        },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Should create role -> RolePipelineService -> getPermissionsOrThrow()', () => {
    it('should create role without permissions', async () => {
      const createdRole = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
        },
        createdById: systemUserId,
      });

      await getTestRoleById({
        pipelineService,
        id: createdRole.id,
        name: createdRole.name,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should create role with permissions', async () => {
      const expected = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
          permissions: permissions.map((p) => p.code),
        },
        createdById: systemUserId,
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw Conflifct when trying to save role with the same name', async () => {
      const roleName = `Test Role ${randomUUID()}`;
      await pipelineService.create({
        createDto: {
          name: roleName,
        },
        createdById: systemUserId,
      });

      await expect(
        pipelineService.create({
          createDto: {
            name: roleName,
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `A role with the name "${roleName}" already exists.`,
        ),
      );
    });

    it('should not assign all permissions if empty permission property is present as empty array', async () => {
      const expected = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
          permissions: [],
        },
        createdById: systemUserId,
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw UnprocessableEntityException when trying to save role with non-existing permission codes', async () => {
      await expect(
        pipelineService.create({
          createDto: {
            name: `Test Role ${randomUUID()}`,
            permissions: [
              'NON_EXISTING_PERMISSION_CODE_1',
              'NON_EXISTING_PERMISSION_CODE_2',
            ],
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'The following permission codes do not exist: NON_EXISTING_PERMISSION_CODE_1, NON_EXISTING_PERMISSION_CODE_2',
        ),
      );
    });
  });

  describe('Should retrieve role without permissions -> RolePipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test role by its ID', async () => {
      const expected = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      validateRoleResponseDto({
        response: await pipelineService.getByIdOrThrow(expected.id),
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing role', async () => {
      await expect(
        pipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Should retrieve role with permissions -> RolePipelineService -> getPermissionsOrThrow()', () => {
    it('should retrieve the test role by its ID with its permissions', async () => {
      const expected = await createTestRoleWithPermissions({
        pipelineService,
        permissions,
        createdById: systemUserId,
      });

      validateRoleWithPermissionsResponseDto({
        response: await pipelineService.getPermissionsOrThrow(expected.id),
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing role', async () => {
      await expect(
        pipelineService.getPermissionsOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);
    });
  });

  describe('Should assign permissions to role -> RolePipelineService -> assignPermissionsToRole()', () => {
    it('should assign permissions to the test role with 0 permissions', async () => {
      const expected = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      await pipelineService.assignPermissionsToRole({
        roleId: expected.id,
        permissionCodes: permissions.map((p) => p.code),
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected: {
          ...expected,
          permissions,
        },
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should assign permissions to the test role with 2 existing permissions', async () => {
      const { permissions: existingPermissions, ...role } =
        await createTestRoleWithPermissions({
          pipelineService,
          permissions,
          createdById: systemUserId,
        });

      const permissionsToAssign = await createTestPermissions({
        dataSource,
        permissions: [
          { createdBy: { id: systemUserId } as User },
          { createdBy: { id: systemUserId } as User },
        ],
      });

      await pipelineService.assignPermissionsToRole({
        roleId: role.id,
        permissionCodes: permissionsToAssign.map((p) => p.code),
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: role.id,
        expected: {
          name: role.name,
          createdBy: { id: systemUserId } as GetCreatedByDto,
          permissions: [...existingPermissions, ...permissionsToAssign],
        },
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(4);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw UnprocessableEntityException when trying to assign non-existing permission codes', async () => {
      const expected = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
      });

      const invalidPermissionCode = randomUUID();

      await expect(
        pipelineService.assignPermissionsToRole({
          roleId: expected.id,
          permissionCodes: [invalidPermissionCode],
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `The following permission codes do not exist: ${invalidPermissionCode}`,
        ),
      );

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw not found exception when trying to assign permissions to a non-existing role', async () => {
      const random = randomUUID();

      await expect(
        pipelineService.assignPermissionsToRole({
          roleId: random,
          permissionCodes: [random],
        }),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw UnprocessableEntityException when trying to assign permissions with an empty permissionCodes array', async () => {
      const random = randomUUID();

      await expect(
        pipelineService.assignPermissionsToRole({
          roleId: random,
          permissionCodes: [],
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'At least one permission code must be provided to assign permissions to the role.',
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should unassign permissions from role -> RolePipelineService -> unassignPermissionsFromRole()', () => {
    it('should unassign permissions from the test role with 0 permissions', async () => {
      const expected = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      await pipelineService.unassignPermissionsFromRole({
        roleId: expected.id,
        permissionCodes: permissions.map((p) => p.code),
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should unassign 2 permissions from the test role with 4 existing permissions', async () => {
      const { permissions: existingPermissions, ...role } =
        await createTestRoleWithPermissions({
          pipelineService,
          createdById: systemUserId,
          permissions: [
            ...permissions,
            ...(await createTestPermissions({
              dataSource,
              permissions: [
                { createdBy: { id: systemUserId } as User },
                { createdBy: { id: systemUserId } as User },
              ],
            })),
          ],
        });

      const permissionsToUnassign = [...existingPermissions.slice(0, 2)];
      const permissionsToKeep = [...existingPermissions.slice(2)];

      await pipelineService.unassignPermissionsFromRole({
        roleId: role.id,
        permissionCodes: permissionsToUnassign.map((p) => p.code),
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: role.id,
        expected: {
          name: role.name,
          createdBy: { id: systemUserId } as GetCreatedByDto,
          permissions: permissionsToKeep,
        },
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(4);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw UnprocessableEntityException when trying to unassign non-existing permission codes', async () => {
      const expected = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
        permissions,
      });

      const invalidPermissionCode = randomUUID();

      await expect(
        pipelineService.unassignPermissionsFromRole({
          roleId: expected.id,
          permissionCodes: [invalidPermissionCode],
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Some of the provided permission codes are not currently assigned to the role.`,
        ),
      );

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw UnprocessableEntityException when trying to unassign existing permission codes that are not currently assigned to the role', async () => {
      const expected = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
      });

      await pipelineService.unassignPermissionsFromRole({
        roleId: expected.id,
        permissionCodes: permissions.map((p) => p.code),
      });

      await getTestRoleWithPermissionsById({
        pipelineService,
        id: expected.id,
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw not found exception when trying to unassign permissions from a non-existing role', async () => {
      const random = randomUUID();

      await expect(
        pipelineService.unassignPermissionsFromRole({
          roleId: random,
          permissionCodes: [random],
        }),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw UnprocessableEntityException when trying to unassign permissions with an empty permissionCodes array', async () => {
      const random = randomUUID();

      await expect(
        pipelineService.unassignPermissionsFromRole({
          roleId: random,
          permissionCodes: [],
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'At least one permission code must be provided to unassign permissions from the role.',
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should update role -> RolePipelineService -> update()', () => {
    it('should update role name with a new unique name', async () => {
      const role = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      const newName = `Updated Role ${randomUUID()}`;

      if (role.name === newName) {
        throw new Error(
          'The new role name is the same as the existing role name. This indicates a test setup issue.',
        );
      }

      const updated = await pipelineService.update({
        id: role.id,
        updateDto: {
          name: newName,
        },
      });

      expect(updated).toBeDefined();
      expect(updated).toBe(true);

      await getTestRoleById({
        pipelineService,
        id: role.id,
        name: newName,
      });
    });

    it('should return true when attempting to update with the same name', async () => {
      const { id, name } = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      const updated = await pipelineService.update({
        id,
        updateDto: {
          name,
        },
      });

      expect(updated).toBeDefined();
      expect(updated).toBe(true);

      await getTestRoleById({
        pipelineService,
        id,
        name,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw UnprocessableEntityException when attempting to update with name that is already taken by another role', async () => {
      const { id, name } = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });
      const conflictRole = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      await expect(
        pipelineService.update({
          id,
          updateDto: {
            name: conflictRole.name,
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `A role with the name "${conflictRole.name}" already exists.`,
        ),
      );

      await getTestRoleById({
        pipelineService,
        id,
        name,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(4);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw NotFoundException when trying to update a non-existing role', async () => {
      await expect(
        pipelineService.update({
          id: randomUUID(),
          updateDto: {
            name: 'any role name',
          },
        }),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should return false when trying to update with an empty updateDto', async () => {
      const updated = await pipelineService.update({
        id: randomUUID(),
        updateDto: {},
      });

      expect(updated).toBeDefined();
      expect(updated).toBe(false);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should delete role -> RolePipelineService -> delete()', () => {
    it('should delete the test role with 0 permissions with canDeleteAssignedRole set to true', async () => {
      const role = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      const deleted = await pipelineService.delete({
        id: role.id,
        canDeleteAssignedRole: true,
      });

      expect(deleted).toBe(true);

      await expect(pipelineService.getByIdOrThrow(role.id)).rejects.toThrow(
        /Could not find any entity of type "Roles"/,
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
    });

    it('should delete the test role with 0 permissions with canDeleteAssignedRole set to false', async () => {
      const role = await createTestRole({
        pipelineService,
        createdById: systemUserId,
      });

      const deleted = await pipelineService.delete({
        id: role.id,
        canDeleteAssignedRole: false,
      });

      expect(deleted).toBe(true);

      await expect(pipelineService.getByIdOrThrow(role.id)).rejects.toThrow(
        /Could not find any entity of type "Roles"/,
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
    });

    it('should delete the test role with 2 permissions with canDeleteAssignedRole set to true', async () => {
      const role = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
        permissions,
      });

      const deleted = await pipelineService.delete({
        id: role.id,
        canDeleteAssignedRole: true,
      });

      expect(deleted).toBe(true);

      await expect(pipelineService.getByIdOrThrow(role.id)).rejects.toThrow(
        /Could not find any entity of type "Roles"/,
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
    });

    it('should delete the test role with 2 permissions with canDeleteAssignedRole set to false', async () => {
      const role = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
        permissions,
      });

      const deleted = await pipelineService.delete({
        id: role.id,
        canDeleteAssignedRole: false,
      });

      expect(deleted).toBe(true);

      await expect(pipelineService.getByIdOrThrow(role.id)).rejects.toThrow(
        /Could not find any entity of type "Roles"/,
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
    });

    it('should not delete the test role with 2 permissions that is assigned to a user with canDeleteAssignedRole set to false', async () => {
      const role = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
        permissions,
      });
      const user = await createTestUser(dataSource);

      await assignRoleToUser({
        dataSource,
        userId: user.id,
        roleId: role.id,
      });

      await expect(
        pipelineService.delete({
          id: role.id,
          canDeleteAssignedRole: false,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });

    it('should delete the test role with 2 permissions that is assigned to a user with canDeleteAssignedRole set to true', async () => {
      const role = await createTestRoleWithPermissions({
        pipelineService,
        createdById: systemUserId,
        permissions,
      });

      const user = await createTestUser(dataSource);

      await assignRoleToUser({
        dataSource,
        userId: user.id,
        roleId: role.id,
      });

      const deleted = await pipelineService.delete({
        id: role.id,
        canDeleteAssignedRole: true,
      });

      expect(deleted).toBe(true);

      await expect(pipelineService.getByIdOrThrow(role.id)).rejects.toThrow(
        /Could not find any entity of type "Roles"/,
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
    });
  });
});
