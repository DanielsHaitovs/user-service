import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { AuditProducerService } from '@/storeServices/audit.service';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser } from '@/test/db/user';
import { assignStoreToUser } from '@/test/db/userStore';
import { createTestStore, getTestStoreById } from '@/test/pipeline/store';
import { validateStoreResponseDto } from '@/test/validate/store';
import type { User } from '@/userEntities/user.entity';
import { faker } from '@faker-js/faker';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('StorePipelineService (Integration)', () => {
  let storePipelineService: StorePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let conflictStore: StoreResponseDto;
  let testUser: User;

  beforeAll(async () => {
    ({
      dataSource,
      moduleFixture,
      systemUserId,
      storePipelineService,
      cacheSetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
    conflictStore = await createTestStore({
      storePipelineService,
      createdById: systemUserId,
      cacheSetSpy,
      auditLogSpy,
    });
    testUser = await createTestUser({ dataSource });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(storePipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Should create store -> StorePipelineService -> create()', () => {
    it('should create store', async () => {
      const createdStore = await storePipelineService.create({
        createDto: {
          name: `Test Store ${randomUUID()}`,
          code: `test-store-${randomUUID()}`,
          viewCode: `test-store-view-${randomUUID()}`,
        },
        createdById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getTestStoreById({
        storePipelineService,
        id: createdStore.id,
        expected: createdStore,
        cacheGetByIdSpy,
        cacheSetSpy,
      });
    });

    it('should throw Conflict when trying to save store with the same name', async () => {
      const storeName = `Test Store ${randomUUID()}`;

      await createTestStore({
        storePipelineService,
        overrides: {
          name: storeName,
        },
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.create({
          createDto: {
            name: storeName,
            code: `test-store-${randomUUID()}`,
            viewCode: `test-store-view-${randomUUID()}`,
          },
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflict when trying to save store with the same code', async () => {
      const storeCode = `test-store-${randomUUID()}`;

      await createTestStore({
        storePipelineService,
        overrides: {
          code: storeCode,
        },
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: storeCode,
            viewCode: `test-store-view-${randomUUID()}`,
          },
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflict when trying to save store with the same viewCode', async () => {
      const storeViewCode = `test-store-view-${randomUUID()}`;

      await createTestStore({
        storePipelineService,
        overrides: {
          viewCode: storeViewCode,
        },
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: `test-store-${randomUUID()}`,
            viewCode: storeViewCode,
          },
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test store by its ID', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const retrieved = await storePipelineService.getByIdOrThrow(store.id);

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByCodeOrThrow()', () => {
    it('should retrieve the test store by its code', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const retrieved = await storePipelineService.getByCodeOrThrow(store.code);

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByViewCodeOrThrow()', () => {
    it('should retrieve the test store by its viewCode', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const retrieved = await storePipelineService.getByViewCodeOrThrow(
        store.viewCode,
      );

      validateStoreResponseDto({
        response: retrieved,
        expected: store,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByViewCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should update store -> StorePipelineService -> update()', () => {
    it('should update the test store', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const updatedName = `Updated Store ${randomUUID()}`;
      const updatedCode = `updated-store-${randomUUID()}`;
      const updatedViewCode = `updated-store-view-${randomUUID()}`;

      const updatedStore = await storePipelineService.update({
        updateDto: {
          name: updatedName,
          code: updatedCode,
          viewCode: updatedViewCode,
        },
        store,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        requestedByUserId: systemUserId,
      });

      expect(updatedStore).toBeDefined();
      expect(updatedStore).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getTestStoreById({
        storePipelineService,
        id: store.id,
        expected: {
          id: store.id,
          name: updatedName,
          code: updatedCode,
          viewCode: updatedViewCode,
        },
        cacheGetByIdSpy,
        cacheSetSpy,
        setCache: true,
      });
    });

    it('Should throw if trying to update store with a name that already exists', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.update({
          updateDto: {
            name: conflictStore.name,
          },
          store,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a code that already exists', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.update({
          updateDto: {
            code: conflictStore.code,
          },
          store,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a view code that already exists', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await expect(
        storePipelineService.update({
          updateDto: {
            viewCode: conflictStore.viewCode,
          },
          store,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${store.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should delete store -> StorePipelineService -> delete()', () => {
    it('should delete the unused test store with canDeleteAssignedStore set to true', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const deleted = await storePipelineService.delete({
        store,
        canDeleteAssignedStore: true,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the unused test store with canDeleteAssignedStore set to false', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      const deleted = await storePipelineService.delete({
        store,
        canDeleteAssignedStore: false,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the test store with canDeleteAssignedStore set to true and when store is assigned to user', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await assignStoreToUser({
        dataSource,
        userId: testUser.id,
        storeId: store.id,
      });

      const deleted = await storePipelineService.delete({
        store,
        canDeleteAssignedStore: true,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw unprocessable entity exception when trying to delete a store assigned to users with canDeleteAssignedStore set to false', async () => {
      const store = await createTestStore({
        storePipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
      });

      await assignStoreToUser({
        dataSource,
        userId: testUser.id,
        storeId: store.id,
      });

      await expect(
        storePipelineService.delete({
          store,
          canDeleteAssignedStore: false,
          requestedByUserId: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Store cannot be deleted because it is currently assigned to one or more users. Please unassign the store from all users before attempting to delete it.',
        ),
      );
    });
  });
});
