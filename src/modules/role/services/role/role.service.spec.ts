import { PermissionService } from '@/role/services/permission/permission.service';
import { RoleService } from '@/role/services/role/role.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  addPermissionsToRole,
  createRole,
  createRoleWithPermissions,
  deleteRolesByIds,
  findRolesByIds,
  findRolesCreatedByUserWithId,
  searchForRoles,
  updateRole,
} from '@/test/factories/role.factory';
import { ConflictException, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('RoleService (Integration - PostgreSQL)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let systemUserId: UUID;

  beforeAll(async () => {
    ({ moduleFixture: module, app } = await bootstrapTestApp());

    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);
    systemUserId = await getSystemUserId(app);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create Role()', () => {
    it('should create and persist role with access to user and permissions', async () => {
      await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: true,
      });
    });
    it('should create and persist role with access to user', async () => {
      await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: false,
      });
    });
    it('should create and persist role with access to permissions', async () => {
      await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: true,
      });
    });
    it('should create and persist role without access to user and permissions', async () => {
      await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: false,
      });
    });
  });

  describe('create Role with permission()', () => {
    it('should create and persist role with access to user and permissions', async () => {
      await createRoleWithPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: true,
      });
    });
    it('should create and persist role with access to user', async () => {
      await createRoleWithPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: false,
      });
    });
    it('should create and persist role with access to permissions', async () => {
      await createRoleWithPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: true,
      });
    });
    it('should create and persist role without access to user and permissions', async () => {
      await createRoleWithPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: false,
      });
    });
  });

  describe('Assign Permissions to role()', () => {
    it('should create and persist role without access to user and permissions', async () => {
      await addPermissionsToRole({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: false,
      });
    });

    it('should create and persist role with access to user', async () => {
      await addPermissionsToRole({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: false,
      });
    });

    it('should create and persist role with access to permissions', async () => {
      await addPermissionsToRole({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: true,
      });
    });

    it('should create and persist role with access to user and permissions', async () => {
      await addPermissionsToRole({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: true,
      });
    });
  });

  describe('Find Roles by ids()', () => {
    it('should get role with access to user and permissions', async () => {
      await findRolesByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: true,
      });
    });

    it('should get role with access to user', async () => {
      await findRolesByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: true,
        hasAccessToPermissions: false,
      });
    });

    it('should get role with access to permissions', async () => {
      await findRolesByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToUser: false,
        hasAccessToPermissions: true,
      });
    });

    it('should throw EntityNotFound Exception because roles with ids does not exist role with access to user and permissions', async () => {
      await expect(
        roleService.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: true,
          hasAccessToPermissions: true,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw EntityNotFound Exception because roles with ids does not exist role with access to user', async () => {
      await expect(
        roleService.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: true,
          hasAccessToPermissions: false,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw EntityNotFound Exception because roles with ids does not exist role with access to permissions', async () => {
      await expect(
        roleService.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: false,
          hasAccessToPermissions: true,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw EntityNotFound Exception because roles with ids does not exist role without access to user and permissions', async () => {
      await expect(
        roleService.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: false,
          hasAccessToPermissions: false,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('Find Roles by created by userids()', () => {
    it('should get role by created by user id with access to user and permissions', async () => {
      await findRolesCreatedByUserWithId({
        roleService,
        permissionService,
        createdBy: systemUserId,
        // createdBy: userIdWhoOnlyCreated1Role, Uncomment once user entity will be created
        hasAccessToPermissions: true,
      });
    });

    it('should get role by created by user id  access to user', async () => {
      await findRolesCreatedByUserWithId({
        roleService,
        permissionService,
        createdBy: systemUserId,
        // createdBy: userIdWhoOnlyCreated1Role, Uncomment once user entity will be created
        hasAccessToPermissions: false,
      });
    });

    it('should get role by created by user id  access to permissions', async () => {
      await findRolesCreatedByUserWithId({
        roleService,
        permissionService,
        createdBy: systemUserId,
        // createdBy: userIdWhoOnlyCreated1Role, Uncomment once user entity will be created
        hasAccessToPermissions: true,
      });
    });

    it('should throw EntityNotFound Exception because roles with created by user ids does not exist role with access to permissions', async () => {
      await expect(
        roleService.findCreatedByUserWithId({
          createdByUserIds: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToPermissions: true,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw EntityNotFound Exception because roles with created by user ids does not exist role without access to permissions', async () => {
      await expect(
        roleService.findCreatedByUserWithId({
          createdByUserIds: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToPermissions: false,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('Search Roles by value()', () => {
    it('should search for role by value', async () => {
      await searchForRoles({
        roleService,
        createdBy: systemUserId,
      });
    });

    it('should not throw EntityNotFound Exception because roles with provided value does not exist role without access to user and permissions', async () => {
      const searchResult = await roleService.searchFor({
        value: '****',
        pagination: { page: 1, limit: 1 },
        order: { sortOrder: 'ASC', sortField: 'name' },
      });

      if (searchResult.roles.length > 0 || searchResult.total > 0) {
        throw new Error(
          'Expected no roles to be found, but some roles were returned',
        );
      }
    });
  });

  describe('Update Roles()', () => {
    it('Update Role Name', async () => {
      await updateRole({
        roleService,
        createdBy: systemUserId,
      });
    });
    it('Should thow Conflict Exception, because can not update role with name that already exist', async () => {
      const role = await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToPermissions: false,
        hasAccessToUser: false,
      });

      const anotherRole = await createRole({
        roleService,
        createdBy: systemUserId,
        hasAccessToPermissions: false,
        hasAccessToUser: false,
      });

      await expect(
        roleService.update({
          id: role.id,
          role: {
            name: anotherRole.name,
          },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Delete Roles()', () => {
    it('Delete Role Name', async () => {
      await deleteRolesByIds({
        roleService,
        createdBy: systemUserId,
      });
    });

    it('Should thow EntityNotFound Exception, because role with ids does not exist', async () => {
      await expect(roleService.deleteByIds([uuid() as UUID])).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
});
