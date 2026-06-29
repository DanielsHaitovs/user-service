import { CacheService } from '@/baseServices/cache.service';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestUser } from '@/test/pipeline/user';
import { validateUserResponseDto } from '@/test/validate/user';
import { AuditProducerService } from '@/user/services/audit.service';
import { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserPipelineService (Integration)', () => {
  let pipelineService: UserPipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  // let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: UserResponseDto;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService =
      moduleFixture.get<UserPipelineService>(UserPipelineService);
    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendLog');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser({
      pipelineService,
      createdById: systemUserId,
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

  describe('Get User By ID', () => {
    it('should retrieve a user by ID and cache the result', async () => {
      const retrievedUser = await pipelineService.getByIdOrThrow(testUser.id);

      validateUserResponseDto({
        response: retrievedUser,
        expected: testUser,
      });

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Get User By Email', () => {
    it('should retrieve a user by Email and cache the result', async () => {
      const retrievedUser = await pipelineService.getByEmailOrThrow(
        testUser.email,
      );

      validateUserResponseDto({
        response: retrievedUser,
        expected: testUser,
      });

      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });
});
