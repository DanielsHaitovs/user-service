import { COUNTRIES } from '@/commonConst/countries.const';
import { User } from '@/userEntities/user.entity';
import { faker } from '@faker-js/faker';

import { randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function createTestUser(dataSource: DataSource): Promise<User> {
  const userRepository = dataSource.getRepository(User);

  const defaultUserData: Partial<User> = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${randomUUID()}@example.com`,
    password: faker.internet.password(),
    twoFactorSecret: faker.internet.password(),
    country: COUNTRIES.US,
  };

  const finalUserData = userRepository.create(defaultUserData);

  return await userRepository.save(finalUserData);
}
