/* eslint-disable @typescript-eslint/no-misused-spread */
import { CacheService } from '@/baseServices/cache.service';
import { COUNTRIES } from '@/commonConst/countries.const';
import { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser as createTestUserDB } from '@/test/db/user';
import { assignRoleToUser as assignRoleToUserDB } from '@/test/db/userRole';
import {
  createTestUser,
  getManyUserBy,
  getTestUserByEmail,
  getTestUserById,
} from '@/test/pipeline/user';
import { getAssignedRolesForUser } from '@/test/pipeline/userRole';
import { getAssignedStoresForUser } from '@/test/pipeline/userStore';
import { validateUserResponseDto } from '@/test/validate/user';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { AuditProducerService } from '@/user/services/audit.service';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
import type {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserPipelineService (Integration)', () => {
  let pipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let fakeUuid: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheGetSpy: jest.SpyInstance;
  let testUser: UserResponseDto;
  let testRole: RoleResponseDto;
  let testStore: StoreResponseDto;
  let createUserMock: CreateUserDto;
  let updateUserDto: UpdateUserDto;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService =
      moduleFixture.get<UserPipelineService>(UserPipelineService);
    rolePipelineService =
      moduleFixture.get<RolePipelineService>(RolePipelineService);
    userRolePipelineService = moduleFixture.get<UserRolePipelineService>(
      UserRolePipelineService,
    );
    storePipelineService =
      moduleFixture.get<StorePipelineService>(StorePipelineService);
    userStorePipelineService = moduleFixture.get<UserStorePipelineService>(
      UserStorePipelineService,
    );
    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    cacheGetSpy = jest.spyOn(CacheService.prototype, 'get');
    cacheInvalidateByIdSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateById',
    );
    cacheInvalidateByTagsSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateByTags',
    );
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
      pipelineService,
      createdById: systemUserId,
      cacheSetSpy,
      auditLogSpy,
      cacheInvalidateByTagsSpy,
    });

    createUserMock = {
      isActive: true,
      roleIds: [],
      storeIds: [],
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `${randomUUID()}@example.com`,
      password: faker.internet.password(),
      twoFactorSecret: faker.internet.password(),
      country: COUNTRIES.US,
    };
    fakeUuid = randomUUID();
    updateUserDto = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      country: COUNTRIES.AE,
      email: `${randomUUID()}@example.com`,
      dateOfBirth: new Date(),
      isActive: true,
    };
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Get User', () => {
    describe('Get User By Id', () => {
      it('should retrieve a user by ID and check that cache was already set', async () => {
        const retrievedUser = await pipelineService.getByIdOrThrow({
          id: testUser.id,
        });

        validateUserResponseDto({
          response: retrievedUser,
          expected: testUser,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(0);
        expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      });
      it('should retrieve a user by ID and cache the result', async () => {
        const user = await createTestUserDB(dataSource);

        const retrievedUser = await pipelineService.getByIdOrThrow({
          id: user.id,
        });

        validateUserResponseDto({
          response: retrievedUser,
          expected: user,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(1);
        expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      });

      it('should throw error if user id does not exist', async () => {
        await expect(
          pipelineService.getByIdOrThrow({ id: randomUUID() }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Get User By Email', () => {
      it('should retrieve a user by Email and check that cache was already set', async () => {
        const retrievedUser = await pipelineService.getByEmailOrThrow({
          email: testUser.email,
        });

        validateUserResponseDto({
          response: retrievedUser,
          expected: testUser,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(0);
        expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      });
      it('should retrieve a user by Email and cache the result', async () => {
        const user = await createTestUserDB(dataSource);

        const retrievedUser = await pipelineService.getByEmailOrThrow({
          email: user.email,
        });

        validateUserResponseDto({
          response: retrievedUser,
          expected: user,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(1);
        expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      });

      it('should throw error if user email does not exist', async () => {
        await expect(
          pipelineService.getByEmailOrThrow({ email: '123' }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });
  });

  describe('Create User', () => {
    describe('Create Simple User', () => {
      it('should perform 3 steps: 1. create a new empty user 2. cache the result 3. send audit log', async () => {
        const user = await pipelineService.create({
          createDto: createUserMock,
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        });

        validateUserResponseDto({
          response: user,
          expected: createUserMock,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(2);
        expect(auditLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

        await getTestUserById({
          pipelineService,
          id: user.id,
          expected: createUserMock,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        });
      });

      it('should throw error if user email already exists', async () => {
        createUserMock.email = testUser.email;
        await expect(
          pipelineService.create({
            createDto: createUserMock,
            createdById: systemUserId,
            metadata: {
              ipAddress: faker.internet.ip(),
              userAgent: faker.internet.userAgent(),
            },
          }),
        ).rejects.toThrow(
          new ConflictException(
            `Email "${createUserMock.email}" is already in use by another user.`,
          ),
        );

        expect(cacheSetSpy).toHaveBeenCalledTimes(0);
        expect(auditLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await getTestUserByEmail({
          pipelineService,
          email: testUser.email,
          expected: testUser,
          cache: {
            cacheSetSpy,
            cacheGetByIdSpy,
            setCache: false,
          },
        });
      });
    });

    describe('Create User with Roles', () => {
      it('should perform 3 steps: 1.create a new user with a role 2. cache the result 2. send audit log', async () => {
        const createDto = {
          ...createUserMock,
          roleIds: [testRole.id],
        };

        const user = await pipelineService.create({
          createDto,
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        });

        createUserMock.password = user.password;

        validateUserResponseDto({
          response: user,
          expected: createUserMock,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(2);
        expect(auditLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

        await getAssignedRolesForUser({
          userId: user.id,
          pipelineService: userRolePipelineService,
          expected: [testRole],
        });
      });
      it('should throw when trying to create a new user with a role that does not exist', async () => {
        const createDto = {
          ...createUserMock,
          roleIds: [fakeUuid],
        };

        await expect(
          pipelineService.create({
            createDto,
            createdById: systemUserId,
            metadata: {
              ipAddress: faker.internet.ip(),
              userAgent: faker.internet.userAgent(),
            },
          }),
        ).rejects.toThrow(
          new UnprocessableEntityException(
            `Failed to validate role. The following role ids do not exist: ${fakeUuid}`,
          ),
        );

        expect(cacheSetSpy).toHaveBeenCalledTimes(0);
        expect(auditLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await expect(
          pipelineService.getByEmailOrThrow({ email: createUserMock.email }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Create User with Stores', () => {
      it('should perform 3 steps: 1. create a new user with a store 2. cache the result 3. send audit log', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [testStore.id],
        };

        const user = await pipelineService.create({
          createDto,
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        });

        createUserMock.password = user.password;

        validateUserResponseDto({
          response: user,
          expected: createUserMock,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(2);
        expect(auditLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

        await getAssignedStoresForUser({
          userId: user.id,
          pipelineService: userStorePipelineService,
          expected: [testStore],
        });
      });

      it('should throw when trying to create a new user with a store that does not exist', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [fakeUuid],
        };

        await expect(
          pipelineService.create({
            createDto,
            createdById: systemUserId,
            metadata: {
              ipAddress: faker.internet.ip(),
              userAgent: faker.internet.userAgent(),
            },
          }),
        ).rejects.toThrow(
          new UnprocessableEntityException(
            `Failed to validate store. The following store ids do not exist: ${fakeUuid}`,
          ),
        );

        expect(cacheSetSpy).toHaveBeenCalledTimes(0);
        expect(auditLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await expect(
          pipelineService.getByEmailOrThrow({ email: createUserMock.email }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Create User with Roles and Stores', () => {
      it('should perform 3 steps: 1. create a new user with a store and role and 2. cache the result 3. send audit log', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [testStore.id],
          roleIds: [testRole.id],
        };

        const user = await pipelineService.create({
          createDto,
          createdById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        });

        createUserMock.password = user.password;

        validateUserResponseDto({
          response: user,
          expected: createUserMock,
        });

        expect(cacheSetSpy).toHaveBeenCalledTimes(2);
        expect(auditLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

        await getAssignedStoresForUser({
          userId: user.id,
          pipelineService: userStorePipelineService,
          expected: [testStore],
        });

        await getAssignedRolesForUser({
          userId: user.id,
          pipelineService: userRolePipelineService,
          expected: [testRole],
        });
      });
    });
  });

  describe('Update User', () => {
    it('should update a user, invalidate cache and send audit log', async () => {
      const updated = await pipelineService.update({
        user: testUser,
        data: updateUserDto,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(updated).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await getTestUserById({
        pipelineService,
        id: testUser.id,
        expected: {
          ...testUser,
          ...updateUserDto,
        },
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
    });
    it('should throw error when trying to update user with email that is already present', async () => {
      const conflictUser = await createTestUser({
        pipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
        cacheInvalidateByTagsSpy,
      });

      updateUserDto.email = conflictUser.email;

      await expect(
        pipelineService.update({
          user: testUser,
          data: updateUserDto,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Email "${conflictUser.email}" is already in use by another user.`,
        ),
      );

      expect(auditLogSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });

    it('after unsuccessful update should NOT invalidate existing cache', async () => {
      const conflictUser = await createTestUser({
        pipelineService,
        createdById: systemUserId,
        cacheSetSpy,
        auditLogSpy,
        cacheInvalidateByTagsSpy,
      });

      updateUserDto.email = conflictUser.email;

      await expect(
        pipelineService.update({
          user: testUser,
          data: updateUserDto,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new ConflictException(
          `Email "${conflictUser.email}" is already in use by another user.`,
        ),
      );

      expect(auditLogSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Delete User', () => {
    it('should delete a user with access only to user, invalidate cache and send audit log', async () => {
      const deleted = await pipelineService.delete({
        user: testUser,
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
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          pipelineService,
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
      const deleted = await pipelineService.delete({
        user: testUser,
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
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          pipelineService,
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

      const deleted = await pipelineService.delete({
        user: testUser,
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

      const deleted = await pipelineService.delete({
        user: testUser,
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
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          pipelineService,
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
        pipelineService.delete({
          user: testUser,
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
        pipelineService,
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

      const deleted = await pipelineService.delete({
        user: testUser,
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
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);

      await expect(
        getTestUserById({
          pipelineService,
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
        pipelineService.delete({
          user: testUser,
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
        pipelineService,
        id: testUser.id,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: false,
        },
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when user is updated', async () => {
      const user = await createTestUserDB(dataSource);
      await assignRoleToUserDB({
        dataSource,
        userId: user.id,
        roleId: testRole.id,
      });

      await getManyUserBy({
        pipelineService,
        query: {
          page: 1,
          limit: 10,
          ids: [user.id],
          sortField: 'createdAt',
          sortOrder: 'DESC',
        },
        expected: {
          data: [user],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        cache: {
          cacheSetSpy,
          cacheGetSpy,
          setCache: true,
        },
      });

      await getTestUserById({
        pipelineService,
        id: user.id,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      await getTestUserByEmail({
        pipelineService,
        email: user.email,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      const updated = await pipelineService.update({
        user,
        data: updateUserDto,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      const updatedUser = {
        ...user,
        ...updateUserDto,
      };

      expect(updated).toBe(true);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);

      await getManyUserBy({
        pipelineService,
        query: {
          page: 1,
          limit: 10,
          ids: [user.id],
          sortField: 'createdAt',
          sortOrder: 'DESC',
        },
        expected: {
          data: [user],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        cache: {
          cacheSetSpy,
          cacheGetSpy,
          setCache: true,
        },
      });

      await getTestUserById({
        pipelineService,
        id: updatedUser.id,
        expected: updatedUser,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
      await getTestUserByEmail({
        pipelineService,
        email: updatedUser.email,
        expected: updatedUser,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
    });
  });
});
