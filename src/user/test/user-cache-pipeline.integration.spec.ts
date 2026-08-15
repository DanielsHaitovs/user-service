/* eslint-disable @typescript-eslint/no-misused-spread */
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser as createTestUserDB } from '@/test/db/user';
import {
  getManyUserBy,
  getTestUserByEmail,
  getTestUserById,
} from '@/test/pipeline/user';
import { AuditProducerService } from '@/user/services/audit.service';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UpdateUserDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

import { COUNTRIES } from '../../common/const/countries.const';

describe('UserPipelineService (Integration)', () => {
  let userPipelineService: UserPipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheGetSpy: jest.SpyInstance;
  let updateUserDto: UpdateUserDto;

  beforeAll(async () => {
    ({
      dataSource,
      moduleFixture,
      systemUserId,
      userPipelineService,
      cacheGetSpy,
      cacheGetByIdSpy,
      cacheSetSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(userPipelineService).toBeDefined();
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when user is updated', async () => {
      const user = await createTestUserDB({ dataSource });
      await getManyUserBy({
        userPipelineService,
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
        userPipelineService,
        id: user.id,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      await getTestUserByEmail({
        userPipelineService,
        email: user.email,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      const updated = await userPipelineService.update({
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
        userPipelineService,
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
        userPipelineService,
        id: updatedUser.id,
        expected: updatedUser,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
      await getTestUserByEmail({
        userPipelineService,
        email: updatedUser.email,
        expected: updatedUser,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
    });
    it('should invalidate cache when user is deleted', async () => {
      const user = await createTestUserDB({ dataSource });

      await getManyUserBy({
        userPipelineService,
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
        userPipelineService,
        id: user.id,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      await getTestUserByEmail({
        userPipelineService,
        email: user.email,
        expected: user,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });

      const updated = await userPipelineService.update({
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
        userPipelineService,
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
        userPipelineService,
        id: updatedUser.id,
        expected: updatedUser,
        cache: {
          cacheSetSpy,
          cacheGetByIdSpy,
          setCache: true,
        },
      });
      await getTestUserByEmail({
        userPipelineService,
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
