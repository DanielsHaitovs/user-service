import { CacheService } from '@/baseServices/cache.service';
import type { UserWithStores } from '@/common/pipes/userStores.pipe';
import type { Store } from '@/storeEntities/store.entity';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestStore } from '@/test/db/store';
import { createTestUser } from '@/test/db/user';
import { assignStoreToUser } from '@/test/db/userStore';
import {
  assignTestStoreToUser,
  getAssignedStoresForUser,
} from '@/test/pipeline/userStore';
import { validateStoreResponseDto } from '@/test/validate/store';
import { AuditProducerService } from '@/user/services/audit.service';
import { UserStorePipelineService } from '@/user/store.pipeline';
import type { User } from '@/userEntities/user.entity';
import { faker } from '@faker-js/faker';
import { UnprocessableEntityException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserStorePipelineService (Integration)', () => {
  let pipelineService: UserStorePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: User;
  let testStore: Store;
  let userWithStores: UserWithStores;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService = moduleFixture.get<UserStorePipelineService>(
      UserStorePipelineService,
    );
    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendStoreLog');
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheInvalidateByIdSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateById',
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser(dataSource);
    testStore = await createTestStore({
      dataSource,
      overrides: { createdBy: { id: systemUserId } as User },
    });
    userWithStores = {
      user: await createTestUser(dataSource),
      stores: [
        await createTestStore({
          dataSource,
          overrides: { createdBy: { id: systemUserId } as User },
        }),
      ],
    };
    await assignTestStoreToUser({
      pipelineService,
      data: {
        storeIds: userWithStores.stores.map((store) => store.id),
      },
      userStores: { user: userWithStores.user, stores: [] },
      assignedById: systemUserId,
      cacheInvalidateByIdSpy,
      cacheGetByIdSpy,
      cacheSetSpy,
      auditLogSpy,
    });
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Assign Store to user', () => {
    it('should assign a store to a user', async () => {
      await pipelineService.assignStoresToUser({
        data: { storeIds: [testStore.id] },
        userStores: { user: testUser, stores: [] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [testStore],
      });
    });
    it('should assign many stores to a user', async () => {
      const store = await createTestStore({
        dataSource,
        overrides: { createdBy: { id: systemUserId } as User },
      });

      await pipelineService.assignStoresToUser({
        data: { storeIds: [testStore.id, store.id] },
        userStores: { user: testUser, stores: [] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [testStore, store],
      });
    });
    it('should assign new store to a user that is already assigned to store', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: userWithStores.stores,
      });

      const store = await createTestStore({
        dataSource,
        overrides: { createdBy: { id: systemUserId } as User },
      });

      await pipelineService.assignStoresToUser({
        data: { storeIds: [store.id] },
        userStores: userWithStores,
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      stores.push(store);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: stores,
      });
    });
    it('should not assign the same store twice', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await pipelineService.assignStoresToUser({
        data: { storeIds: stores.map((store) => store.id) },
        userStores: userWithStores,
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: stores,
      });
    });
    it('should throw error if the storeIds array is empty', async () => {
      await expect(
        pipelineService.assignStoresToUser({
          data: { storeIds: [] },
          userStores: { user: testUser, stores: [] },
          assignedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('No store ids provided.'),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should throw error if the provided storeIds does not exist', async () => {
      const nonExistentStoreId = randomUUID();

      await expect(
        pipelineService.assignStoresToUser({
          data: { storeIds: [testStore.id, nonExistentStoreId] },
          userStores: { user: testUser, stores: [] },
          assignedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate store. The following store ids do not exist: ${nonExistentStoreId}`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [],
      });
    });
  });

  describe('Unassign Store from user', () => {
    it('should unassign a store from a user', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await pipelineService.unassignStoresFromUser({
        data: { storeIds: stores.map((store) => store.id) },
        userStores: userWithStores,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should unassign many stores from a user', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await assignTestStoreToUser({
        pipelineService,
        data: { storeIds: [testStore.id] },
        userStores: { user: userWithStores.user, stores },
        assignedById: systemUserId,
        cacheInvalidateByIdSpy,
        cacheGetByIdSpy,
        cacheSetSpy,
        auditLogSpy,
      });

      stores.push(testStore);

      await pipelineService.unassignStoresFromUser({
        data: { storeIds: stores.map((store) => store.id) },
        userStores: { user: userWithStores.user, stores },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should unassign 1 out of many stores to which user is assigned ', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await assignTestStoreToUser({
        pipelineService,
        data: { storeIds: [testStore.id] },
        userStores: { user: userWithStores.user, stores },
        assignedById: systemUserId,
        cacheInvalidateByIdSpy,
        cacheGetByIdSpy,
        cacheSetSpy,
        auditLogSpy,
      });

      await pipelineService.unassignStoresFromUser({
        data: { storeIds: stores.map((store) => store.id) },
        userStores: { user: userWithStores.user, stores },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [testStore],
      });
    });

    it('should not unassign a store that is not assigned to the user', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await pipelineService.unassignStoresFromUser({
        data: { storeIds: [testStore.id] },
        userStores: userWithStores,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: stores,
      });
    });

    it('should throw error if the storeIds array is empty', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await expect(
        pipelineService.unassignStoresFromUser({
          data: { storeIds: [] },
          userStores: userWithStores,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('No store ids provided.'),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: stores,
      });
    });
    it('should throw error if the provided storeIds does not exist', async () => {
      const nonExistentStoreId = randomUUID();
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      await expect(
        pipelineService.unassignStoresFromUser({
          data: { storeIds: [nonExistentStoreId] },
          userStores: userWithStores,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate store. The following store ids do not exist: ${nonExistentStoreId}`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedStoresForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: stores,
      });
    });
  });

  describe('Get Assigned Stores to user', () => {
    it('should get stores for a user', async () => {
      const {
        user: { id: userId },
        stores,
      } = userWithStores;

      const userStores = await pipelineService.getAssignedStores(userId);

      expect(userStores).toBeDefined();
      expect(userStores.length).toBe(1);

      userStores.forEach((store) => {
        validateStoreResponseDto({
          response: store,
          expected: stores[0],
        });
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should get stores for a user and store it in cache', async () => {
      await assignStoreToUser({
        dataSource,
        userId: testUser.id,
        storeId: testStore.id,
      });

      const userStores = await pipelineService.getAssignedStores(testUser.id);

      expect(userStores).toBeDefined();
      expect(userStores.length).toBe(1);

      for (const store of userStores) {
        validateStoreResponseDto({
          response: store,
          expected: testStore,
        });
      }

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should get stores for a user that is not assigned to any store and store it in cache', async () => {
      const userStores = await pipelineService.getAssignedStores(testUser.id);

      expect(userStores).toBeDefined();
      expect(userStores.length).toBe(0);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });
});
