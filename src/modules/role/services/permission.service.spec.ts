import type {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { PermissionService } from '@/role/services/permission.service';
import { RoleService } from '@/role/services/role.service';
import { createTestModule } from '@/test/db.connection';
import {
  createPermissions,
  deletePermissionsByIds,
  findPermissionsByCodes,
  findPermissionsByIds,
  updatePermissions,
} from '@/test/factories/permission.factory';
import { faker } from '@faker-js/faker/.';
import { ConflictException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('PermissionService (Integration - PostgreSQL)', () => {
  let module: TestingModule;
  let permissionService: PermissionService;
  let roleService: RoleService;

  beforeAll(async () => {
    const { module: testingModule } = await createTestModule();
    module = testingModule;
    permissionService = module.get<PermissionService>(PermissionService);
    roleService = module.get<RoleService>(RoleService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create()', () => {
    it('should create and persist permissions', async () => {
      await createPermissions(roleService, permissionService);
    });

    it('should should throw Conflict error beacuse at least 1 name of permissions already exists', async () => {
      const permissions = await createPermissions(
        roleService,
        permissionService,
      );

      const conflictPermissinos = new Array<CreatePermissionDto>();

      permissions.forEach((permission) => {
        conflictPermissinos.push({
          name: permission.name,
          code: `${permission.code}-1`,
          roleId: permission.role.id,
        });
      });

      await expect(
        permissionService.create(conflictPermissinos),
      ).rejects.toThrow(ConflictException);
    });

    it('should should throw Conflict error beacuse at least 1 code of permissions already exists', async () => {
      const permissions = await createPermissions(
        roleService,
        permissionService,
      );

      const conflictPermissinos = new Array<CreatePermissionDto>();

      permissions.forEach((permission) => {
        conflictPermissinos.push({
          name: `${permission.name}-1`,
          code: permission.code,
          roleId: permission.role.id,
        });
      });

      await expect(
        permissionService.create(conflictPermissinos),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByIds()', () => {
    it('should find permissions by uuids', async () => {
      await findPermissionsByIds(roleService, permissionService);
    });

    it('should throw not found exception, because permission id(s) does not exist', async () => {
      await expect(
        permissionService.findByIds([uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
  describe('searchFor()', () => {
    it('should find permissions by value', async () => {
      await findPermissionsByIds(roleService, permissionService);
    });
  });

  describe('findByCodes()', () => {
    it('should find permissions by codes', async () => {
      await findPermissionsByCodes(roleService, permissionService);
    });

    it('should throw not found exception, because permission code(s) does not exist', async () => {
      await expect(
        permissionService.findByCodes([
          faker.string.alpha(8),
          faker.string.alpha(8),
        ]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('update()', () => {
    it('should update and persist permissions', async () => {
      await updatePermissions(roleService, permissionService);
    });

    it('should should throw Conflict error beacuse name of permissions already exists', async () => {
      const permissions = await createPermissions(
        roleService,
        permissionService,
      );

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        name: secondPermission.name,
      };

      await expect(
        permissionService.update(firstPermission.id, faulsyPermissionDto),
      ).rejects.toThrow(ConflictException);
    });
    it('should should throw Conflict error beacuse code of permissions already exists', async () => {
      const permissions = await createPermissions(
        roleService,
        permissionService,
      );

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        code: secondPermission.code,
      };

      await expect(
        permissionService.update(firstPermission.id, faulsyPermissionDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should should throw Conflict error beacuse at least code or name of permissions already exists', async () => {
      const permissions = await createPermissions(
        roleService,
        permissionService,
      );

      const [firstPermission, secondPermission] = permissions;

      if (firstPermission === undefined || secondPermission === undefined) {
        throw new Error('Permissino should be defined');
      }

      const faulsyPermissionDto: UpdatePermissionDto = {
        name: secondPermission.name,
        code: secondPermission.code,
      };

      await expect(
        permissionService.update(firstPermission.id, faulsyPermissionDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteIds()', () => {
    it('should delete permissions by uuids', async () => {
      await deletePermissionsByIds(roleService, permissionService);
    });

    it('should throw not found exception, because permission id(s) does not exist', async () => {
      await expect(
        permissionService.deleteByIds([uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
