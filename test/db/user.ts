import { COUNTRIES } from '@/commonConst/countries.const';
import { getPermissionsByCodes } from '@/test/db/permission';
import { addPermissionToRole, createTestRole } from '@/test/db/role';
import { assignRoleToUser } from '@/test/db/userRole';
import { User } from '@/userEntities/user.entity';
import { faker } from '@faker-js/faker';

import * as bcrypt from 'bcrypt';
import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';
/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function createTestUser({
  dataSource,
  override,
}: {
  dataSource: DataSource;
  override?: Partial<User>;
}): Promise<User> {
  const userRepository = dataSource.getRepository(User);

  const defaultUserData: Partial<User> = {
    country: COUNTRIES.US,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${randomUUID()}@example.com`,
    password: faker.internet.password(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    isActive: true,
    isEmailVerified: true,
    twoFactorSecret: faker.internet.password(),
  };

  const data = { ...defaultUserData, ...override };

  const finalUserData = userRepository.create(data);

  return await userRepository.save(finalUserData);
}

export async function updateTestUser({
  dataSource,
  id,
  override,
}: {
  dataSource: DataSource;
  id: UUID;
  override: Partial<User>;
}): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  await userRepository.update(id, override);
}

export async function initTestUser({
  dataSource,
  permissionCodes,
  override,
  systemUserId,
}: {
  dataSource: DataSource;
  override: Partial<User>;
  permissionCodes: string[];
  systemUserId: UUID;
}): Promise<User> {
  if (override.password != undefined) {
    override.password = await bcrypt.hash(override.password, 1);
  }
  const user = await createTestUser({ dataSource, override });

  const permissions = await getPermissionsByCodes({
    dataSource,
    codes: permissionCodes,
  });

  const role = await createTestRole({
    dataSource,
    overrides: {
      name: `Test Role for ${user.email}`,
      createdBy: { id: systemUserId } as User,
    },
  });

  if (permissions.length > 0) {
    await addPermissionToRole({
      dataSource,
      roleId: role.id,
      permissionIds: permissions.map((permission) => permission.id),
    });
  }

  await assignRoleToUser({
    dataSource,
    userId: user.id,
    roleId: role.id,
  });

  role.permissions = permissions;

  user.userRoles = [
    {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      role,
      user,
      assignedBy: { id: systemUserId } as User,
    },
  ];

  return user;
}
