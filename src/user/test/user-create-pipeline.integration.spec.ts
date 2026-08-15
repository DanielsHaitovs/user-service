/* eslint-disable @typescript-eslint/no-misused-spread */
import { COUNTRIES } from '@/commonConst/countries.const';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { getTestUserByEmail, getTestUserById } from '@/test/pipeline/user';
import { getAssignedRolesForUser } from '@/test/pipeline/userRole';
import { getAssignedStoresForUser } from '@/test/pipeline/userStore';
import { validateUserResponseDto } from '@/test/validate/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import { AuditProducerService } from '@/user/services/audit.service';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { CreateUserDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserPipelineService (Integration)', () => {
  let userPipelineService: UserPipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let userStorePipelineService: UserStorePipelineService;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let fakeUuid: UUID;
  let auditLogSpy: jest.SpyInstance;
  let auditRoleLogSpy: jest.SpyInstance;
  let auditStoreLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: TestUser;
  let createUserMock: CreateUserDto;

  beforeAll(async () => {
    ({
      moduleFixture,
      testUser,
      systemUserId,
      userPipelineService,
      userRolePipelineService,
      userStorePipelineService,
      cacheGetByIdSpy,
      cacheSetSpy,
      cacheInvalidateByTagsSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
    auditRoleLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendRoleLog');
    auditStoreLogSpy = jest.spyOn(
      AuditProducerService.prototype,
      'sendStoreLog',
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(userPipelineService).toBeDefined();
  });

  describe('Create User', () => {
    describe('Create Simple User', () => {
      it('should perform 3 steps: 1. create a new empty user 2. cache the result 3. send audit log', async () => {
        const user = await userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(0);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);

        await getTestUserById({
          userPipelineService,
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
        createUserMock.email = testUser.user.email;
        await expect(
          userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(0);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await getTestUserByEmail({
          userPipelineService,
          email: testUser.user.email,
          expected: testUser.user,
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
          roleIds: [testUser.role.id],
        };

        const user = await userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(0);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);

        await getAssignedRolesForUser({
          userId: user.id,
          userRolePipelineService,
          expected: [testUser.role],
        });
      });
      it('should throw when trying to create a new user with a role that does not exist', async () => {
        const createDto = {
          ...createUserMock,
          roleIds: [fakeUuid],
        };

        await expect(
          userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(0);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await expect(
          userPipelineService.getByEmailOrThrow({
            email: createUserMock.email,
          }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Create User with Stores', () => {
      it('should perform 3 steps: 1. create a new user with a store 2. cache the result 3. send audit log', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [testUser.store.id],
        };

        const user = await userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(1);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);

        await getAssignedStoresForUser({
          userId: user.id,
          userStorePipelineService,
          expected: [testUser.store],
        });
      });

      it('should throw when trying to create a new user with a store that does not exist', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [fakeUuid],
        };

        await expect(
          userPipelineService.create({
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
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(0);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(0);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);

        await expect(
          userPipelineService.getByEmailOrThrow({
            email: createUserMock.email,
          }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Create User with Roles and Stores', () => {
      it('should perform 3 steps: 1. create a new user with a store and role and 2. cache the result 3. send audit log', async () => {
        const createDto = {
          ...createUserMock,
          storeIds: [testUser.store.id],
          roleIds: [testUser.role.id],
        };

        const user = await userPipelineService.create({
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
        expect(auditLogSpy).toHaveBeenCalledTimes(1);
        expect(auditStoreLogSpy).toHaveBeenCalledTimes(1);
        expect(auditRoleLogSpy).toHaveBeenCalledTimes(1);
        expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);

        await getAssignedStoresForUser({
          userId: user.id,
          userStorePipelineService,
          expected: [testUser.store],
        });

        await getAssignedRolesForUser({
          userId: user.id,
          userRolePipelineService,
          expected: [testUser.role],
        });
      });
    });
  });
});
