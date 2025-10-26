import type {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import type { PermissionService } from '@/role/services/permission/permission.service';
import type { RoleService } from '@/role/services/role/role.service';
import { createPermissions } from '@/test/factories/permission.factory';
import {
  validateDeleteRoleResponse,
  validateRoleApiResponse,
} from '@/test/validation/role';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

import type { RoleQueryService } from '../../src/modules/role/services/role/query.service';

export async function createRole({
  roleService,
  createdBy,
  hasAccessToUser,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToPermissions: boolean;
}): Promise<Role> {
  const roleDto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
  };

  const result = await roleService.create({
    roleDto,
    createdBy,
    hasAccessToPermissions,
    hasAccessToUser,
  });

  validateRoleApiResponse({
    roles: [result],
    amountExpected: 1,
    names: [roleDto.name],
    expectedPermissionAmount: 0,
    expectsCreateByUser: hasAccessToUser,
    createdByUserIds: hasAccessToUser ? [result.createdBy.id] : [],
  });

  return result;
}

export async function createRoleWithPermissions({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToPermissions: boolean;
}): Promise<Role> {
  const permissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser,
  });

  const roleDto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    permissions: permissions.flatMap((permission) => permission.code),
  };

  const role = await roleService.create({
    roleDto,
    createdBy,
    hasAccessToUser,
    hasAccessToPermissions,
  });

  validateRoleApiResponse({
    roles: [role],
    amountExpected: 1,
    ids: [role.id],
    names: [roleDto.name],
    expectedPermissionAmount: hasAccessToPermissions ? permissions.length : 0,
    permissionNames: hasAccessToPermissions
      ? permissions.map((p) => p.name)
      : [],
    permissionCodes: hasAccessToPermissions
      ? permissions.map((p) => p.code)
      : [],
    permissionIds: hasAccessToPermissions ? permissions.map((p) => p.id) : [],
    expectsCreateByUser: hasAccessToUser,
    createdByUserIds: hasAccessToUser ? [role.createdBy.id] : [],
  });

  return role;
}

export async function addPermissionsToRole({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToPermissions: boolean;
}): Promise<Role> {
  const permissions = await createPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser,
  });

  const role = await createRole({
    roleService,
    createdBy,
    hasAccessToUser,
    hasAccessToPermissions,
  });

  const permissionIds = permissions.flatMap((p) => p.id);
  const permissionCodes = permissions.flatMap((p) => p.code);

  const updatedRole = await roleService.addPermissionsToRole({
    permissionIds,
    permissionCodes,
    roleId: role.id,
    hasAccessToUser,
  });

  validateRoleApiResponse({
    roles: [updatedRole],
    amountExpected: 1,
    names: [role.name],
    ids: [role.id],
    expectsCreateByUser: hasAccessToUser,
    createdByUserIds: hasAccessToUser ? [updatedRole.createdBy.id] : [],
    expectedPermissionAmount: hasAccessToPermissions ? permissions.length : 0,
    permissionNames: hasAccessToPermissions
      ? permissions.map((p) => p.name)
      : [],
    permissionCodes: hasAccessToPermissions
      ? permissions.map((p) => p.code)
      : [],
    permissionIds: hasAccessToPermissions ? permissions.map((p) => p.id) : [],
  });

  return updatedRole;
}

export async function findRolesByIds({
  roleService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToPermissions: boolean;
}): Promise<Role[]> {
  const newRole = await createRoleWithPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser,
    hasAccessToPermissions,
  });

  const roles = await roleService.findByIds({
    ids: [newRole.id],
    pagination: { page: 1, limit: 1 },
    hasAccessToUser,
    hasAccessToPermissions,
  });

  validateRoleApiResponse({
    roles,
    amountExpected: 1,
    expectsCreateByUser: hasAccessToUser,
    createdByUserIds: hasAccessToUser ? [newRole.createdBy.id] : [],
    expectedPermissionAmount: hasAccessToPermissions
      ? newRole.permissions.length
      : 0,
    names: [newRole.name],
    ids: [newRole.id],
    permissionCodes: hasAccessToPermissions
      ? newRole.permissions.map((p) => p.code)
      : [],
    permissionNames: hasAccessToPermissions
      ? newRole.permissions.map((p) => p.name)
      : [],
    permissionIds: hasAccessToPermissions
      ? newRole.permissions.map((p) => p.id)
      : [],
  });

  return roles;
}

export async function findRolesCreatedByUserWithId({
  roleService,
  permissionService,
  createdBy,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToPermissions: boolean;
}): Promise<Role[]> {
  const newRole = await createRoleWithPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: true,
    hasAccessToPermissions,
  });

  const roles = await roleService.findCreatedByUserWithId({
    createdByUserIds: [newRole.createdBy.id],
    pagination: { page: 1, limit: 1 },
    hasAccessToPermissions,
  });

  // Uncomment once user entity will be created
  validateRoleApiResponse({
    roles,
    amountExpected: 1,
    expectsCreateByUser: true,
    expectedPermissionAmount: hasAccessToPermissions
      ? newRole.permissions.length
      : 0,
    // names: [newRole.name],
    // ids: [newRole.id],
    // permissionCodes: hasAccessToPermissions
    //   ? newRole.permissions.map((p) => p.code)
    //   : [],
    // permissionNames: hasAccessToPermissions
    //   ? newRole.permissions.map((p) => p.name)
    //   : [],
    // permissionIds: hasAccessToPermissions
    //   ? newRole.permissions.map((p) => p.id)
    //   : [],
    createdByUserIds: [newRole.createdBy.id],
  });

  return roles;
}

export async function searchForRoles({
  roleService,
  createdBy,
}: {
  roleService: RoleService;
  createdBy: UUID;
}): Promise<RoleListResponseDto> {
  const role = await createRole({
    roleService,
    createdBy,
    hasAccessToUser: false,
    hasAccessToPermissions: false,
  });

  const res = await roleService.searchFor({
    value: role.name,
    pagination: { page: 1, limit: 1 },
    order: { sortField: 'name', sortOrder: 'ASC' },
  });

  validateRoleApiResponse({
    roles: res.roles as Role[],
    expectedPermissionAmount: 0,
    amountExpected: 1,
    names: [role.name],
    ids: [role.id],
  });

  return res;
}

export async function queryRoles({
  roleService,
  roleQueryService,
  permissionService,
  createdBy,
  hasAccessToUser,
  hasAccessToPermissions,
}: {
  roleService: RoleService;
  roleQueryService: RoleQueryService;
  permissionService: PermissionService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  hasAccessToPermissions: boolean;
}): Promise<RoleListResponseDto> {
  const newRole = await createRoleWithPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: true,
    hasAccessToPermissions: true,
  });

  const anotherRole = await createRoleWithPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToUser: true,
    hasAccessToPermissions: true,
  });

  const permissionIds = [
    ...newRole.permissions.map((p) => p.id),
    ...anotherRole.permissions.map((p) => p.id),
  ];
  const permissionCodes = [
    ...newRole.permissions.map((p) => p.code),
    ...anotherRole.permissions.map((p) => p.code),
  ];
  const permissionNames = [
    ...newRole.permissions.map((p) => p.name),
    ...anotherRole.permissions.map((p) => p.name),
  ];

  const data = await roleQueryService.getRoles(
    {
      rolesQuery: {
        ids: [newRole.id, anotherRole.id],
        names: [newRole.name, anotherRole.name],
        createdByIds: [createdBy],
      },
      permissionsQuery: {
        ids: permissionIds,
        names: permissionNames,
        codes: permissionCodes,
      },
      pagination: { page: 1, limit: 10 },
      includeCreatedBy: true,
      includePermissions: true,
    },
    hasAccessToPermissions,
    hasAccessToUser,
  );

  validateRoleApiResponse({
    roles: data.roles,
    amountExpected: 2,
    expectsCreateByUser: hasAccessToUser,
    createdByUserIds: hasAccessToUser ? [newRole.createdBy.id] : [],
    expectedPermissionAmount: hasAccessToPermissions
      ? newRole.permissions.length
      : 0,
    names: [newRole.name, anotherRole.name],
    ids: [newRole.id, anotherRole.id],
    permissionCodes: hasAccessToPermissions ? permissionCodes : [],
    permissionNames: hasAccessToPermissions ? permissionNames : [],
    permissionIds: hasAccessToPermissions ? permissionIds : [],
  });

  return data;
}

export async function updateRole({
  roleService,
  createdBy,
}: {
  roleService: RoleService;
  createdBy: UUID;
}): Promise<Role> {
  const role = await createRole({
    roleService,
    createdBy,
    hasAccessToPermissions: false,
    hasAccessToUser: false,
  });

  const updateDto: UpdateRoleDto = {
    name: `${role.name}-updated`,
  };

  const updatedRole = await roleService.update({
    id: role.id,
    role: updateDto,
  });

  validateRoleApiResponse({
    roles: [updatedRole],
    amountExpected: 1,
    ids: [role.id],
    ...(updateDto.name != undefined && { names: [updateDto.name] }),
  });

  return updatedRole;
}

export async function deleteRolesByIds({
  roleService,
  createdBy,
}: {
  roleService: RoleService;
  createdBy: UUID;
}): Promise<void> {
  const role = await createRole({
    roleService,
    createdBy,
    hasAccessToUser: false,
    hasAccessToPermissions: false,
  });

  const result = await roleService.deleteByIds([role.id]);

  validateDeleteRoleResponse(result, 1);

  await expect(
    roleService.findByIds({
      ids: [role.id],
      pagination: { page: 1, limit: 1 },
      hasAccessToUser: false,
      hasAccessToPermissions: false,
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
