import type { UserWithStores } from '@/common/pipes/userStores.pipe';
import type {
  GetRelatedStoreDto,
  StoreResponseDto,
} from '@/storeDto/store.dto';
import { validateStoreResponseDto } from '@/test/validate/store';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { AssignStoresToUserDto } from '@/userDto/stores.dto';
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
export async function assignTestStoreToUser({
  pipelineService,
  data,
  userStores,
  assignedById,
  cacheInvalidateByIdSpy,
  cacheSetSpy,
  cacheGetByIdSpy,
  auditLogSpy,
}: {
  pipelineService: UserStorePipelineService;
  data: AssignStoresToUserDto;
  userStores: UserWithStores;
  assignedById: UUID;
  cacheSetSpy: jest.SpyInstance;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
}): Promise<void> {
  await pipelineService.assignStoresToUser({
    data,
    userStores,
    assignedById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
  expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  expect(auditLogSpy).toHaveBeenCalledTimes(1);
  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheGetByIdSpy.mockClear();
  auditLogSpy.mockClear();
}

export async function getAssignedStoresForUser({
  pipelineService,
  userId,
  expected,
  cacheGetByIdSpy,
}: {
  pipelineService: UserStorePipelineService;
  userId: UUID;
  expected?: Partial<StoreResponseDto>[] | undefined;
  cacheGetByIdSpy: jest.SpyInstance;
}): Promise<GetRelatedStoreDto[]> {
  cacheGetByIdSpy.mockClear();
  const userStores = await pipelineService.getAssignedStores(userId);

  expect(userStores).toBeDefined();

  if (expected != undefined && expected.length > 0) {
    expect(userStores.length).toBe(expected.length);
    const expectedStoresMap = new Map(expected.map((s) => [s.id, s]));

    userStores.forEach((store) => {
      const expectedStore = expectedStoresMap.get(store.id);

      validateStoreResponseDto({
        response: store,
        expected: expectedStore,
      });
    });
  } else {
    expect(userStores.length).toBe(0);
  }

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
  cacheGetByIdSpy.mockClear();

  return userStores;
}
