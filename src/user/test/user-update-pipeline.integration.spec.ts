/* eslint-disable @typescript-eslint/no-misused-spread */
import { COUNTRIES } from '@/commonConst/countries.const';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { createTestUser, getTestUserById } from '@/test/pipeline/user';
import { AuditProducerService } from '@/user/services/audit.service';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UpdateUserDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import { ConflictException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserPipelineService (Integration)', () => {
  let userPipelineService: UserPipelineService;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: TestUser;
  let updateUserDto: UpdateUserDto;

  beforeAll(async () => {
    ({
      moduleFixture,
      testUser,
      systemUserId,
      userPipelineService,
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

  describe('Update User', () => {
    it('should update a user, invalidate cache and send audit log', async () => {
      const updated = await userPipelineService.update({
        user: testUser.user,
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
        userPipelineService,
        id: testUser.user.id,
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
        userPipelineService,
        createdById: systemUserId,
        cache: {
          cacheSetSpy,
          cacheInvalidateByTagsSpy,
        },
        auditLogSpy,
      });

      updateUserDto.email = conflictUser.email;

      await expect(
        userPipelineService.update({
          user: testUser.user,
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
});
