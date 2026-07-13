import { Permission } from '@/permissionEntities/permissions.entity';

import { randomUUID } from 'crypto';
import { type DataSource, In } from 'typeorm';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function createTestPermissions({
  dataSource,
  permissions = [],
}: {
  dataSource: DataSource;
  permissions: Partial<Permission>[];
}): Promise<Permission[]> {
  const permissionRepository = dataSource.getRepository(Permission);
  const uuid = randomUUID();

  const defaultPermissionData: Partial<Permission> = {
    name: `Permission ${uuid}`,
    code: uuid,
  };

  const newPermissions =
    permissions.length === 0
      ? [permissionRepository.create(defaultPermissionData)]
      : permissions.map((override) =>
          permissionRepository.create({
            ...{
              name: `Permission ${randomUUID()}`,
              code: randomUUID(),
            },
            ...override,
          }),
        );

  const result = await permissionRepository.save(newPermissions);

  expect(result).toBeDefined();
  expect(result).toHaveLength(newPermissions.length);

  result.forEach((permission, index) => {
    const expectedPermission = newPermissions[index];

    if (!expectedPermission) {
      throw new Error(
        `Expected permission at index ${index.toString()} is undefined. This indicates a mismatch between the saved permissions and the expected permissions.`,
      );
    }

    expect(permission.id).toBeDefined();
    expect(permission.name).toBe(expectedPermission.name);
    expect(permission.code).toBe(expectedPermission.code);
  });

  return result;
}

export async function getPermissionsByCodes({
  dataSource,
  codes,
}: {
  dataSource: DataSource;
  codes: string[];
}): Promise<Permission[]> {
  const permissionRepository = dataSource.getRepository(Permission);

  const permissions = await permissionRepository.find({
    where: { code: In(codes) },
  });

  expect(permissions).toBeDefined();
  expect(permissions).toHaveLength(codes.length);

  return permissions;
}
