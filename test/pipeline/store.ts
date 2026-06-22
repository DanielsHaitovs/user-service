/* eslint-disable @typescript-eslint/no-misused-spread */

import type { StorePipelineService } from '@/store/store.pipeline';
import type {
  CreateStoreDto,
  GetStoreDto,
  StoreResponseDto,
} from '@/storeDto/store.dto';
import { validateStoreResponseDto } from '@/test/validate/store';

import { randomUUID, type UUID } from 'crypto';

export async function createTestStore({
  pipelineService,
  overrides = {},
  createdById,
}: {
  pipelineService: StorePipelineService;
  overrides?: Partial<CreateStoreDto>;
  createdById: UUID;
}): Promise<StoreResponseDto> {
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
  });

  validateStoreResponseDto({
    response: store,
    expected: createDto,
  });

  return store;
}

export async function getTestStoreById({
  pipelineService,
  id,
  expected,
}: {
  pipelineService: StorePipelineService;
  id: UUID;
  expected?: Partial<StoreResponseDto>;
}): Promise<GetStoreDto> {
  const store = await pipelineService.getByIdOrThrow(id);

  expect(store).toBeDefined();
  expect(store.id).toBe(id);

  if (expected == undefined) {
    return store;
  }

  validateStoreResponseDto({
    response: store,
    expected,
  });

  return store;
}
