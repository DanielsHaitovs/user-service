/* eslint-disable @typescript-eslint/no-misused-spread */
import { COUNTRIES } from '@/commonConst/countries.const';
import { validateUserResponseDto } from '@/test/validate/user';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { CreateUserDto, UserResponseDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function createTestUser({
  pipelineService,
  overrides = {},
  createdById,
  cacheSetSpy,
  auditLogSpy,
}: {
  pipelineService: UserPipelineService;
  overrides?: Partial<CreateUserDto>;
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
}): Promise<UserResponseDto> {
  const defaultUserData: CreateUserDto = {
    isActive: true,
    roleIds: [],
    storeIds: [],
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    twoFactorSecret: faker.internet.password(),
    country: COUNTRIES.US,
  };

  const createDto = {
    ...defaultUserData,
    ...overrides,
  };

  const finalUserData = await pipelineService.create({
    createDto,
    createdById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  validateUserResponseDto({
    response: finalUserData,
    expected: createDto,
  });

  expect(cacheSetSpy).toHaveBeenCalledTimes(2);
  expect(auditLogSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();

  return finalUserData;
}
