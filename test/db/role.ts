import { Permission } from '@/permissionEntities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import { createTestPermissions } from '@/test/db/permission';
import { faker } from '@faker-js/faker';

import { randomUUID, type UUID } from 'crypto';
import { type DataSource, In } from 'typeorm';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function createTestRole({
  dataSource,
  overrides = {},
}: {
  dataSource: DataSource;
  overrides: Partial<Roles>;
}): Promise<Roles> {
  const roleRepository = dataSource.getRepository(Roles);
  const generatedName = `${faker.person.jobArea()} ${faker.person.jobType()}`;
  const defaultRoleData: Partial<Roles> = {
    name: `Access ${generatedName} - ${randomUUID()}`,
  };

  const finalRoleData = roleRepository.create({
    ...defaultRoleData,
    ...overrides,
  });

  const newRole = await roleRepository.save(finalRoleData);

  expect(newRole).toBeDefined();
  expect(newRole.id).toBeDefined();
  expect(newRole.name).toBe(finalRoleData.name);
  expect(newRole.createdBy).toBeDefined();

  return newRole;
}

export async function createTestRoleWithPermissions({
  dataSource,
  role = {},
  permissions = [],
}: {
  dataSource: DataSource;
  role: Partial<Roles>;
  permissions: Partial<Permission>[];
}): Promise<Roles> {
  const roleRepository = dataSource.getRepository(Roles);
  const newRole = await createTestRole({ dataSource, overrides: role });

  const newPermissions = await createTestPermissions({
    dataSource,
    permissions,
  });

  newRole.permissions = newPermissions;
  await roleRepository.save(newRole);

  expect(newRole).toBeDefined();
  expect(newRole.permissions).toBeDefined();
  expect(newRole.permissions).toHaveLength(newPermissions.length);

  return newRole;
}

export async function getTestRoleById({
  dataSource,
  id,
  name,
  createdById,
}: {
  dataSource: DataSource;
  id: UUID;
  name?: string;
  createdById?: UUID;
}): Promise<Roles> {
  const roleRepository = dataSource.getRepository(Roles);

  const role = await roleRepository.findOneOrFail({
    where: { id },
    relations: ['createdBy'],
  });

  expect(role).toBeDefined();
  expect(role.id).toBe(id);

  if (name != undefined) {
    expect(role.name).toBe(name);
  }
  if (createdById != undefined) {
    expect(role.createdBy.id).toBe(createdById);
  }

  return role;
}

export async function getTestRoleWithPermissionsById({
  dataSource,
  id,
  name,
  createdById,
  permissions,
}: {
  dataSource: DataSource;
  id: UUID;
  name?: string;
  createdById?: UUID;
  permissions?: Partial<Permission>[];
}): Promise<Roles> {
  const roleRepository = dataSource.getRepository(Roles);

  const role = await roleRepository.findOneOrFail({
    where: { id },
    relations: ['createdBy', 'permissions'],
  });

  expect(role).toBeDefined();
  expect(role.id).toBe(id);

  if (name != undefined) {
    expect(role.name).toBe(name);
  }
  if (createdById != undefined) {
    expect(role.createdBy.id).toBe(createdById);
  }

  if (permissions != undefined) {
    expect(role.permissions).toBeDefined();
    expect(role.permissions).toHaveLength(permissions.length);

    for (const permission of role.permissions) {
      const expectedPermission = permissions.find(
        (p) => p.id === permission.id,
      );
      expect(expectedPermission).toBeDefined();
      if (expectedPermission) {
        expect(permission.name).toBe(expectedPermission.name);
        expect(permission.code).toBe(expectedPermission.code);
      }
    }
  }

  return role;
}

export async function removePermissionFromRole({
  dataSource,
  roleId,
  permissionId,
}: {
  dataSource: DataSource;
  roleId: UUID;
  permissionId: UUID;
}): Promise<void> {
  const roleRepository = dataSource.getRepository(Roles);
  const role = await roleRepository.findOneOrFail({
    where: { id: roleId, permissions: { id: permissionId } },
    relations: ['permissions'],
  });

  role.permissions = role.permissions.filter(
    (permission) => permission.id !== permissionId,
  );

  await roleRepository.save(role);
}

export async function addPermissionToRole({
  dataSource,
  roleId,
  permissionIds,
}: {
  dataSource: DataSource;
  roleId: UUID;
  permissionIds: UUID[];
}): Promise<void> {
  const roleRepository = dataSource.getRepository(Roles);
  const role = await roleRepository.findOneOrFail({
    where: { id: roleId },
    relations: ['permissions'],
  });

  const permissionRepository = dataSource.getRepository(Permission);
  const permission = await permissionRepository.find({
    where: { id: In(permissionIds) },
  });

  role.permissions.push(...permission);

  await roleRepository.save(role);
}
