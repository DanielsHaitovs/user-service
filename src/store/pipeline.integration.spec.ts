import { CacheService } from '@/baseServices/cache.service';
import { StorePipelineService } from '@/store/store.pipeline';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestStore, getTestStoreById } from '@/test/pipeline/store';
import { validateStoreResponseDto } from '@/test/validate/store';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

import { createTestUser } from '../../test/db/user';
import { assignStoreToUser } from '../../test/db/userStore';
import type { User } from '../user/entities/user.entity';

import type { StoreResponseDto } from './dto/store.dto';

describe('StorePipelineService (Integration)', () => {
  let pipelineService: StorePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let conflictStore: StoreResponseDto;
  let testUser: User;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService =
      moduleFixture.get<StorePipelineService>(StorePipelineService);
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheInvalidateByIdSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateById',
    );
    cacheInvalidateByTagsSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateByTags',
    );
    conflictStore = await createTestStore({
      pipelineService,
      createdById: systemUserId,
    });
    testUser = await createTestUser(dataSource);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Should create store -> StorePipelineService -> create()', () => {
    it('should create store', async () => {
      const createdStore = await pipelineService.create({
        createDto: {
          name: `Test Store ${randomUUID()}`,
          code: `test-store-${randomUUID()}`,
          viewCode: `test-store-view-${randomUUID()}`,
        },
        createdById: systemUserId,
      });

      await getTestStoreById({
        pipelineService,
        id: createdStore.id,
        expected: createdStore,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflifct when trying to save store with the same name', async () => {
      const storeName = `Test Store ${randomUUID()}`;

      await createTestStore({
        pipelineService,
        overrides: {
          name: storeName,
        },
        createdById: systemUserId,
      });

      await expect(
        pipelineService.create({
          createDto: {
            name: storeName,
            code: `test-store-${randomUUID()}`,
            viewCode: `test-store-view-${randomUUID()}`,
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflifct when trying to save store with the same code', async () => {
      const storeCode = `test-store-${randomUUID()}`;

      await createTestStore({
        pipelineService,
        overrides: {
          code: storeCode,
        },
        createdById: systemUserId,
      });

      await expect(
        pipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: storeCode,
            viewCode: `test-store-view-${randomUUID()}`,
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflifct when trying to save store with the same viewCode', async () => {
      const storeViewCode = `test-store-view-${randomUUID()}`;

      await createTestStore({
        pipelineService,
        overrides: {
          viewCode: storeViewCode,
        },
        createdById: systemUserId,
      });

      await expect(
        pipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: `test-store-${randomUUID()}`,
            viewCode: storeViewCode,
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test store by its ID', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const retrieved = await pipelineService.getByIdOrThrow(store.id);

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        pipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByCodeOrThrow()', () => {
    it('should retrieve the test store by its code', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const retrieved = await pipelineService.getByCodeOrThrow(store.code);

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        pipelineService.getByCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByViewCodeOrThrow()', () => {
    it('should retrieve the test store by its viewCode', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const retrieved = await pipelineService.getByViewCodeOrThrow(
        store.viewCode,
      );

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        pipelineService.getByViewCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should update store -> StorePipelineService -> update()', () => {
    it('should update the test store', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const updatedName = `Updated Store ${randomUUID()}`;
      const updatedCode = `updated-store-${randomUUID()}`;
      const updatedViewCode = `updated-store-view-${randomUUID()}`;

      const updatedStore = await pipelineService.update({
        updateDto: {
          name: updatedName,
          code: updatedCode,
          viewCode: updatedViewCode,
        },
        id: store.id,
      });

      expect(updatedStore).toBeDefined();
      expect(updatedStore).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);

      await getTestStoreById({
        pipelineService,
        id: store.id,
        expected: {
          id: store.id,
          name: updatedName,
          code: updatedCode,
          viewCode: updatedViewCode,
        },
      });

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('Should throw if trying to update store with a name that already exists', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);

      await expect(
        pipelineService.update({
          updateDto: {
            name: conflictStore.name,
          },
          id: store.id,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a code that already exists', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);

      await expect(
        pipelineService.update({
          updateDto: {
            code: conflictStore.code,
          },
          id: store.id,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a viewcode that already exists', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);

      await expect(
        pipelineService.update({
          updateDto: {
            viewCode: conflictStore.viewCode,
          },
          id: store.id,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should delete store -> StorePipelineService -> delete()', () => {
    it('should delete the unused test store with canDeleteAssignedStore set to true', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const deleted = await pipelineService.delete({
        id: store.id,
        canDeleteAssignedStore: true,
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the unused test store with canDeleteAssignedStore set to false', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      const deleted = await pipelineService.delete({
        id: store.id,
        canDeleteAssignedStore: false,
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the unused test store with canDeleteAssignedStore set to true', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      await assignStoreToUser({
        dataSource,
        userId: testUser.id,
        storeId: store.id,
      });

      const deleted = await pipelineService.delete({
        id: store.id,
        canDeleteAssignedStore: true,
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw unprocessible entity exception when trying to delete a store assigned to users with canDeleteAssignedStore set to false', async () => {
      const store = await createTestStore({
        pipelineService,
        createdById: systemUserId,
      });

      await assignStoreToUser({
        dataSource,
        userId: testUser.id,
        storeId: store.id,
      });

      await expect(
        pipelineService.delete({
          id: store.id,
          canDeleteAssignedStore: false,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Store cannot be deleted because it is currently assigned to one or more users. Please unassign the store from all users before attempting to delete it.',
        ),
      );
    });

    it('should throw UnprocessableEntityException if the target store does not exist', async () => {
      const nonExistentId = randomUUID();

      await expect(
        pipelineService.delete({
          id: nonExistentId,
          canDeleteAssignedStore: false,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate store. The following store ids do not exist: ${nonExistentId}`,
        ),
      );
    });
  });
});
