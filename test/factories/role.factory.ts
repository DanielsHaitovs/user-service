import type {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import type { PermissionService } from '@/role/services/permission.service';
import type { RoleService } from '@/role/services/role.service';
import { createPermissions } from '@/test/factories/permission.factory';
import {
  validateDeleteRoleResponse,
  validateRoleApiResponse,
} from '@/test/validation/role';
import { faker } from '@faker-js/faker/.';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createRole(
  service: RoleService,
  createdBy: UUID,
): Promise<Role> {
  const roleDto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
  };

  const result = await service.create({ roleDto, createdBy });

  validateRoleApiResponse({
    roles: [result],
    expectedAmount: 1,
    names: [roleDto.name],
  });

  return result;
}

export async function createRoleWithPermissins(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
): Promise<Role> {
  const permissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
  );

  const roleDto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    permissions: permissions.flatMap((permission) => permission.code),
  };

  const role = await roleService.create({ roleDto, createdBy });

  validateRoleApiResponse({
    roles: [role],
    expectedAmount: 1,
    names: [roleDto.name],
    expectedPermissionAmount: permissions.length,
    permissionNames: permissions.map((p) => p.name),
    permissionCodes: permissions.map((p) => p.code),
    permissionIds: permissions.map((p) => p.id),
  });

  return role;
}

export async function addPermissionsToRole(
  roleService: RoleService,
  permissionService: PermissionService,
  createdBy: UUID,
): Promise<Role> {
  const permissions = await createPermissions(
    roleService,
    permissionService,
    createdBy,
  );

  const role = await createRole(roleService, createdBy);

  const permissionIds = permissions.flatMap((p) => p.id);

  const updatedRole = await roleService.addPermissionsToRole({
    permissionIds,
    roleId: role.id,
  });

  validateRoleApiResponse({
    roles: [updatedRole],
    expectedAmount: 1,
    names: [role.name],
    expectedPermissionAmount: permissions.length,
    permissionNames: permissions.map((p) => p.name),
    permissionCodes: permissions.map((p) => p.code),
    permissionIds: permissions.map((p) => p.id),
  });

  return updatedRole;
}

export async function findRolesByIds(
  roleService: RoleService,
  createdBy: UUID,
): Promise<Role[]> {
  const newRole = await createRole(roleService, createdBy);

  const roles = await roleService.findByIds({
    ids: [newRole.id],
    pagination: { page: 1, limit: 1 },
  });

  validateRoleApiResponse({
    roles,
    expectedAmount: 1,
    names: [newRole.name],
    ids: [newRole.id],
  });

  return roles;
}

export async function searchForRoles(
  roleService: RoleService,
  createdBy: UUID,
): Promise<RoleListResponseDto> {
  const role = await createRole(roleService, createdBy);

  const res = await roleService.searchFor({
    value: role.name,
    pagination: { limit: 10, page: 1 },
    sort: { sortField: 'name', sortOrder: 'ASC' },
  });

  validateRoleApiResponse({ roles: res.roles as Role[] });

  return res;
}

export async function updateRole(
  roleService: RoleService,
  createdBy: UUID,
): Promise<Role> {
  const role = await createRole(roleService, createdBy);
  const updateDto: UpdateRoleDto = {
    name: `${role.name}-updated`,
  };

  const updatedRole = await roleService.update({
    id: role.id,
    role: updateDto,
  });

  validateRoleApiResponse({
    roles: [updatedRole],
    expectedAmount: 1,
    ids: [role.id],
    ...(updateDto.name != undefined && { names: [updateDto.name] }),
  });

  return updatedRole;
}

export async function deleteRolesByIds(
  roleService: RoleService,
  createdBy: UUID,
): Promise<void> {
  const role = await createRole(roleService, createdBy);

  const result = await roleService.deleteByIds([role.id]);

  validateDeleteRoleResponse(result, 1);

  await expect(
    roleService.findByIds({
      ids: [role.id],
      pagination: { page: 1, limit: 1 },
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
