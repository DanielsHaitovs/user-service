/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import {
  ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
  READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
  UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
} from '@/system/const/role.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestPermissions } from '@/test/db/permission';
import { createTestRole, createTestRoleWithPermissions } from '@/test/db/role';
import { changePermissionsForTestUser, loginTestUser } from '@/test/e2e/auth';
import { initTestUser } from '@/test/pipeline/user';
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

describe('RolePermissionsController (e2e)', () => {
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

  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;

  const testUserPassword = 'TestPassword123!';
  let testUser: UserResponseDto;
  let rootUser: UserResponseDto;
  let testRole: RoleResponseDto;
  let seedRole: RoleResponseDto;
  let seedRoleWithPermissions: RoleResponseDto;
  let targetPermissionCode: string;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
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
      dataSource,
    } = bootstrap);

    app = bootstrap.app as NestFastifyApplication;

    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    systemPermissions = systemPermissions.filter((p) => p !== 'root_admin');

    const [seededPermission] = await createTestPermissions({
      dataSource,
      permissions: [{ createdBy: { id: systemUserId } as User }],
    });

    if (!seededPermission) {
      throw new Error('Failed to seed reference permission for testing scope.');
    }

    targetPermissionCode = seededPermission.code;

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

    cacheSetSpy.mockClear();
    cacheGetByIdSpy.mockClear();
    cacheInvalidateByIdSpy.mockClear();
    cacheInvalidateByTagsSpy.mockClear();
    cacheInvalidateByKeyPatternSpy.mockClear();
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

    seedRole = await createTestRole({
      dataSource,
      overrides: {
        name: `SEED_PERMISSION_ROLE_${randomUUID()}`,
        createdBy: { id: systemUserId } as User,
      },
    });

    seedRoleWithPermissions = await createTestRoleWithPermissions({
      dataSource,
      role: {
        name: `SEED_PERMISSION_ROLE_WITH_PERMISSIONS_${randomUUID()}`,
        createdBy: { id: systemUserId } as User,
      },
      permissions: [
        {
          createdBy: { id: systemUserId } as User,
          code: `SEED_PERMISSION_${randomUUID()}`,
          name: `SEED_PERMISSION_${randomUUID()}`,
        },
      ],
    });

    cacheSetSpy.mockClear();
    cacheGetByIdSpy.mockClear();
    cacheInvalidateByIdSpy.mockClear();
    cacheInvalidateByTagsSpy.mockClear();
    cacheInvalidateByKeyPatternSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/role/permissions/assign/:roleId', () => {
    it('201 CREATED - should successfully assign permissions to a valid role target as a root', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.body).toBe('');

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });

    it('201 CREATED - should successfully assign permissions to a valid role target', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.body).toBe('');

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });

    it('404 NOT FOUND - should reject assignment if FetchRolePermissionsPipe cannot locate the role ID', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: 404,
          error: 'EntityNotFoundError',
          message: expect.stringContaining(
            'Could not find any entity of type "Roles"',
          ),
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('422 BAD REQUEST - should reject assignment if permission codes does not exist', async () => {
      const payload = { permissionCodes: 'not-an-array-format' };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message:
            'The following permission codes do not exist: not-an-array-format',
          error: 'Unprocessable Entity',
          statusCode: 422,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user context lacks assignment permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.id,
          email: testUser.email,
          password: testUserPassword,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers,
        payload: { permissionCodes: [targetPermissionCode] },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Invalid token',
          error: 'Forbidden',
          statusCode: 403,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('DELETE /v1/role/permissions/unAssign/:roleId', () => {
    it('201 CREATED - should successfully execute unassigned routines and return created status code as root', async () => {
      const payload = {
        permissionCodes: [seedRoleWithPermissions.permissions[0]?.code],
      };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/permissions/unAssign/${seedRoleWithPermissions.id}`,
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.body).toBe('');

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });
    it('201 CREATED - should successfully execute unassigned routines and return created status code', async () => {
      const payload = {
        permissionCodes: [seedRoleWithPermissions.permissions[0]?.code],
      };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/permissions/unAssign/${seedRoleWithPermissions.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.body).toBe('');

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });

    it('404 NOT FOUND - should throw entity missing error if FetchRolePermissionsPipe fails lookup values', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/permissions/unAssign/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should block target requests if user context environment fails unassigned tokens', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign:
          UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.id,
          email: testUser.email,
          password: testUserPassword,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/permissions/unAssign/${seedRole.id}`,
        headers,
        payload: { permissionCodes: [targetPermissionCode] },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /v1/role/permissions/:roleId', () => {
    it('200 OK - should cleanly return the nested role mapping configuration records when found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/role/permissions/${seedRole.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id', seedRole.id);
    });

    it('404 NOT FOUND - should forward database entity exceptions if the target resource does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/role/permissions/${randomUUID()}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('400 BAD REQUEST - should fail verification at the gateway if the parameter violates ParseUUIDPipe structures', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/role/permissions/invalid-uuid-string-token',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('403 FORBIDDEN - should block lookups if request credentials lack role read permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.id,
          email: testUser.email,
          password: testUserPassword,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/role/permissions/${seedRole.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
