/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import type { Permission } from '@/permissionEntities/permissions.entity';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import { READ_PERMISSION_ENDPOINT_PERMISSION } from '@/system/const/permission.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestPermissions } from '@/test/db/permission';
import { loginTestUser } from '@/test/e2e/auth';
import { unAssignPermissionFromRole } from '@/test/pipeline/rolePermissions';
import { initTestUser } from '@/test/pipeline/user';
import { validatePermissionResponseDto } from '@/test/validate/permission';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import type { User } from '@/userEntities/user.entity';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('PermissionController (e2e)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let authorizedHeader: Record<string, string>;
  let authorizedRootHeader: Record<string, string>;
  let systemUserId: UUID;
  let systemPermissions: string[];
  let cacheSetSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
  let permission: Permission;
  let permission2: Permission;
  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;
  const testUserPassword = 'TestPassword123!';
  let testUser: UserResponseDto;
  let rootUser: UserResponseDto;
  let testRole: RoleResponseDto;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      dataSource,
      moduleFixture,
      systemUserId,
      systemPermissions,
      cacheSetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
      userPipelineService,
      rolePipelineService,
      userRolePipelineService,
      storePipelineService,
      userStorePipelineService,
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;
    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    const permissions = await createTestPermissions({
      dataSource,
      permissions: [
        { createdBy: { id: systemUserId } as User },
        { createdBy: { id: systemUserId } as User },
      ],
    });

    if (permissions[0] === undefined || permissions[1] === undefined) {
      throw new Error(
        'Expected at least two permissions to be created for the test, but received fewer.',
      );
    }

    permission = permissions[0];
    permission2 = permissions[1];

    const { user } = await initTestUser({
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

    rootUser = user;

    authorizedRootHeader = await loginTestUser({
      app,
      email: rootUser.email,
      password: testUserPassword,
      cacheSetSpy,
      cacheGetByIdSpy,
    });

    systemPermissions = systemPermissions.filter(
      (permission) => permission !== 'root_admin',
    );

    cacheSetSpy.mockClear();
    cacheGetByIdSpy.mockClear();
  });

  beforeEach(async () => {
    const { user, role } = await initTestUser({
      userPipelineService,
      rolePipelineService,
      userRolePipelineService,
      storePipelineService,
      userStorePipelineService,
      overrides: {
        password: testUserPassword,
        isActive: true,
      },
      systemPermissions,
      systemUserId,
      cacheSetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
    });

    testUser = user;
    testRole = role;

    authorizedHeader = await loginTestUser({
      app,
      email: testUser.email,
      password: testUserPassword,
      cacheSetSpy,
      cacheGetByIdSpy,
    });

    cacheSetSpy.mockClear();
    cacheGetByIdSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('GET /v1/permission/id/:id', () => {
    it('200 OK - should successfully fetch permission payload using a real authorized root user token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/id/${permission2.id}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);

      const body = JSON.parse(response.payload);

      validatePermissionResponseDto({
        response: body,
        expected: permission2,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('200 OK - should successfully fetch permission payload using a real authorized user token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/id/${permission.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);

      const body = JSON.parse(response.payload);

      validatePermissionResponseDto({
        response: body,
        expected: permission,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('404 NOT FOUND - should throw entity exception when requested by a real authorized user', async () => {
      const missingUuid = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/id/${missingUuid}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);

      const body = JSON.parse(response.payload);
      expect(body.message).toMatch(
        /Could not find any entity of type "Permission"/,
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('400 BAD REQUEST - should fail validation pipe checks before hitting the controller logic', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/permission/id/invalid-uuid-format-12345',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block a real user request if their token lacks the systemic scope', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/id/${permission.id}`,
        headers: {},
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
    it('403 FORBIDDEN - should block a real user request if user does not have required permission', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_PERMISSION_ENDPOINT_PERMISSION,
        systemUserId,
      });

      await userRolePipelineService.getPermissions(testUser.id);

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
        cacheSetSpy,
        cacheGetByIdSpy,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/id/${permission.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });
  describe('GET /v1/permission/code/:code', () => {
    it('200 OK - should successfully fetch permission payload using a real authorized  root user token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/code/${permission.code}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);

      const body = JSON.parse(response.payload);

      validatePermissionResponseDto({
        response: body,
        expected: permission,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
    it('200 OK - should successfully fetch permission payload using a real authorized user token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/code/${permission.code}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);

      const body = JSON.parse(response.payload);

      validatePermissionResponseDto({
        response: body,
        expected: permission,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
    it('404 NOT FOUND - should throw entity exception when requested by a real authorized user', async () => {
      const missingUuid = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/code/${missingUuid}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);

      const body = JSON.parse(response.payload);
      expect(body.message).toMatch(
        /Could not find any entity of type "Permission"/,
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
    it('403 FORBIDDEN - should block a real user request if their token lacks the systemic scope', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/code/${permission.code}`,
        headers: {},
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
    it('403 FORBIDDEN - should block a real user request if user does not have required permission', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_PERMISSION_ENDPOINT_PERMISSION,
        systemUserId,
      });

      await userRolePipelineService.getPermissions(testUser.id);

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
        cacheSetSpy,
        cacheGetByIdSpy,
      });

      cacheSetSpy.mockClear();
      cacheGetByIdSpy.mockClear();

      const response = await app.inject({
        method: 'GET',
        url: `/v1/permission/code/${permission.code}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });
});
