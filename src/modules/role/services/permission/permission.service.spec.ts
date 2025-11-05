import type {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { PermissionService } from '@/role/services/permission/permission.service';
import { RoleService } from '@/role/services/role/role.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  createPermissions,
  deletePermissionsByIds,
  findPermissionsByCodes,
  findPermissionsByIds,
  searchForPermission,
  updatePermissions,
} from '@/test/factories/permission.factory';
import { ConflictException, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('PermissionService (Integration - PostgreSQL)', () => {
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

  describe('create()', () => {
    it('should create and persist permissions with permission to access user', async () => {
      await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });
    });

    it('should create and persist permissions without user Permission', async () => {
      await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: false,
      });
    });

    it('should throw Conflict error beacuse at least 1 name of permissions already exists', async () => {
      const permissions = await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });

      const conflictpermissions = new Array<CreatePermissionDto>();

      permissions.forEach((permission) => {
        if (permission.roles[0] === undefined) {
          throw new Error('Permission should have a role');
        }
        conflictpermissions.push({
          name: permission.name,
          code: `${permission.code}-1`,
          roleIds: [permission.roles[0].id],
        });
      });

      await expect(
        permissionService.create({
          permissions: conflictpermissions,
          createdBy: systemUserId,
          hasAccessToCreatedBy: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw Conflict error beacuse at least 1 code of permissions already exists', async () => {
      const permissions = await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });

      const conflictpermissions = new Array<CreatePermissionDto>();

      permissions.forEach((permission) => {
        if (permission.roles[0] === undefined) {
          throw new Error('Permission should have a role');
        }
        conflictpermissions.push({
          name: `${permission.name}-1`,
          code: permission.code,
          roleIds: [permission.roles[0].id],
        });
      });

      await expect(
        permissionService.create({
          permissions: conflictpermissions,
          createdBy: systemUserId,
          hasAccessToCreatedBy: true,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByIds()', () => {
    it('should find permissions by uuids with access to user and role', async () => {
      await findPermissionsByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
        hasAccessToRole: true,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should find permissions by uuids with access to role', async () => {
      await findPermissionsByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: false,
        hasAccessToRole: true,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should find permissions by uuids without access to user', async () => {
      await findPermissionsByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
        hasAccessToRole: false,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should throw not found exception, because permission id(s) does not exist', async () => {
      await expect(
        permissionService.findByIds({
          ids: [uuid() as UUID],
          hasAccessToCreatedBy: true,
          hasAccessToRole: true,
          pagination: { page: 1, limit: 10 },
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('searchFor()', () => {
    it('should find permissions by value', async () => {
      await searchForPermission({
        roleService,
        permissionService,
        createdBy: systemUserId,
        pagination: { page: 1, limit: 10 },
      });
    });
  });

  describe('findByCodes()', () => {
    it('should find permissions by codes with access to users and role', async () => {
      await findPermissionsByCodes({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
        hasAccessToRole: true,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should find permissions by codes with users', async () => {
      await findPermissionsByCodes({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
        hasAccessToRole: false,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should find permissions by codes with access to role', async () => {
      await findPermissionsByCodes({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: false,
        hasAccessToRole: true,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should throw not found exception, because permission code(s) does not exist', async () => {
      await expect(
        permissionService.findByCodes({
          codes: ['non-existing-code'],
          hasAccessToCreatedBy: true,
          hasAccessToRole: true,
          pagination: { page: 1, limit: 10 },
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('update()', () => {
    it('should update and persist permissions', async () => {
      await updatePermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
      });
    });

    it('should throw Conflict error beacuse name of permissions already exists', async () => {
      const permissions = await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        name: secondPermission.name,
      };

      await expect(
        permissionService.update({
          id: firstPermission.id,
          updatePermissionDto: faulsyPermissionDto,
        }),
      ).rejects.toThrow(ConflictException);
    });
    it('should throw Conflict error beacuse code of permissions already exists', async () => {
      const permissions = await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        code: secondPermission.code,
      };

      await expect(
        permissionService.update({
          id: firstPermission.id,
          updatePermissionDto: faulsyPermissionDto,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw Conflict error beacuse at least code or name of permissions already exists', async () => {
      const permissions = await createPermissions({
        roleService,
        permissionService,
        createdBy: systemUserId,
        hasAccessToCreatedBy: true,
      });

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        name: secondPermission.name,
        code: secondPermission.code,
      };

      await expect(
        permissionService.update({
          id: firstPermission.id,
          updatePermissionDto: faulsyPermissionDto,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteIds()', () => {
    it('should delete permissions by uuids', async () => {
      await deletePermissionsByIds({
        roleService,
        permissionService,
        createdBy: systemUserId,
      });
    });

    it('should throw not found exception, because permission id(s) does not exist', async () => {
      await expect(
        permissionService.deleteByIds([uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
