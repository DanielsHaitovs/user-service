import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { RolePipelineService } from '@/role/role.pipeline';
import type { CreateRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { CreateService } from '@/roleServices/create.service';
import { DeleteService } from '@/roleServices/delete.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { RolePermissionService } from '@/roleServices/permission.service';
import { RoleService } from '@/roleServices/role.service';
import { UpdateService } from '@/roleServices/update.service';
import { Store } from '@/storeEntities/store.entity';
import { SystemIdentityService } from '@/system/identity.service';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import * as pg from 'pg';
import type { Repository } from 'typeorm';

describe('RolePipelineService (Integration)', () => {
  let pipelineService: RolePipelineService;
  let roleRepository: Repository<Roles>;
  let permissionRepository: Repository<Permission>;
  let testRole: RoleResponseDto;

  let mockCacheService: {
    getById: jest.Mock;
    getIdKeyPrefixByAlias: jest.Mock;
    coalesce: jest.Mock;
    set: jest.Mock;
    invalidateById: jest.Mock;
    invalidateByTags: jest.Mock;
  };

  let mockSystemIdentityService: {
    getSystemRoleIds: jest.Mock;
  };

  const mockAdminUserUuid = 'cce557e4-ce3f-4273-954a-371500a3c1e7';

  beforeAll(async () => {
    mockCacheService = {
      getById: jest.fn(),
      getIdKeyPrefixByAlias: jest.fn().mockReturnValue('cache-key-string'),
      coalesce: jest.fn((options: { operation: () => unknown }) =>
        options.operation(),
      ),
      set: jest.fn().mockResolvedValue(undefined),
      invalidateById: jest.fn().mockResolvedValue(undefined),
      invalidateByTags: jest.fn().mockResolvedValue(undefined),
    };

    mockSystemIdentityService = {
      getSystemRoleIds: jest.fn().mockResolvedValue([]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          driver: pg as any,
          host: process.env.DB_HOST ?? 'localhost',
          port: parseInt(process.env.DB_PORT ?? '5432', 10),
          username: process.env.DB_USERNAME ?? 'user',
          password: process.env.DB_PASSWORD ?? 'password',
          database: process.env.DB_NAME ?? 'users',
          entities: [Roles, UserRoles, Store, UserStores, Permission, User],
          synchronize: true,
          logging: ['error'],
        }),
        TypeOrmModule.forFeature([
          Roles,
          UserRoles,
          Store,
          UserStores,
          Permission,
          User,
        ]),
      ],
      providers: [
        RolePipelineService,
        RoleService,
        RolePermissionService,
        CreateService,
        UpdateService,
        DeleteService,
        PermissionHelperService,
        RoleHelperService,
        EntityQueryService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: SystemIdentityService,
          useValue: mockSystemIdentityService,
        },
      ],
    }).compile();

    pipelineService =
      moduleFixture.get<RolePipelineService>(RolePipelineService);

    roleRepository = moduleFixture.get<Repository<Roles>>(
      getRepositoryToken(Roles),
    );
    permissionRepository = moduleFixture.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );

    testRole = (await roleRepository
      .save({
        id: randomUUID(),
        name: 'Test Role',
        createdBy: { id: mockAdminUserUuid },
      })
      .catch(() => {
        return roleRepository.findOne({
          where: { name: 'Test Role' },
        });
      })) as RoleResponseDto;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    roleRepository.createQueryBuilder();
    permissionRepository.createQueryBuilder();
  });

  describe('Create Pipeline Integration', () => {
    it('should write a new role record to the database and sync the metadata cache layer', async () => {
      const role = randomUUID();

      const createDto: CreateRoleDto = {
        name: role,
      };

      const result = await pipelineService.create({
        createDto,
        createdById: mockAdminUserUuid,
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe(role);
      expect(result.permissions).toHaveLength(0);

      const savedDbRecord = await roleRepository.findOne({
        where: { id: result.id },
        relations: ['permissions', 'createdBy'],
      });

      expect(savedDbRecord).toBeDefined();
      expect(savedDbRecord?.name).toBe(role);
      expect(savedDbRecord?.createdBy.id).toBe(mockAdminUserUuid);

      expect(mockCacheService.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('GetById Pipeline Integration', () => {
    it('should retrieve the test role by its ID', async () => {
      const result = await pipelineService.getByIdOrThrow(testRole.id);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(testRole.name);

      const savedDbRecord = await roleRepository.findOne({
        where: { id: result.id },
        relations: ['permissions', 'createdBy'],
      });

      expect(savedDbRecord).toBeDefined();
      expect(savedDbRecord?.name).toBe(testRole.name);
      expect(savedDbRecord?.createdBy.id).toBe(mockAdminUserUuid);

      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPermissionsOrThrow Pipeline Integration', () => {
    it('should retrieve the test role with permissions by its ID', async () => {
      const result = await pipelineService.getPermissionsOrThrow(testRole.id);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(testRole.name);
      expect(result.permissions).toBeDefined();

      const savedDbRecord = await roleRepository.findOne({
        where: { id: result.id },
        relations: ['permissions', 'createdBy'],
      });

      expect(savedDbRecord).toBeDefined();
      expect(savedDbRecord?.name).toBe(testRole.name);
      expect(savedDbRecord?.createdBy.id).toBe(mockAdminUserUuid);

      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
    });
  });
  //   describe('Update Pipeline Integration', () => {
  //     it('should execute identity mutations and correctly trigger downstream cache invalidation sweeps', async () => {
  //       const activeRole = await roleRepository.save(
  //         Object.assign(new Roles(), {
  //           name: 'Support Tier 1',
  //           createdBy: { id: mockAdminUserUuid },
  //         }),
  //       );

  //       const updateDto: UpdateRoleDto = { name: 'Support Tier 2' };

  //       const isSuccessful = await pipelineService.update({
  //         updateDto,
  //         id: activeRole.id,
  //       });

  //       expect(isSuccessful).toBe(true);

  //       const modifiedRecord = await roleRepository.findOne({
  //         where: { id: activeRole.id },
  //       });
  //       expect(modifiedRecord?.name).toBe('Support Tier 2');

  //       expect(mockCacheService.invalidateById).toHaveBeenCalledWith({
  //         id: activeRole.id,
  //         alias: 'role',
  //       });
  //     });
  //   });

  //   describe('Delete Pipeline Integration', () => {
  //     it('should completely purge target records and trigger complete multi-alias cache eviction strategies', async () => {
  //       const targetRole = await roleRepository.save(
  //         Object.assign(new Roles(), {
  //           name: 'Temporary Contractor',
  //           createdBy: { id: mockAdminUserUuid },
  //         }),
  //       );

  //       const isDeleted = await pipelineService.delete({
  //         id: targetRole.id,
  //         canDeleteAssignedRole: false,
  //       });

  //       expect(isDeleted).toBe(true);

  //       const missingCheck = await roleRepository.findOne({
  //         where: { id: targetRole.id },
  //       });
  //       expect(missingCheck).toBeNull();

  //       expect(mockCacheService.invalidateByTags).toHaveBeenCalledWith(
  //         expect.objectContaining({ alias: 'role' }),
  //       );
  //       expect(mockCacheService.invalidateById).toHaveBeenCalledWith({
  //         id: targetRole.id,
  //         alias: 'role_permission',
  //       });
  //     });
  //   });
});
