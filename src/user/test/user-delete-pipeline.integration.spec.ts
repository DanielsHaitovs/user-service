import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser, getTestUserById } from '@/test/pipeline/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import { AuditProducerService } from '@/user/services/audit.service';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import { UnprocessableEntityException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserPipelineService (Integration)', () => {
  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: UserResponseDto;
  let testRole: RoleResponseDto;
  let testStore: StoreResponseDto;

  beforeAll(async () => {
    ({
      dataSource,
      moduleFixture,
      systemUserId,
      userPipelineService,
      userRolePipelineService,
      userStorePipelineService,
      storePipelineService,
      rolePipelineService,
      cacheGetByIdSpy,
      cacheSetSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
    testRole = await rolePipelineService.create({
      createDto: {
        name: randomUUID(),
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    });
    testStore = await storePipelineService.create({
      createDto: {
        name: randomUUID(),
        code: randomUUID(),
        viewCode: randomUUID(),
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await createTestUser({
      userPipelineService,
      createdById: systemUserId,
      cache: {
        cacheSetSpy,
        cacheInvalidateByTagsSpy,
      },
      auditLogSpy,
    });
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(userPipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Delete User', () => {
    it('should delete a user with access only to user, invalidate cache and send audit log', async () => {
      const deleted = await userPipelineService.delete({
        data: { user: testUser, roles: [], stores: [] },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        canRemoveFromRelatedRoles: false,
        canRemoveFromRelatedStores: false,
      });

      expect(deleted).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(5);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          userPipelineService,
          id: testUser.id,
          expected: testUser,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        }),
      ).rejects.toThrow(/Could not find any entity of type "User"/);
    });
    it('should delete a user with root access, invalidate cache and send audit log', async () => {
      const deleted = await userPipelineService.delete({
        data: { user: testUser, roles: [], stores: [] },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        canRemoveFromRelatedRoles: true,
        canRemoveFromRelatedStores: true,
      });

      expect(deleted).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(5);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          userPipelineService,
          id: testUser.id,
          expected: testUser,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        }),
      ).rejects.toThrow(/Could not find any entity of type "User"/);
    });
    it('should return false when trying to delete user that does not exist', async () => {
      testUser.id = randomUUID();

      const deleted = await userPipelineService.delete({
        data: { user: testUser, roles: [], stores: [] },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        canRemoveFromRelatedRoles: true,
        canRemoveFromRelatedStores: true,
      });

      expect(deleted).toBe(false);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });
    it('should delete user that is assigned to a role with canRemoveFromRelatedRoles set to true', async () => {
      await userRolePipelineService.assignRolesToUser({
        userRoles: { user: testUser, roles: [] },
        data: { roleIds: [testRole.id] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      auditLogSpy.mockClear();
      cacheSetSpy.mockClear();

      const deleted = await userPipelineService.delete({
        data: { user: testUser, roles: [testRole], stores: [] },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        canRemoveFromRelatedRoles: true,
        canRemoveFromRelatedStores: false,
      });

      expect(deleted).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(5);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          userPipelineService,
          id: testUser.id,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        }),
      ).rejects.toThrow(/Could not find any entity of type "User"/);
    });
    it('should throw when trying to delete user that is assigned to a role with canRemoveFromRelatedRoles set to false', async () => {
      await userRolePipelineService.assignRolesToUser({
        userRoles: { user: testUser, roles: [] },
        data: { roleIds: [testRole.id] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      auditLogSpy.mockClear();
      cacheSetSpy.mockClear();

      await expect(
        userPipelineService.delete({
          data: { user: testUser, roles: [testRole], stores: [] },
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          canRemoveFromRelatedRoles: false,
          canRemoveFromRelatedStores: false,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to roles. Please unassign the user from their roles before deletion.',
        ),
      );

      expect(auditLogSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

      await getTestUserById({
        userPipelineService,
        id: testUser.id,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: false,
        },
      });
    });
    it('should delete user that is assigned to a store with canRemoveFromRelatedStores set to true', async () => {
      await userStorePipelineService.assignStoresToUser({
        userStores: { user: testUser, stores: [] },
        data: { storeIds: [testStore.id] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      auditLogSpy.mockClear();
      cacheSetSpy.mockClear();

      const deleted = await userPipelineService.delete({
        data: { user: testUser, roles: [], stores: [testStore] },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        canRemoveFromRelatedRoles: false,
        canRemoveFromRelatedStores: true,
      });

      expect(deleted).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(5);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          userPipelineService,
          id: testUser.id,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        }),
      ).rejects.toThrow(/Could not find any entity of type "User"/);
    });
    it('should throw when trying to delete user that is assigned to a store with canRemoveFromRelatedStores set to false', async () => {
      await userStorePipelineService.assignStoresToUser({
        userStores: { user: testUser, stores: [] },
        data: { storeIds: [testStore.id] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      auditLogSpy.mockClear();
      cacheSetSpy.mockClear();

      await expect(
        userPipelineService.delete({
          data: { user: testUser, roles: [], stores: [testStore] },
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
          canRemoveFromRelatedRoles: false,
          canRemoveFromRelatedStores: false,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to stores. Please unassign the user from their stores before deletion.',
        ),
      );

      expect(auditLogSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

      await getTestUserById({
        userPipelineService,
        id: testUser.id,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: false,
        },
      });
    });
  });
});
