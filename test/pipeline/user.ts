/* eslint-disable @typescript-eslint/no-misused-spread */
import { COUNTRIES } from '@/commonConst/countries.const';
import { validateUserResponseDto } from '@/test/validate/user';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserQueryRequest } from '@/userDto/query.dto';
import type {
  CreateUserDto,
  GetUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';

import { randomUUID, type UUID } from 'crypto';

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
  cache,
  createdById,
  auditLogSpy,
}: {
  pipelineService: UserPipelineService;
  overrides?: Partial<CreateUserDto>;
  createdById: UUID;
  cache: {
    cacheSetSpy: jest.SpyInstance;
    cacheInvalidateByTagsSpy: jest.SpyInstance;
  };
  auditLogSpy: jest.SpyInstance;
}): Promise<UserResponseDto> {
  const { cacheSetSpy, cacheInvalidateByTagsSpy } = cache;

  cacheSetSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();
  auditLogSpy.mockClear();

  const defaultUserData: CreateUserDto = {
    isActive: true,
    roleIds: [],
    storeIds: [],
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${randomUUID()}@example.com`,
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
  expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

  auditLogSpy.mockClear();
  cacheSetSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();

  return finalUserData;
}

export async function getTestUserById({
  pipelineService,
  id,
  expected = {},
  cache,
}: {
  pipelineService: UserPipelineService;
  id: UUID;
  expected?: Partial<UserResponseDto>;
  cache: {
    cacheSetSpy: jest.SpyInstance;
    cacheGetByIdSpy: jest.SpyInstance;
    setCache: boolean;
  };
}): Promise<UserResponseDto> {
  const { cacheSetSpy, cacheGetByIdSpy, setCache } = cache;

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await pipelineService.getByIdOrThrow({ id });

  validateUserResponseDto({
    response,
    expected,
  });

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  if (setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return response;
}

export async function getTestUserByEmail({
  pipelineService,
  email,
  expected = {},
  cache,
}: {
  pipelineService: UserPipelineService;
  email: string;
  expected?: Partial<UserResponseDto>;
  cache: {
    cacheSetSpy: jest.SpyInstance;
    cacheGetByIdSpy: jest.SpyInstance;
    setCache: boolean;
  };
}): Promise<UserResponseDto> {
  const { cacheSetSpy, cacheGetByIdSpy, setCache } = cache;

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await pipelineService.getByEmailOrThrow({ email });

  validateUserResponseDto({
    response,
    expected,
  });

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  if (setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return response;
}

export async function updateTestUser({
  pipelineService,
  user,
  updateDto = {},
  requestedById,
  cacheInvalidateByIdSpy,
  auditLogSpy,
  expected,
}: {
  pipelineService: UserPipelineService;
  user: GetUserDto;
  updateDto?: UpdateUserDto;
  requestedById: UUID;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
  expected?: boolean;
}): Promise<boolean> {
  const updated = await pipelineService.update({
    user,
    data: updateDto,
    requestedById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  if (expected == undefined) {
    return updated;
  }

  expect(updated).toBe(expected);

  if (expected) {
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
    expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
  } else {
    expect(auditLogSpy).toHaveBeenCalledTimes(0);
    expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
  }

  cacheInvalidateByIdSpy.mockClear();
  auditLogSpy.mockClear();

  return updated;
}

export async function getManyUserBy({
  pipelineService,
  query,
  expected,
  cache,
}: {
  pipelineService: UserPipelineService;
  query: UserQueryRequest;
  expected?: UserListResponseDto;
  cache: {
    cacheSetSpy: jest.SpyInstance;
    cacheGetSpy: jest.SpyInstance;
    setCache: boolean;
  };
}): Promise<UserListResponseDto> {
  const { cacheSetSpy, cacheGetSpy, setCache } = cache;

  cacheSetSpy.mockClear();
  cacheGetSpy.mockClear();

  const response = await pipelineService.getMany(query);

  expect(response).toBeDefined();

  if (expected?.limit != undefined) {
    expect(response.limit).toBe(expected.limit);
  }

  if (expected?.page != undefined) {
    expect(response.page).toBe(expected.page);
  }

  if (expected?.total != undefined) {
    expect(response.total).toBe(expected.total);
  }

  if (expected?.totalPages != undefined) {
    expect(response.totalPages).toBe(expected.totalPages);
  }

  if (setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  expect(cacheGetSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  cacheGetSpy.mockClear();

  return response;
}
