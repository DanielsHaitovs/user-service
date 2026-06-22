import { CacheService } from '@/baseServices/cache.service';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestPermissions } from '@/test/db/permission';
import { validatePermissionResponseDto } from '@/test/validate/permission';
import type { User } from '@/userEntities/user.entity';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('PermissionPipelineService (Integration)', () => {
  let pipelineService: PermissionPipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let cacheSetSpy: jest.SpyInstance;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService = moduleFixture.get<PermissionPipelineService>(
      PermissionPipelineService,
    );
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Should retrieve permission by id -> PermissionPipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test permission by its ID', async () => {
      const [expected] = await createTestPermissions({
        dataSource,
        permissions: [
          {
            createdBy: { id: systemUserId } as User,
          },
        ],
      });

      if (!expected) {
        throw new Error(
          'Failed to create test permission. The expected permission is undefined.',
        );
      }

      validatePermissionResponseDto({
        response: await pipelineService.getByIdOrThrow(expected.id),
        expected,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing permission', async () => {
      await expect(
        pipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Permission"/);

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Should retrieve permission by code -> PermissionPipelineService -> getByCodeOrThrow()', () => {
    it('should retrieve the test permission by its code', async () => {
      const [expected] = await createTestPermissions({
        dataSource,
        permissions: [
          {
            createdBy: { id: systemUserId } as User,
          },
        ],
      });

      if (!expected) {
        throw new Error(
          'Failed to create test permission. The expected permission is undefined.',
        );
      }

      validatePermissionResponseDto({
        response: await pipelineService.getByCodeOrThrow(expected.code),
        expected,
      });
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw EntityNotFoundError when looking up a missing permission', async () => {
      await expect(
        pipelineService.getByCodeOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Permission"/);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });
  });
});
