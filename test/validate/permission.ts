import type { GetPermissionDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

export async function getAndValidateTestPermission({
  dataSource,
  id,
  code,
  data = {},
}: {
  dataSource: DataSource;
  id?: UUID;
  code?: string;
  data?: Partial<Permission>;
}): Promise<Permission> {
  const permissionRepository = dataSource.getRepository(Permission);

  if (id == undefined && code == undefined) {
    throw new Error('Either id or code must be provided');
  }

  const response = await permissionRepository.findOneOrFail({
    where: {
      ...(id != undefined ? { id } : {}),
      ...(code != undefined ? { code } : {}),
    },
  });

  validatePermissionResponseDto({
    response,
    expected: data,
  });

  return response;
}

export function validatePermissionResponseDto({
  response,
  expected,
}: {
  response: GetPermissionDto;
  expected: Partial<GetPermissionDto>;
}): void {
  expect(response).toBeDefined();
  expect(response.id).toBeDefined();

  if (expected.id != undefined) {
    expect(response.id).toBe(expected.id);
  }

  if (expected.name != undefined) {
    expect(response.name).toBe(expected.name);
  }

  if (expected.code != undefined) {
    expect(response.code).toBe(expected.code);
  }
}
