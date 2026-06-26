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
  pipelineService,
  overrides = {},
  createdById,
  cacheSetSpy,
  auditLogSpy,
}: {
  pipelineService: StorePipelineService;
  overrides?: Partial<CreateStoreDto>;
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
}): Promise<StoreResponseDto> {
  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();

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

  const store = await pipelineService.create({
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
  expect(auditLogSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();

  return store;
}

export async function getTestStoreById({
  pipelineService,
  id,
  expected,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  pipelineService: StorePipelineService;
  id: UUID;
  expected?: Partial<StoreResponseDto>;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<GetStoreDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const store = await pipelineService.getByIdOrThrow(id);

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
