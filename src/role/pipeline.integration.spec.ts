import { CacheService } from '@/baseServices/cache.service';
import { RolePipelineService } from '@/role/role.pipeline';
import { Roles } from '@/roleEntities/role.entity';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestPermissions } from '@/test/helper/permission';
import {
  createTestRole,
  createTestRoleWithPermissions,
  getTestRoleById,
  getTestRoleWithPermissionsById,
} from '@/test/helper/role';
import type { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource, Repository } from 'typeorm';

describe('RolePipelineService (Integration)', () => {
  let pipelineService: RolePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let cacheSetSpy: jest.SpyInstance;
  let roleRepository: Repository<Roles>;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService =
      moduleFixture.get<RolePipelineService>(RolePipelineService);
    roleRepository = dataSource.getRepository(Roles);
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Should retrieve role with permissions -> RolePipelineService -> getByIdOrThrow()', () => {
    it('should retrieve the test role by its ID', async () => {
      const createdRole = await createTestRole(dataSource, {
        createdBy: { id: systemUserId } as User,
      });

      const result = await pipelineService.getByIdOrThrow(createdRole.id);

      expect(result.id).toBeDefined();
      expect(result.id).toBe(createdRole.id);
      expect(result.name).toBe(createdRole.name);

      const savedDbRecord = await roleRepository.findOne({
        where: { id: result.id },
        relations: ['createdBy'],
      });

      expect(savedDbRecord).toBeDefined();
      expect(savedDbRecord?.name).toBe(createdRole.name);
      expect(savedDbRecord?.createdBy.id).toBe(systemUserId);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw EntityNotFoundError when looking up a missing role', async () => {
      await expect(
        pipelineService.getByIdOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);
    });
  });

  describe('Should retrieve role with permissions -> RolePipelineService -> getPermissionsOrThrow()', () => {
    it('should retrieve the test role by its ID with its permissions', async () => {
      const createdRole = await createTestRoleWithPermissions({
        dataSource,
        role: { createdBy: { id: systemUserId } as User },
        permissions: [
          { createdBy: { id: systemUserId } as User },
          { createdBy: { id: systemUserId } as User },
        ],
      });

      const createdMap = new Map(
        createdRole.permissions.map((p) => [p.id, p.name]),
      );

      const result = await pipelineService.getPermissionsOrThrow(
        createdRole.id,
      );

      expect(result.id).toBeDefined();
      expect(result.id).toBe(createdRole.id);
      expect(result.name).toBe(createdRole.name);
      expect(result.permissions).toHaveLength(createdRole.permissions.length);

      for (const permission of result.permissions) {
        expect(createdMap.has(permission.id)).toBe(true);
        expect(createdMap.get(permission.id)).toBe(permission.name);
      }

      const savedDbRecord = await roleRepository.findOne({
        where: { id: result.id },
        relations: ['createdBy', 'permissions'],
      });

      expect(savedDbRecord).toBeDefined();
      expect(savedDbRecord?.name).toBe(createdRole.name);
      expect(savedDbRecord?.createdBy.id).toBe(systemUserId);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw EntityNotFoundError when looking up a missing role', async () => {
      await expect(
        pipelineService.getPermissionsOrThrow(randomUUID()),
      ).rejects.toThrow(/Could not find any entity of type "Roles"/);
    });
  });

  describe('Should create role -> RolePipelineService -> getPermissionsOrThrow()', () => {
    it('should create role without permissions', async () => {
      const createdRole = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
        },
        createdById: systemUserId,
      });

      await getTestRoleById({
        dataSource,
        id: createdRole.id,
        name: createdRole.name,
        createdById: systemUserId,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should create role with permissions', async () => {
      const permissions = await createTestPermissions({
        dataSource,
        permissions: [
          { createdBy: { id: systemUserId } as User },
          { createdBy: { id: systemUserId } as User },
        ],
      });

      const createdRole = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
          permissions: permissions.map((p) => p.code),
        },
        createdById: systemUserId,
      });

      await getTestRoleWithPermissionsById({
        dataSource,
        id: createdRole.id,
        name: createdRole.name,
        createdById: systemUserId,
        permissinos: permissions,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw Conflifct when trying to save role with the same name', async () => {
      const roleName = `Test Role ${randomUUID()}`;
      await pipelineService.create({
        createDto: {
          name: roleName,
        },
        createdById: systemUserId,
      });

      await expect(
        pipelineService.create({
          createDto: {
            name: roleName,
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(
        new ConflictException(
          `A role with the name "${roleName}" already exists.`,
        ),
      );
    });

    it('should not assign all permissions if empty permission property is present as empty array', async () => {
      const createdRole = await pipelineService.create({
        createDto: {
          name: `Test Role ${randomUUID()}`,
          permissions: [],
        },
        createdById: systemUserId,
      });

      await getTestRoleWithPermissionsById({
        dataSource,
        id: createdRole.id,
        name: createdRole.name,
        createdById: systemUserId,
        permissinos: [],
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw UnprocessableEntityException when trying to save role with non-existing permission codes', async () => {
      await expect(
        pipelineService.create({
          createDto: {
            name: `Test Role ${randomUUID()}`,
            permissions: [
              'NON_EXISTING_PERMISSION_CODE_1',
              'NON_EXISTING_PERMISSION_CODE_2',
            ],
          },
          createdById: systemUserId,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'The following permission codes do not exist: NON_EXISTING_PERMISSION_CODE_1, NON_EXISTING_PERMISSION_CODE_2',
        ),
      );
    });
  });
});
