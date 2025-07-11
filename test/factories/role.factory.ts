import type { CreateRoleDto, UpdateRoleDto } from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import type { PermissionService } from '@/role/services/permission.service';
import type { RoleService } from '@/role/services/role.service';
import { createPermissions } from '@/test/factories/permission.factory';
import { faker } from '@faker-js/faker/.';

import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createRole(service: RoleService): Promise<Role> {
  const dto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
  };

  const result = await service.create(dto);

  expect(result).toBeDefined();
  expect(result.id).toBeDefined();
  expect(result.name).toBe(dto.name);

  return result;
}

export async function createRoleWithPermissins(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Role> {
  const permissions = await createPermissions(roleService, permissionService);

  const dto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    permissions: permissions.flatMap((permission) => permission.code),
  };

  const role = await roleService.create(dto);

  expect(role).toBeDefined();
  expect(role.id).toBeDefined();
  expect(role.name).toBe(dto.name);

  expect(role.permissions).toHaveLength(2);

  if (role.permissions == undefined) {
    throw new Error(
      'Could not create permissions for role, permissions should exist by now',
    );
  }

  const [firstPermission, secondPermission] = role.permissions;

  if (firstPermission === undefined || secondPermission === undefined) {
    throw new Error('Permissino should be defined');
  }

  expect(role.permissions.some((p) => p.code === firstPermission.code)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.code === secondPermission.code)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.name === firstPermission.name)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.name === secondPermission.name)).toBe(
    true,
  );

  return role;
}

export async function addPermissionsToRole(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Role> {
  const permissions = await createPermissions(roleService, permissionService);

  const role = await createRole(roleService);

  const permissionIds = permissions.flatMap((p) => p.id);

  const updatedRole = await roleService.addPermissionsToRole(
    permissionIds,
    role.id,
  );

  validateRoleWithPermissions(updatedRole, role);

  return updatedRole;
}
export async function findRolesByIds(
  roleService: RoleService,
): Promise<Role[]> {
  const newRole = await createRole(roleService);

  const roles = await roleService.findByIds([newRole.id]);

  expect(roles).toBeDefined();
  expect(roles[0]).toBeDefined();
  expect(roles[0]?.id).toBe(newRole.id);
  expect(roles[0]?.name).toBe(newRole.name);

  return roles;
}

export async function searchForRoles(
  roleService: RoleService,
): Promise<Role[]> {
  return await roleService.searchFor({
    value: faker.lorem.word(),
    pagination: { limit: 10, page: 1 },
    sort: { sortField: 'name', sortOrder: 'ASC' },
  });
}

export async function updateRole(roleService: RoleService): Promise<Role> {
  const role = await createRole(roleService);
  console.log('Role created for update:', role);
  const updateDto: UpdateRoleDto = {
    name: `${role.name}-updated`,
  };

  const updatedRole = await roleService.update(role.id, updateDto);

  console.log('Updated role:', updatedRole);
  expect(updatedRole).toBeDefined();
  expect(updatedRole.id).toBeDefined();
  expect(updatedRole.id).toBe(role.id);
  expect(updatedRole.name).toBe(updateDto.name);

  return updatedRole;
}

export async function deleteRolesByIds(
  roleService: RoleService,
): Promise<void> {
  const role = await createRole(roleService);

  const result = await roleService.deleteByIds([role.id]);

  expect(result).toEqual({ deleted: 1 });

  await expect(roleService.findByIds([role.id])).rejects.toThrow(
    EntityNotFoundError,
  );
}

function validateRoleWithPermissions(
  role: Role,
  dto: CreateRoleDto | Role,
): void {
  expect(role).toBeDefined();
  expect(role.id).toBeDefined();
  expect(role.name).toBe(dto.name);

  expect(role.permissions).toHaveLength(2);

  if (role.permissions == undefined) {
    throw new Error(
      'Could not create permissions for role, permissions should exist by now',
    );
  }

  const [firstPermission, secondPermission] = role.permissions;

  if (firstPermission === undefined || secondPermission === undefined) {
    throw new Error('Permissino should be defined');
  }

  expect(role.permissions.some((p) => p.code === firstPermission.code)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.code === secondPermission.code)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.name === firstPermission.name)).toBe(
    true,
  );
  expect(role.permissions.some((p) => p.name === secondPermission.name)).toBe(
    true,
  );
}
