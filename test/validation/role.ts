import type { RoleResponseDto } from '@/modules/role/dto/role/role.dto';
import type { Roles } from '@/role/entities/role.entity';
import { validatePermissionResponse } from '@/test/validation/permissions';

import type { UUID } from 'crypto';

export function validateRoleApiResponse({
  roles,
  ids,
  names,
  amountExpected,
  permissionNames,
  permissionCodes,
  permissionIds,
  expectedPermissionAmount,
  expectsCreateByUser,
  createdByUserIds,
}: {
  roles: Roles[] | RoleResponseDto[] | undefined;
  ids?: UUID[];
  names?: string[];
  amountExpected?: number;
  permissionNames?: string[];
  permissionCodes?: string[];
  permissionIds?: UUID[];
  expectedPermissionAmount?: number;
  expectsCreateByUser?: boolean;
  createdByUserIds?: UUID[];
}): void {
  if (
    (roles?.length === 0 || roles === undefined) &&
    amountExpected != undefined &&
    amountExpected !== 0
  ) {
    throw new Error('Could not find any roles');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    roles != undefined &&
    roles.length > 0
  ) {
    throw new Error('Unexpected roles found');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    (roles?.length === 0 || roles === undefined)
  ) {
    return;
  }

  if (roles === undefined) {
    throw new Error('Permissions is undefined, cannot validate');
  }

  expect(roles).toBeDefined();

  if (amountExpected !== undefined) {
    expect(roles).toHaveLength(amountExpected);
  }

  roles.forEach((role) => {
    expect(role).toHaveProperty('id');
    expect(role).toHaveProperty('name');

    if (ids !== undefined && ids.length > 0) {
      expect(ids).toContain(role.id);
    }

    if (names !== undefined && names.length > 0) {
      expect(names).toContain(role.name);
    }

    if (
      expectedPermissionAmount !== undefined &&
      expectedPermissionAmount !== 0
    ) {
      expect(role.permissions).toHaveLength(expectedPermissionAmount);

      validatePermissionResponse({
        permissions: role.permissions,
        amountExpected: expectedPermissionAmount,
        ...(permissionNames != undefined && { names: permissionNames }),
        ...(permissionCodes != undefined && { codes: permissionCodes }),
        ...(permissionIds != undefined && { ids: permissionIds }),
      });
    }

    if (expectsCreateByUser !== undefined && expectsCreateByUser) {
      // if (role.createdBy == undefined) {
      //   throw new Error('CreatedBy user is undefined');
      // }

      expect(role).toHaveProperty('createdBy');
      expect(role.createdBy).toBeDefined();
      expect(role.createdBy).toHaveProperty('id');

      expect(createdByUserIds).toContain(role.createdBy.id);
    }
  });
}

export function validateDeleteRoleResponse(
  response: {
    deleted: number;
  },
  amountRequested: number,
): void {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('deleted');
  expect(response.deleted).toBe(amountRequested);
}
