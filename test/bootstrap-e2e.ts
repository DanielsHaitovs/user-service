import { CacheService } from '@/baseServices/cache.service';
import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { COUNTRIES } from '@/commonConst/countries.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import { SystemIdentityService } from '@/system/identity.service';
import { loginTestUser } from '@/test/e2e/auth';
import { initTestUser } from '@/test/pipeline/user';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import { DataSource } from 'typeorm';

export interface TestUser {
  user: UserResponseDto;
  role: RoleResponseDto;
  store: StoreResponseDto;
}

export interface BootstrappedApp {
  app: INestApplication;
  moduleFixture: TestingModule;
  dataSource: DataSource;
  systemUserId: UUID;
  systemPermissions: string[];
  envConfigService: EnvConfigService;
  rolePipelineService: RolePipelineService;
  permissionPipelineService: PermissionPipelineService;
  storePipelineService: StorePipelineService;
  userRolePipelineService: UserRolePipelineService;
  userStorePipelineService: UserStorePipelineService;
  userPipelineService: UserPipelineService;
  cacheService: CacheService;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  cacheGetSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
  countries: typeof COUNTRIES;
  rootUser: TestUser;
  testUser: TestUser;
  targetUser: TestUser;
  testUserPassword: string;
  authorizedRootHeader: Record<string, string>;
  authorizedHeader: Record<string, string>;
}

export async function bootstrapTestApp(): Promise<BootstrappedApp> {
  process.env.USER_DATABASE_HOST = 'localhost';
  process.env.JWT_SECRET = 'your_jwt_secret';
  process.env.NODE_ENV = Environment.Test;
  process.env.REDIS_HOST = 'localhost';
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  process.env.USER_PASSWORD_SALT_ROUNDS = '1';

  const { AppModule } = await import('../src/app.module');

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new EntityNotFoundFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const dataSource = app.get(DataSource);
  const envConfigService = app.get(EnvConfigService);
  const systemService = app.get(SystemIdentityService);
  const cacheService = app.get(CacheService);

  // if (dataSource.isInitialized) {
  //   await dataSource.synchronize(true);
  // }

  const systemUserId = systemService.getSystemUserId();
  const systemPermissions = systemService.getPermissionsForSystemRoles();

  const rolePipelineService =
    moduleFixture.get<RolePipelineService>(RolePipelineService);
  const permissionPipelineService =
    moduleFixture.get<PermissionPipelineService>(PermissionPipelineService);
  const storePipelineService =
    moduleFixture.get<StorePipelineService>(StorePipelineService);
  const userRolePipelineService = moduleFixture.get<UserRolePipelineService>(
    UserRolePipelineService,
  );
  const userStorePipelineService = moduleFixture.get<UserStorePipelineService>(
    UserStorePipelineService,
  );
  const userPipelineService =
    moduleFixture.get<UserPipelineService>(UserPipelineService);

  const cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
  const cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
  const cacheGetSpy = jest.spyOn(CacheService.prototype, 'get');
  const cacheInvalidateByIdSpy = jest.spyOn(
    CacheService.prototype,
    'invalidateById',
  );
  const cacheInvalidateByTagsSpy = jest.spyOn(
    CacheService.prototype,
    'invalidateByTags',
  );
  const cacheInvalidateByKeyPatternSpy = jest.spyOn(
    CacheService.prototype,
    'invalidateByKeyPattern',
  );

  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  const testUserPassword = 'TestPassword123!';
  const rootUser = await initTestUser({
    userPipelineService,
    rolePipelineService,
    userRolePipelineService,
    storePipelineService,
    userStorePipelineService,
    overrides: {
      password: testUserPassword,
      isActive: true,
    },
    systemPermissions: ['root_admin'],
    systemUserId,
    cacheSetSpy,
    cacheGetByIdSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    cacheInvalidateByKeyPatternSpy,
  });

  const listOfNonRootSystemPermissions = systemPermissions.filter(
    (p) => p !== 'root_admin',
  );

  const testUser = await initTestUser({
    userPipelineService,
    rolePipelineService,
    userRolePipelineService,
    storePipelineService,
    userStorePipelineService,
    overrides: {
      password: testUserPassword,
      isActive: true,
    },
    systemPermissions: listOfNonRootSystemPermissions,
    systemUserId,
    cacheSetSpy,
    cacheGetByIdSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    cacheInvalidateByKeyPatternSpy,
  });

  const targetUser = await initTestUser({
    userPipelineService,
    rolePipelineService,
    userRolePipelineService,
    storePipelineService,
    userStorePipelineService,
    overrides: {
      password: testUserPassword,
      isActive: true,
    },
    systemPermissions: listOfNonRootSystemPermissions,
    systemUserId,
    cacheSetSpy,
    cacheGetByIdSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    cacheInvalidateByKeyPatternSpy,
  });

  return {
    app,
    moduleFixture,
    dataSource,
    systemUserId,
    envConfigService,
    rolePipelineService,
    permissionPipelineService,
    storePipelineService,
    userRolePipelineService,
    userStorePipelineService,
    userPipelineService,
    cacheService,
    cacheGetByIdSpy,
    cacheSetSpy,
    cacheGetSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    cacheInvalidateByKeyPatternSpy,
    countries: COUNTRIES,
    rootUser,
    testUser,
    targetUser,
    testUserPassword,
    authorizedRootHeader: await loginTestUser({
      app,
      email: rootUser.user.email,
      password: testUserPassword,
      cacheSetSpy,
      cacheGetByIdSpy,
    }),
    authorizedHeader: await loginTestUser({
      app,
      email: testUser.user.email,
      password: testUserPassword,
      cacheSetSpy,
      cacheGetByIdSpy,
    }),
    systemPermissions: listOfNonRootSystemPermissions,
  };
}
