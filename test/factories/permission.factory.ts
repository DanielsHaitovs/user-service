import type { PaginationDto } from '@/base/dto/pagination.dto';
import { PERMISSION_QUERY_ALIAS } from '@/lib/const/role.const';
import type {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { PermissionService } from '@/role/services/permission/permission.service';
import type { RoleService } from '@/role/services/role/role.service';
import { createRole } from '@/test/factories/role.factory';
import {
  validateDeletePermissionResponse,
  validatePermissionResponse,
} from '@/test/validation/permissions';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createPermissions({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
}): Promise<Permission[]> {
  const role = await createRole({
    roleService,
    createdBy,
    hasAccessToUser: false,
    hasAccessToPermissions: false,
  });

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
    hasAccessToUser,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: 2,
    names: permissionDto.map((p) => p.name),
    codes: permissionDto.map((p) => p.code),
    hasAccessToUser,
  });

  return permissions;
}

export async function findPermissionsByIds({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToRole,
  pagination,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToRole: boolean;
  pagination: PaginationDto;
}): Promise<Permission[]> {
  const newPermissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser,
  });

  const ids = newPermissions.map((p) => p.id);
  const names = newPermissions.map((p) => p.name);
  const codes = newPermissions.map((p) => p.code);

  const permissions = await permissionService.findByIds({
    ids,
    hasAccessToUser,
    hasAccessToRole,
    pagination,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: newPermissions.length,
    ids,
    names,
    codes,
    hasAccessToUser,
    hasAccessToRole,
  });

  return permissions;
}

export async function findPermissionsByCodes({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToRole,
  pagination,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToRole: boolean;
  pagination: PaginationDto;
}): Promise<Permission[]> {
  const newPermissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser,
  });

  const ids = newPermissions.map((p) => p.id);
  const codes = newPermissions.map((p) => p.code);
  const names = newPermissions.map((p) => p.name);

  const permissions = await permissionService.findByCodes({
    codes,
    hasAccessToUser,
    hasAccessToRole,
    pagination,
  });

  validatePermissionResponse({
    permissions,
    amountExpected: newPermissions.length,
    codes,
    ids,
    names,
    hasAccessToRole,
    hasAccessToUser,
  });

  return permissions;
}

export async function searchForPermission({
  roleService,
  permissionService,
  createdBy,
  pagination,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  pagination: PaginationDto;
}): Promise<PermissionListResponseDto> {
  const newPermissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: false,
  });

  if (newPermissions[0] === undefined) {
    throw new Error('Could not create permission');
  }

  const foundPermissions = await permissionService.searchFor({
    value: newPermissions[0].name,
    pagination,
    order: {
      sortField: `${PERMISSION_QUERY_ALIAS}.name`,
      sortOrder: 'ASC',
    },
  });

  const permissions = foundPermissions.permissions as Permission[];

  validatePermissionResponse({
    permissions,
    amountExpected: 1,
    names: [newPermissions[0].name],
    codes: [newPermissions[0].code],
    ids: [newPermissions[0].id],
    hasAccessToRole: false,
    hasAccessToUser: false,
  });

  return foundPermissions;
}

export async function updatePermissions({
  roleService,
  permissionService,
  createdBy,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
}): Promise<Permission> {
  const permissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: false,
  });

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

export async function deletePermissionsByIds({
  roleService,
  permissionService,
  createdBy,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
}): Promise<void> {
  const permissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: false,
  });

  const permissionIds = permissions.map((p) => p.id);
  const amountToDelete = permissionIds.length;
  const result = await permissionService.deleteByIds(permissionIds);

  validateDeletePermissionResponse(result, permissions.length);

  await expect(
    permissionService.findByIds({
      ids: permissionIds,
      hasAccessToUser: false,
      hasAccessToRole: false,
      pagination: { page: 1, limit: amountToDelete },
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
