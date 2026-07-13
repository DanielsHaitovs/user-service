import { CacheService } from '@/baseServices/cache.service';
import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { COUNTRIES } from '@/commonConst/countries.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import { RolePipelineService } from '@/role/role.pipeline';
import { StorePipelineService } from '@/store/store.pipeline';
import { SystemIdentityService } from '@/system/identity.service';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
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
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  cacheGetSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  countries: typeof COUNTRIES;
}

export async function bootstrapTestApp(): Promise<BootstrappedApp> {
  process.env.USER_DATABASE_HOST = 'localhost';
  process.env.JWT_SECRET = 'your_jwt_secret';
  process.env.NODE_ENV = Environment.Test;
  process.env.REDIS_HOST = 'localhost';

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

  return {
    app,
    moduleFixture,
    dataSource,
    systemUserId,
    systemPermissions,
    envConfigService,
    rolePipelineService,
    permissionPipelineService,
    storePipelineService,
    userRolePipelineService,
    userStorePipelineService,
    userPipelineService,
    cacheGetByIdSpy,
    cacheSetSpy,
    cacheGetSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    countries: COUNTRIES,
  };
}
