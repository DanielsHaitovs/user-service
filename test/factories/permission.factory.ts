import type {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { Permission } from '@/role/entities/permissions.entity';
import type { PermissionService } from '@/role/services/permission.service';
import type { RoleService } from '@/role/services/role.service';
import { createRole } from '@/test/factories/role.factory';
import { faker } from '@faker-js/faker/.';

import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createPermissions(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Permission[]> {
  const role = await createRole(roleService);

  const permissionDto: CreatePermissionDto[] = [
    {
      name: `${faker.lorem.word()}-${role.id}`,
      code: `${faker.string.alpha(8)}-${role.id}`,
      roleId: role.id,
    },
    {
      name: `${faker.lorem.word()}-${role.id}`,
      code: `${faker.string.alpha(8)}-${role.id}`,
      roleId: role.id,
    },
  ];

  const permissions = await permissionService.create(permissionDto);

  expect(permissions).toBeDefined();
  expect(Array.isArray(permissions)).toBe(true);
  expect(permissions).toHaveLength(2);

  validatePermissionsArray(permissions, permissionDto);

  return permissions;
}

export async function findPermissionsByIds(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Permission[]> {
  const newPermissions = await createPermissions(
    roleService,
    permissionService,
  );

  const permissions = await permissionService.findByIds(
    newPermissions.flatMap((permission) => permission.id),
  );

  expect(permissions).toBeDefined();
  expect(Array.isArray(permissions)).toBe(true);
  expect(permissions).toHaveLength(2);

  validatePermissionsArray(permissions, newPermissions);

  return permissions;
}

export async function findPermissionsByCodes(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Permission[]> {
  const newPermissions = await createPermissions(
    roleService,
    permissionService,
  );

  const permissions = await permissionService.findByCodes(
    newPermissions.flatMap((permission) => permission.code),
  );

  expect(permissions).toBeDefined();
  expect(Array.isArray(permissions)).toBe(true);
  expect(permissions).toHaveLength(2);

  validatePermissionsArray(permissions, newPermissions);

  return permissions;
}

export async function searchForPermission(
  permissionService: PermissionService,
): Promise<PermissionListResponseDto> {
  return await permissionService.searchFor({
    value: faker.lorem.word(),
    pagination: { limit: 10, page: 1 },
    sort: { sortField: 'name', sortOrder: 'ASC' },
  });
}

export async function updatePermissions(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<Permission> {
  const permissions = await createPermissions(roleService, permissionService);

  const updateDto: UpdatePermissionDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    code: `${faker.string.alpha(8)}-${uuid()}`,
  };

  if (permissions[0] === undefined) {
    throw new Error('Could not create permissino');
  }

  const updatedPermission = await permissionService.update(
    permissions[0].id,
    updateDto,
  );

  expect(updatedPermission).toBeDefined();
  expect(updatedPermission.id).toBeDefined();
  expect(updatedPermission.name).toBe(updateDto.name);
  expect(updatedPermission.code).toBe(updateDto.code);

  return updatedPermission;
}

export async function deletePermissionsByIds(
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<void> {
  const permissions = await createPermissions(roleService, permissionService);

  const result = await permissionService.deleteByIds(
    permissions.flatMap((p) => p.id),
  );

  expect(result).toEqual({ deleted: 2 });

  await expect(
    permissionService.findByIds(permissions.flatMap((p) => p.id)),
  ).rejects.toThrow(EntityNotFoundError);
}

function validatePermissionsArray(
  permissions: Permission[],
  permissionDto: CreatePermissionDto[] | Permission[],
): void {
  const [firstPermission, secondPermission] = permissions;

  if (firstPermission === undefined || secondPermission === undefined) {
    throw new Error('Permissino should be defined');
  }

  if (permissionDto instanceof Permission) {
    expect(firstPermission.id).toBeDefined();
    expect(secondPermission.id).toBeDefined();
    expect(firstPermission.role.id).toBe(
      (permissionDto as Permission[])[0]?.role.id,
    );
    expect(secondPermission.role.id).toBe(
      (permissionDto as Permission[])[1]?.role.id,
    );
  }

  expect(permissionDto.some((p) => p.code === firstPermission.code)).toBe(true);
  expect(permissionDto.some((p) => p.code === secondPermission.code)).toBe(
    true,
  );
  expect(permissionDto.some((p) => p.name === firstPermission.name)).toBe(true);
  expect(permissionDto.some((p) => p.name === secondPermission.name)).toBe(
    true,
  );
}
