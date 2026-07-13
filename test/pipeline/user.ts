/* eslint-disable @typescript-eslint/no-misused-spread */
import { COUNTRIES } from '@/commonConst/countries.const';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { validateUserResponseDto } from '@/test/validate/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
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
  userPipelineService,
  overrides = {},
  cache,
  createdById,
  auditLogSpy,
}: {
  userPipelineService: UserPipelineService;
  overrides?: Partial<CreateUserDto>;
  createdById: UUID;
  cache?: {
    cacheSetSpy: jest.SpyInstance;
    cacheInvalidateByTagsSpy: jest.SpyInstance;
  };
  auditLogSpy?: jest.SpyInstance;
}): Promise<UserResponseDto> {
  if (cache != undefined) {
    cache.cacheSetSpy.mockClear();
    cache.cacheInvalidateByTagsSpy.mockClear();
  }

  if (auditLogSpy != undefined) {
    auditLogSpy.mockClear();
  }

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

  const finalUserData = await userPipelineService.create({
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

  if (cache != undefined) {
    expect(cache.cacheSetSpy).toHaveBeenCalledTimes(2);
    expect(cache.cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);
    cache.cacheSetSpy.mockClear();
    cache.cacheInvalidateByTagsSpy.mockClear();
  }

  if (auditLogSpy != undefined) {
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
    auditLogSpy.mockClear();
  }

  return finalUserData;
}

export async function getTestUserById({
  userPipelineService,
  id,
  expected = {},
  cache,
}: {
  userPipelineService: UserPipelineService;
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

  const response = await userPipelineService.getByIdOrThrow({ id });

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
  userPipelineService,
  email,
  expected = {},
  cache,
}: {
  userPipelineService: UserPipelineService;
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

  const response = await userPipelineService.getByEmailOrThrow({ email });

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
  userPipelineService,
  user,
  updateDto = {},
  requestedById,
  cacheInvalidateByIdSpy,
  auditLogSpy,
  expected,
}: {
  userPipelineService: UserPipelineService;
  user: GetUserDto;
  updateDto?: UpdateUserDto;
  requestedById: UUID;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
  expected?: boolean;
}): Promise<boolean> {
  const updated = await userPipelineService.update({
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
  userPipelineService,
  query,
  expected,
  cache,
}: {
  userPipelineService: UserPipelineService;
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

  const response = await userPipelineService.getMany(query);

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

export async function initTestUser({
  userPipelineService,
  rolePipelineService,
  userRolePipelineService,
  storePipelineService,
  userStorePipelineService,
  systemPermissions,
  systemUserId,
  overrides = {},
}: {
  userPipelineService: UserPipelineService;
  rolePipelineService: RolePipelineService;
  userRolePipelineService: UserRolePipelineService;
  storePipelineService: StorePipelineService;
  userStorePipelineService: UserStorePipelineService;
  systemPermissions: string[];
  systemUserId: UUID;
  overrides?: Partial<CreateUserDto>;
}): Promise<{
  user: UserResponseDto;
  role: RoleResponseDto;
  store: StoreResponseDto;
}> {
  const user = await createTestUser({
    userPipelineService,
    overrides,
    createdById: systemUserId,
  });

  const [role, store] = await Promise.all([
    rolePipelineService.create({
      createDto: {
        name: `Test Role ${user.id}`,
        permissions: systemPermissions,
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    }),
    storePipelineService.create({
      createDto: {
        name: `Test Store ${user.id}`,
        code: `TEST_STORE_${user.id}`,
        viewCode: `TEST_STORE_VIEW_${user.id}`,
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    }),
    userPipelineService.update({
      user,
      data: {
        isEmailVerified: true,
      },
      requestedById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    }),
  ]);

  await Promise.all([
    userRolePipelineService.assignRolesToUser({
      userRoles: {
        user,
        roles: [],
      },
      data: {
        roleIds: [role.id],
      },
      assignedById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    }),
    userStorePipelineService.assignStoresToUser({
      userStores: {
        user,
        stores: [],
      },
      data: {
        storeIds: [store.id],
      },
      assignedById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    }),
  ]);

  return { user, role, store };
}
