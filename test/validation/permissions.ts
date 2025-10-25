import type { PermissionResponseDto } from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';

import type { UUID } from 'crypto';

export function validatePermissionResponse({
  permissions,
  amountExpected,
  ids,
  names,
  codes,
  hasAccessToUser,
  hasAccessToRole,
}: {
  permissions: Permission[] | PermissionResponseDto[] | undefined;
  amountExpected?: number;
  ids?: UUID[];
  names?: string[];
  codes?: string[];
  hasAccessToUser?: boolean;
  hasAccessToRole?: boolean;
}): void {
  if (
    (permissions?.length === 0 || permissions === undefined) &&
    amountExpected != undefined &&
    amountExpected !== 0
  ) {
    throw new Error('Could not find any permissions');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    permissions != undefined &&
    permissions.length > 0
  ) {
    throw new Error('Unexpected permissions found');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    (permissions?.length === 0 || permissions === undefined)
  ) {
    return;
  }

  if (permissions === undefined) {
    throw new Error('Permissions is undefined, cannot validate');
  }

  expect(permissions).toBeDefined();

  if (amountExpected !== undefined) {
    expect(permissions).toHaveLength(amountExpected);
  }

  permissions.forEach((permission) => {
    expect(permission).toHaveProperty('id');
    expect(permission).toHaveProperty('name');
    expect(permission).toHaveProperty('code');

    if (ids !== undefined && ids.length > 0) {
      expect(ids).toContain(permission.id);
    }

    if (names !== undefined && names.length > 0) {
      expect(names).toContain(permission.name);
    }

    if (codes !== undefined && codes.length > 0) {
      expect(codes).toContain(permission.code);
    }

    if (hasAccessToUser !== undefined && hasAccessToUser) {
      expect(permission).toHaveProperty('createdBy');
      expect(permission.createdBy).toHaveProperty('id');
    }

    if (hasAccessToRole !== undefined && hasAccessToRole) {
      expect(permission).toHaveProperty('roles');
      expect(Array.isArray(permission.roles)).toBe(true);
      permission.roles.forEach((role) => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
      });
    }
  });
}

export function validateDeletePermissionResponse(
  response: {
    deleted: number;
  },
  amountRequested: number,
): void {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('deleted');
  expect(response.deleted).toBe(amountRequested);
}
