import type { PaginationDto } from '@/base/dto/pagination.dto';
import type {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { PermissionService } from '@/role/services/permission.service';
import type { RoleService } from '@/role/services/role.service';
import { createRole } from '@/test/factories/role.factory';
import {
  validateDeletePermissionResponse,
  validatePermissionResponse,
} from '@/test/validation/permissions';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createPermissions(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
): Promise<Permission[]> {
  const role = await createRole(roleService, createdBy);

  const permissionDto: CreatePermissionDto[] = [
    {
      name: `${faker.lorem.word()}-${role.id}`,
      code: `${faker.string.alpha(8)}-${role.id}`,
      roleIds: [role.id],
    },
    {
      name: `${faker.lorem.word()}-${role.id}`,
      code: `${faker.string.alpha(8)}-${role.id}`,
      roleIds: [role.id],
    },
  ];

  const permissions = await permissionService.create({
    permissions: permissionDto,
    createdBy,
    hasUserPermission,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: 2,
    names: permissionDto.map((p) => p.name),
    codes: permissionDto.map((p) => p.code),
    hasUserPermission,
  });

  return permissions;
}

export async function findPermissionsByIds(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
  hasRolePermission: boolean,
  pagination: PaginationDto,
): Promise<Permission[]> {
  const newPermissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
    hasUserPermission,
  );

  const permissions = await permissionService.findByIds({
    ids: newPermissions.map((p) => p.id),
    hasUserPermission,
    hasRolePermission,
    pagination,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: newPermissions.length,
    ids: newPermissions.map((p) => p.id),
  });

  return permissions;
}

export async function findPermissionsByCodes(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
  hasRolePermission: boolean,
  pagination: PaginationDto,
): Promise<Permission[]> {
  const newPermissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
    hasUserPermission,
  );

  const permissions = await permissionService.findByCodes({
    codes: newPermissions.map((p) => p.code),
    hasUserPermission,
    hasRolePermission,
    pagination,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: newPermissions.length,
    codes: newPermissions.map((p) => p.code),
  });

  return permissions;
}

export async function searchForPermission(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
  hasRolePermission: boolean,
  pagination: PaginationDto,
): Promise<PermissionListResponseDto> {
  const newPermissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
    hasUserPermission,
  );

  if (newPermissions[0] === undefined) {
    throw new Error('Could not create permission');
  }

  const foundPermissions = await permissionService.searchFor({
    value: newPermissions[0].name,
    pagination,
    hasUserPermission,
    hasRolePermission,
    sort: { sortField: 'name', sortOrder: 'ASC' },
  });

  const permissions = foundPermissions.permissions as Permission[];

  if (permissions.length === 0) {
    throw new Error('No permissions found');
  }

  validatePermissionResponse({
    permissions,
    amountExpected: 1,
    names: [newPermissions[0].name],
  });

  return foundPermissions;
}

export async function updatePermissions(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
): Promise<Permission> {
  const permissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
    hasUserPermission,
  );

  const updateDto: UpdatePermissionDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    code: `${faker.string.alpha(8)}-${uuid()}`,
  };

  if (permissions[0] === undefined) {
    throw new Error('Could not create permission');
  }

  const updatedPermission = await permissionService.update(
    permissions[0].id,
    updateDto,
  );

  validatePermissionResponse({
    permissions: [updatedPermission],
    amountExpected: 1,
    ids: [permissions[0].id],
    ...(updateDto.name != undefined && { names: [updateDto.name] }),
    ...(updateDto.code != undefined && { codes: [updateDto.code] }),
  });

  return updatedPermission;
}

export async function deletePermissionsByIds(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
  hasUserPermission: boolean,
): Promise<void> {
  const permissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
    hasUserPermission,
  );

  const permissionIds = permissions.map((p) => p.id);
  const amountToDelete = permissionIds.length;
  const result = await permissionService.deleteByIds(permissionIds);

  validateDeletePermissionResponse(result, permissions.length);

  await expect(
    permissionService.findByIds({
      ids: permissionIds,
      hasUserPermission: false,
      hasRolePermission: false,
      pagination: { page: 1, limit: amountToDelete },
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
