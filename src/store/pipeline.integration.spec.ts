import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { AuditProducerService } from '@/storeServices/audit.service';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { createTestStore, getTestStoreById } from '@/test/pipeline/store';
import { validateStoreResponseDto } from '@/test/validate/store';
import { faker } from '@faker-js/faker';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('StorePipelineService (Integration)', () => {
  let storePipelineService: StorePipelineService;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
  let seedStore: StoreResponseDto;
  let testUser: TestUser;
  let targetUser: TestUser;

  beforeAll(async () => {
    ({
      testUser,
      targetUser,
      moduleFixture,
      systemUserId,
      storePipelineService,
      cacheSetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
  });

  beforeEach(async () => {
    seedStore = await createTestStore({
      storePipelineService,
      createdById: systemUserId,
      cacheSetSpy,
      cacheInvalidateByTagsSpy,
      auditLogSpy,
    });

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(storePipelineService).toBeDefined();
  });

  describe('Should create store -> StorePipelineService -> create()', () => {
    it('should create store', async () => {
      const createDto = {
        name: `Test Store ${randomUUID()}`,
        code: `test-store-${randomUUID()}`,
        viewCode: `test-store-view-${randomUUID()}`,
      };

      const createdStore = await storePipelineService.create({
        createDto,
        createdById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      expect(createdStore).toBeDefined();
      expect(createdStore.id).toBeDefined();
      expect(createdStore.name).toBe(createDto.name);
      expect(createdStore.code).toBe(createDto.code);
      expect(createdStore.viewCode).toBe(createDto.viewCode);
    });

    it('should throw Conflict when trying to save store with the same name', async () => {
      await expect(
        storePipelineService.create({
          createDto: {
            name: seedStore.name,
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
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflict when trying to save store with the same code', async () => {
      await expect(
        storePipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: seedStore.code,
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
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw Conflict when trying to save store with the same viewCode', async () => {
      await expect(
        storePipelineService.create({
          createDto: {
            name: `Test Store ${randomUUID()}`,
            code: `test-store-${randomUUID()}`,
            viewCode: seedStore.viewCode,
          },
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(new ConflictException('A store already exists.'));

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test store by its ID', async () => {
      const store = await storePipelineService.getByIdOrThrow(seedStore.id);

      validateStoreResponseDto({
        response: store,
        expected: seedStore,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByCodeOrThrow()', () => {
    it('should retrieve the test store by its code', async () => {
      const store = await storePipelineService.getByCodeOrThrow(seedStore.code);

      validateStoreResponseDto({
        response: store,
        expected: seedStore,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve store -> StorePipelineService -> getByViewCodeOrThrow()', () => {
    it('should retrieve the test store by its viewCode', async () => {
      const store = await storePipelineService.getByViewCodeOrThrow(
        seedStore.viewCode,
      );

      validateStoreResponseDto({
        response: store,
        expected: seedStore,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing store', async () => {
      await expect(
        storePipelineService.getByViewCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Store"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should update store -> StorePipelineService -> update()', () => {
    it('should update the test store', async () => {
      const updatedName = `Updated Store ${randomUUID()}`;
      const updatedCode = `updated-store-${randomUUID()}`;
      const updatedViewCode = `updated-store-view-${randomUUID()}`;

      const updatedStore = await storePipelineService.update({
        updateDto: {
          name: updatedName,
          code: updatedCode,
          viewCode: updatedViewCode,
        },
        store: seedStore,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        requestedByUserId: systemUserId,
      });

      expect(updatedStore).toBeDefined();
      expect(updatedStore).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getTestStoreById({
        storePipelineService,
        id: seedStore.id,
        expected: {
          id: seedStore.id,
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
      await expect(
        storePipelineService.update({
          updateDto: {
            name: seedStore.name,
          },
          store: seedStore,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${seedStore.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a code that already exists', async () => {
      await expect(
        storePipelineService.update({
          updateDto: {
            code: seedStore.code,
          },
          store: seedStore,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${seedStore.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });

    it('Should throw if trying to update store with a view code that already exists', async () => {
      await expect(
        storePipelineService.update({
          updateDto: {
            viewCode: seedStore.viewCode,
          },
          store: seedStore,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          requestedByUserId: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Cannot update store with ID ${seedStore.id}. A store with the same name, code, or view code already exists.`,
        ),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should delete store -> StorePipelineService -> delete()', () => {
    it('should delete the unused test store with canDeleteAssignedStore set to true', async () => {
      const deleted = await storePipelineService.delete({
        store: seedStore,
        canDeleteAssignedStore: true,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the unused test store with canDeleteAssignedStore set to false', async () => {
      const deleted = await storePipelineService.delete({
        store: seedStore,
        canDeleteAssignedStore: false,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete the test store with canDeleteAssignedStore set to true and when store is assigned to user', async () => {
      const deleted = await storePipelineService.delete({
        store: targetUser.store,
        canDeleteAssignedStore: true,
        requestedByUserId: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(deleted).toBe(true);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw unprocessable entity exception when trying to delete a store assigned to users with canDeleteAssignedStore set to false', async () => {
      await expect(
        storePipelineService.delete({
          store: testUser.store,
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
