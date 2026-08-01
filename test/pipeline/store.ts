/* eslint-disable @typescript-eslint/no-misused-spread */

import type { StorePipelineService } from '@/store/store.pipeline';
import type {
  CreateStoreDto,
  GetStoreDto,
  StoreResponseDto,
} from '@/storeDto/store.dto';
import { validateStoreResponseDto } from '@/test/validate/store';
import { faker } from '@faker-js/faker/.';

import { randomUUID, type UUID } from 'crypto';

export async function createTestStore({
  storePipelineService,
  overrides = {},
  createdById,
  cacheSetSpy,
  cacheInvalidateByTagsSpy,
  auditLogSpy,
}: {
  storePipelineService: StorePipelineService;
  overrides?: Partial<CreateStoreDto>;
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  auditLogSpy?: jest.SpyInstance;
}): Promise<StoreResponseDto> {
  cacheSetSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();

  if (auditLogSpy) {
    auditLogSpy.mockClear();
  }

  const uuid = randomUUID();

  const defaultStoreData: CreateStoreDto = {
    name: `Store name ${uuid}`,
    code: `store-code-${uuid}`,
    viewCode: `store-view-${uuid}`,
  };

  const createDto = {
    ...defaultStoreData,
    ...overrides,
  };

  const store = await storePipelineService.create({
    createDto,
    createdById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  validateStoreResponseDto({
    response: store,
    expected: createDto,
  });

  expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

  cacheInvalidateByTagsSpy.mockClear();
  cacheSetSpy.mockClear();

  if (auditLogSpy) {
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
    auditLogSpy.mockClear();
  }

  return store;
}

export async function getTestStoreById({
  storePipelineService,
  id,
  expected,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  storePipelineService: StorePipelineService;
  id: UUID;
  expected?: Partial<StoreResponseDto>;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<GetStoreDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const store = await storePipelineService.getByIdOrThrow(id);

  validateStoreResponseDto({
    response: store,
    expected,
  });

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  if (setCache != undefined && setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return store;
}
