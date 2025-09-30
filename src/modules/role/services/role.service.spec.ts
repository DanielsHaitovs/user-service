import type { CreateRoleDto, UpdateRoleDto } from '@/role/dto/role.dto';
import { PermissionService } from '@/role/services/permission.service';
import { RoleService } from '@/role/services/role.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  addPermissionsToRole,
  createRole,
  createRoleWithPermissins,
  deleteRolesByIds,
  findRolesByIds,
  searchForRoles,
  updateRole,
} from '@/test/factories/role.factory';
import { faker } from '@faker-js/faker/.';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('RoleService (Integration - PostgreSQL)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let roleService: RoleService;
  let permissionService: PermissionService;
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
    it('should create and persist a role without permissions', async () => {
      await createRole(roleService, systemUserId);
    });

    it('should create and persist a role with permissions', async () => {
      await createRoleWithPermissins(
        roleService,
        permissionService,
        systemUserId,
      );
    });

    it('should throw error because permissions are not found', async () => {
      const roleDto: CreateRoleDto = {
        name: `${faker.lorem.word()}-${uuid()}`,
        permissions: [faker.lorem.word()],
      };

      await expect(
        roleService.create({ roleDto, createdBy: systemUserId }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('findByIds()', () => {
    it('should find roles by uuids', async () => {
      await findRolesByIds(roleService, systemUserId);
    });

    it('should throw not found exception, because roles id(s) does not exist', async () => {
      await expect(
        roleService.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 10 },
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('searchFor()', () => {
    it('should find roles by value', async () => {
      await searchForRoles(roleService, systemUserId);
    });
  });

  describe('update()', () => {
    it('should update role name by uuid', async () => {
      await updateRole(roleService, systemUserId);
    });

    it('should throw not found exception, can not update role because id that does not exist', async () => {
      const updateDto: UpdateRoleDto = {
        name: faker.lorem.word(),
      };

      await expect(
        roleService.update({ id: uuid() as UUID, role: updateDto }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw conflict exception, can not update role with name that already exists', async () => {
      const role = await createRole(roleService, systemUserId);
      const anotherRole = await createRole(roleService, systemUserId);

      const updateDto: UpdateRoleDto = {
        name: role.name,
      };

      await expect(
        roleService.update({ id: anotherRole.id, role: updateDto }),
      ).rejects.toThrow('Role with name');
    });
  });

  describe('assignPermissionsToTOle()', () => {
    it('should assign permissions to role', async () => {
      await addPermissionsToRole(roleService, permissionService, systemUserId);
    });

    it('should throw not found exception, can not assign permissions to role which id that does not exist', async () => {
      const permissionIds = [uuid() as UUID, uuid() as UUID];
      const roleId = uuid() as UUID;

      await expect(
        roleService.addPermissionsToRole({ permissionIds, roleId }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw not found exception, can not assign permissions to role where permissions codes does not exist', async () => {
      const role = await createRole(roleService, systemUserId);

      const permissionIds = [uuid() as UUID, uuid() as UUID];

      await expect(
        roleService.addPermissionsToRole({ permissionIds, roleId: role.id }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('deleteByIds()', () => {
    it('should delete roles by uuids', async () => {
      await deleteRolesByIds(roleService, systemUserId);
    });

    it('should throw not found exception, because role id does not exist', async () => {
      await expect(
        roleService.deleteByIds([
          uuid() as UUID,
          uuid() as UUID,
          uuid() as UUID,
        ]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
