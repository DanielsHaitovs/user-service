import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser as createTestUserDB } from '@/test/db/user';
import { createTestUser } from '@/test/pipeline/user';
import { validateUserResponseDto } from '@/test/validate/user';
import { AuditProducerService } from '@/user/services/audit.service';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserPipelineService (Integration)', () => {
  let userPipelineService: UserPipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: UserResponseDto;

  beforeAll(async () => {
    ({
      dataSource,
      moduleFixture,
      systemUserId,
      userPipelineService,
      cacheGetByIdSpy,
      cacheSetSpy,
      cacheInvalidateByTagsSpy,
    } = await bootstrapTestApp());

    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
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

  describe('Get User', () => {
    describe('Get User By Id', () => {
      it('should retrieve a user by ID and check that cache was already set', async () => {
        const retrievedUser = await userPipelineService.getByIdOrThrow({
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
        const user = await createTestUserDB({ dataSource });

        const retrievedUser = await userPipelineService.getByIdOrThrow({
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
          userPipelineService.getByIdOrThrow({ id: randomUUID() }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });

    describe('Get User By Email', () => {
      it('should retrieve a user by Email and check that cache was already set', async () => {
        const retrievedUser = await userPipelineService.getByEmailOrThrow({
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
        const user = await createTestUserDB({ dataSource });

        const retrievedUser = await userPipelineService.getByEmailOrThrow({
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
          userPipelineService.getByEmailOrThrow({ email: '123' }),
        ).rejects.toThrow(/Could not find any entity of type "User"/);
      });
    });
  });
});
