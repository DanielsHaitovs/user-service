import type { CreateRoleDto, UpdateRoleDto } from '@/role/dto/role.dto';
import { PermissionService } from '@/role/services/permission.service';
import { RoleService } from '@/role/services/role.service';
import { createTestModule } from '@/test/db.connection';
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
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('RoleService (Integration - PostgreSQL)', () => {
  let module: TestingModule;
  let roleService: RoleService;
  let permissionService: PermissionService;

  beforeAll(async () => {
    const { module: testingModule } = await createTestModule();
    module = testingModule;
    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  afterAll(async () => {
    await module.close(); // ✅ this ensures clean shutdown
  });

  describe('create()', () => {
    it('should create and persist a role without permissions', async () => {
      await createRole(roleService);
    });

    it('should create and persist a role with permissions', async () => {
      await createRoleWithPermissins(roleService, permissionService);
    });

    it('should throw error because permissions are not found', async () => {
      const dto: CreateRoleDto = {
        name: `${faker.lorem.word()}-${uuid()}`,
        permissions: [faker.lorem.word()],
      };

      await expect(roleService.create(dto)).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });

  describe('findByIds()', () => {
    it('should find roles by uuids', async () => {
      await findRolesByIds(roleService);
    });

    it('should throw not found exception, because roles id(s) does not exist', async () => {
      await expect(roleService.findByIds([uuid() as UUID])).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });

  describe('searchFor()', () => {
    it('should find roles by value', async () => {
      await searchForRoles(roleService);
    });
  });

  describe('update()', () => {
    it('should update role name by uuid', async () => {
      await updateRole(roleService);
    });

    it('should throw not found exception, can not update role for id that does not exist', async () => {
      const updateDto: UpdateRoleDto = {
        name: faker.lorem.word(),
      };

      await expect(
        roleService.update(uuid() as UUID, updateDto),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw conflict exception, can not update role with name that already exists', async () => {
      const role = await createRole(roleService);
      const anotherRole = await createRole(roleService);

      const updateDto: UpdateRoleDto = {
        name: role.name,
      };

      await expect(
        roleService.update(anotherRole.id, updateDto),
      ).rejects.toThrow('Role with name');
    });
  });

  describe('assignPermissionsToTOle()', () => {
    it('should assign permissions to role', async () => {
      await addPermissionsToRole(roleService, permissionService);
    });

    it('should throw not found exception, can not assign permissions to role which id that does not exist', async () => {
      const permissionIds = [uuid() as UUID, uuid() as UUID];
      const roleId = uuid() as UUID;

      await expect(
        roleService.addPermissionsToRole(permissionIds, roleId),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('should throw not found exception, can not assign permissions to role where permissions codes does not exist', async () => {
      const role = await createRole(roleService);

      const permissionIds = [uuid() as UUID, uuid() as UUID];

      await expect(
        roleService.addPermissionsToRole(permissionIds, role.id),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('deleteByIds()', () => {
    it('should delete roles by uuids', async () => {
      await deleteRolesByIds(roleService);
    });

    it('should throw not found exception, because role id does not exist', async () => {
      await expect(
        roleService.findByIds([uuid() as UUID, uuid() as UUID, uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
