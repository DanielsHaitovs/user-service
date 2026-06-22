import { Store } from '@/storeEntities/store.entity';
import { faker } from '@faker-js/faker';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

export async function createTestStore({
  dataSource,
  overrides = {},
}: {
  dataSource: DataSource;
  overrides: Partial<Store>;
}): Promise<Store> {
  const storeRepository = dataSource.getRepository(Store);
  const generatedName = `${faker.word.adjective()} ${faker.word.noun()}`;
  const defaultStoreData: Partial<Store> = {
    name: `Store ${generatedName} - ${randomUUID()}`,
    code: `store-${faker.helpers.slugify(generatedName)}-${randomUUID()}`,
    viewCode: `store-view-${faker.helpers.slugify(generatedName)}-${randomUUID()}`,
  };

  const finalStoreData = storeRepository.create({
    ...defaultStoreData,
    ...overrides,
  });

  const newStore = await storeRepository.save(finalStoreData);

  expect(newStore).toBeDefined();
  expect(newStore.id).toBeDefined();
  expect(newStore.name).toBe(finalStoreData.name);
  expect(newStore.createdBy).toBeDefined();

  return newStore;
}

export async function getTestStoreById({
  dataSource,
  id,
  name,
  code,
  viewCode,
  createdById,
}: {
  dataSource: DataSource;
  id: UUID;
  name?: string;
  code?: string;
  viewCode?: string;
  createdById?: UUID;
}): Promise<Store> {
  const storeRepository = dataSource.getRepository(Store);

  const store = await storeRepository.findOneOrFail({
    where: { id },
    relations: ['createdBy'],
  });

  expect(store).toBeDefined();
  expect(store.id).toBe(id);

  if (name != undefined) {
    expect(store.name).toBe(name);
  }

  if (code != undefined) {
    expect(store.code).toBe(code);
  }

  if (viewCode != undefined) {
    expect(store.viewCode).toBe(viewCode);
  }

  if (createdById != undefined) {
    expect(store.createdBy.id).toBe(createdById);
  }

  return store;
}
