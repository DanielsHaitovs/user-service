import type { StoreResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

export async function getAndValidateTestStore({
  dataSource,
  id,
  code,
  viewCode,
  data = {},
}: {
  dataSource: DataSource;
  id?: UUID;
  code?: string;
  viewCode?: string;
  data?: Partial<Store>;
}): Promise<Store> {
  const storeRepository = dataSource.getRepository(Store);

  if (id == undefined && code == undefined && viewCode == undefined) {
    throw new Error('Either id, code, or viewCode must be provided');
  }

  const response = await storeRepository.findOneOrFail({
    where: {
      ...(id != undefined ? { id } : {}),
      ...(code != undefined ? { code } : {}),
      ...(viewCode != undefined ? { viewCode } : {}),
    },
  });

  validateStoreResponseDto({
    response,
    expected: data,
  });

  return response;
}

export function validateStoreResponseDto({
  response,
  expected,
}: {
  response: StoreResponseDto;
  expected: Partial<StoreResponseDto>;
}): void {
  expect(response).toBeDefined();
  expect(response.id).toBeDefined();

  if (expected.id != undefined) {
    expect(response.id).toBe(expected.id);
  }

  if (expected.name != undefined) {
    expect(response.name).toBe(expected.name);
  }

  if (expected.code != undefined) {
    expect(response.code).toBe(expected.code);
  }

  if (expected.viewCode != undefined) {
    expect(response.viewCode).toBe(expected.viewCode);
  }
}
