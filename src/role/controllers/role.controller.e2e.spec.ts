/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import {
  ASSIGN_PERMISSION_TO_ROLE,
  CREATE_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/commonConst/role.const';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import { READ_PERMISSION_ENDPOINT_PERMISSION } from '@/system/const/permission.const';
import {
  DELETE_ROLE_ENDPOINT_PERMISSION,
  UPDATE_ROLE_ENDPOINT_PERMISSION,
} from '@/system/const/role.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { changePermissionsForTestUser, loginTestUser } from '@/test/e2e/auth';
import { createTestRole } from '@/test/pipeline/role';
import { initTestUser } from '@/test/pipeline/user';
import { validateRoleResponseDto } from '@/test/validate/role';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('RoleController (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let authorizedHeader: Record<string, string>;
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
  let testRole: RoleResponseDto;
  let seedRole: RoleResponseDto;

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
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;

    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    systemPermissions = systemPermissions.filter((p) => p !== 'root_admin');
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
      rolePipelineService,
      overrides: {
        name: `SEED_ROLE_${randomUUID()}`,
      },
      createdById: systemUserId,
      cacheSetSpy,
      cacheInvalidateByTagsSpy,
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

  describe('POST /v1/role', () => {
    it('201 CREATED - should successfully create a new role with all loose scopes satisfied', async () => {
      const payload = { name: `ROLE_${randomUUID()}`, permissions: [] };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('201 CREATED - should strip permissions down to empty array if user lacks permission to read permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_PERMISSION_ENDPOINT_PERMISSION,
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

      const payload = {
        name: `STRIPPED_ROLE_${randomUUID()}`,
        permissions: ['SOME_PERMISSION_CODE'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);

      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);
      expect(body.permissions).toEqual([]);

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('201 CREATED - should strip permissions down to empty array if user lacks permission to assign permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [ASSIGN_PERMISSION_TO_ROLE],
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

      const payload = {
        name: `STRIPPED_ROLE_${randomUUID()}`,
        permissions: ['SOME_PERMISSION_CODE'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);

      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);
      expect(body.permissions).toEqual([]);

      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks the primary strict operational permission to create role', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [CREATE_ROLE],
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
        url: '/v1/role',
        headers,
        payload: { name: 'FORBIDDEN_ROLE' },
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
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks the primary strict operational permission to read role', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [READ_ROLE],
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

      cacheSetSpy.mockClear();
      cacheGetByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();

      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers,
        payload: { name: 'FORBIDDEN_ROLE' },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks the primary strict operational permission to read role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers: {},
        payload: { name: 'FORBIDDEN_ROLE' },
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should fail global validation rules if the incoming payload properties are malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/role',
        headers: authorizedHeader,
        payload: { name: 12345 },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/role/id/:id', () => {
    it('200 OK - should return target payload structure when looking up a valid role ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/role/id/${seedRole.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);

      validateRoleResponseDto({
        response: body,
        expected: seedRole,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should trigger exception mapping if the UUID does not point to an active record', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/role/id/${randomUUID()}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('400 BAD REQUEST - should halt request early via ParseUUIDPipe checks if identifier structure is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/role/id/invalid-uuid-string-format',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('403 BAD REQUEST - should halt request early via ParseUUIDPipe checks if identifier structure is invalid', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [READ_ROLE],
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
        url: `/v1/role/id/${seedRole.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/role', () => {
    it('200 OK - should return a list of roles matching query criteria', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/role`,
        headers: authorizedHeader,
        query: {
          page: '1',
          limit: '10',
          ids: [seedRole.id],
        },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks required search permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [READ_ROLE],
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
        url: '/v1/role',
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /v1/role/:id/name', () => {
    it('200 OK - should successfully update an existing role name and return true', async () => {
      const payload = { name: `UPDATED_NAME_${randomUUID()}` };

      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/role/${seedRole.id}/name`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toBe('true');
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
    });

    it('404 NOT FOUND - should throw exception if FetchRolePipe fails to locate target role ID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/role/${randomUUID()}/name`,
        headers: authorizedHeader,
        payload: { name: 'NEW_NAME' },
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks the required update scope', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: UPDATE_ROLE_ENDPOINT_PERMISSION,
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
        method: 'PATCH',
        url: `/v1/role/${seedRole.id}/name`,
        headers,
        payload: { name: 'FORBIDDEN_NAME' },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should block requests with malformed update body strings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/role/${seedRole.id}/name`,
        headers: authorizedHeader,
        payload: { name: 12345 },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('DELETE /v1/role/id/:id', () => {
    it('204 NO CONTENT - should successfully remove a role when strict and loose permissions are met', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/id/${seedRole.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });

    it('204 NO CONTENT - should process delete execution smoothly even if user lacks optional loose permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [READ_USER_ROLE, UNASSIGN_USER_ROLE],
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
        url: `/v1/role/id/${seedRole.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);
    });

    it('404 NOT FOUND - should throw exception if FetchRolePipe discovers target model is missing', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/id/${randomUUID()}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution if user lacks strict deletion scope permission', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: DELETE_ROLE_ENDPOINT_PERMISSION,
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
        url: `/v1/role/id/${seedRole.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });
});
