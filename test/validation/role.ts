import type { RoleResponseDto } from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import { validatePermissionResponse } from '@/test/validation/permissions';

import type { UUID } from 'crypto';

export function validateRoleApiResponse({
  roles,
  ids,
  names,
  expectedAmount,
  permissionNames,
  permissionCodes,
  permissionIds,
  expectedPermissionAmount,
}: {
  roles: Role[] | RoleResponseDto[];
  ids?: UUID[];
  names?: string[];
  expectedAmount?: number;
  permissionNames?: string[];
  permissionCodes?: string[];
  permissionIds?: UUID[];
  expectedPermissionAmount?: number;
}): void {
  if (roles.length === 0) {
    throw new Error('Role array is empty, nothing to validate');
  }

  expect(roles).toBeDefined();

  if (expectedAmount !== undefined) {
    expect(roles).toHaveLength(expectedAmount);
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

    if (expectedPermissionAmount !== undefined) {
      if (role.permissions) {
        expect(role.permissions).toHaveLength(expectedPermissionAmount);
      } else {
        throw new Error(`Role ${role.name} does not have permissions property`);
      }
    }

    if (role.permissions && role.permissions.length > 0) {
      validatePermissionResponse({
        permissions: role.permissions,
        ...(expectedPermissionAmount != undefined && {
          amountExpected: expectedPermissionAmount,
        }),
        ...(permissionNames != undefined && { names: permissionNames }),
        ...(permissionCodes != undefined && { codes: permissionCodes }),
        ...(permissionIds != undefined && { ids: permissionIds }),
      });
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
