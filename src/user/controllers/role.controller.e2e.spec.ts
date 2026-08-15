import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import {
  ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
  READ_USER_ROLE_ENDPOINT_PERMISSION,
  UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { changePermissionsForTestUser } from '@/test/e2e/auth';
import { createTestRole } from '@/test/pipeline/role';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserRolesController (e2e)', () => {
  let app: NestFastifyApplication;
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

  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;

  let testUserPassword: string;
  let testUser: TestUser;
  let targetUser: TestUser;
  let seedRole: RoleResponseDto;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      moduleFixture,
      systemUserId,
      testUser,
      targetUser,
      cacheSetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
      userRolePipelineService,
      rolePipelineService,
      authorizedHeader,
      authorizedRootHeader,
      testUserPassword,
      systemPermissions,
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;
  });

  beforeEach(async () => {
    await userRolePipelineService.getPermissions(testUser.user.id);

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

  describe('POST /v1/user/roles/user/:userId', () => {
    it('201 CREATED - should successfully assign an array of role IDs to an active target user as root', async () => {
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('201 CREATED - should successfully assign an array of role IDs to an active target user', async () => {
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should halt request flows via ValidationPipe checks if payload schemas are malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload: { roleIds: 'not-an-array-instance' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: ['each value in roleIds must be a UUID'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should throw exception if FetchUserRolesPipe fails to discover target userId matching parameters', async () => {
      const randomId = randomUUID();
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${randomId}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            'Could not find any entity of type "User" matching: {\n' +
            `    "userId": "${randomId}"\n` +
            '}',
          error: 'EntityNotFoundError',
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should intercept execution loops if request user context lacks explicit assignment permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
        permissionsToAssign: [],
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole: testUser.role,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.user.id,
          email: testUser.user.email,
          password: testUserPassword,
        },
      });

      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Invalid token',
          error: 'Forbidden',
          statusCode: HttpStatus.FORBIDDEN,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('DELETE /v1/user/roles/user/:userId', () => {
    beforeEach(async () => {
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.payload).toEqual('');

      await userRolePipelineService.getAssignedRoles(testUser.user.id);

      cacheSetSpy.mockClear();
      cacheGetByIdSpy.mockClear();
      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      cacheInvalidateByKeyPatternSpy.mockClear();
    });

    it('200 OK - should execute role unassigned routines cleanly and return status success matching specs as root', async () => {
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('200 OK - should execute role unassigned routines cleanly and return status success matching specs', async () => {
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block target execution pathways if the strict unassigned token is explicitly revoked', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
        permissionsToAssign: [],
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole: testUser.role,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.user.id,
          email: testUser.user.email,
          password: testUserPassword,
        },
      });

      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${targetUser.user.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Invalid token',
          error: 'Forbidden',
          statusCode: HttpStatus.FORBIDDEN,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should return entity missing error codes if FetchUserRolesPipe fails tracking validation lookups', async () => {
      const randomId = randomUUID();
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${randomId}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            'Could not find any entity of type "User" matching: {\n' +
            `    "userId": "${randomId}"\n` +
            '}',
          error: 'EntityNotFoundError',
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('400 BAD REQUEST -  should throw bad request exception because userId must be UUID ', async () => {
      const randomId = 'abc-123-invalid-uuid';
      const payload = { roleIds: [seedRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${randomId}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: ['each value in roleIds must be a UUID'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/user/roles', () => {
    it('200 OK - should return structural lists matching search criteria grids when query contains required elements', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/roles',
        headers: authorizedHeader,
        query: { page: '1', limit: '10', userId: targetUser.user.id },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('403 FORBIDDEN - should trigger guard block actions if context profiles are missing lookup read permissions', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_USER_ROLE_ENDPOINT_PERMISSION,
        permissionsToAssign: [],
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole: testUser.role,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.user.id,
          email: testUser.user.email,
          password: testUserPassword,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/roles',
        headers,
        query: { userId: targetUser.user.id },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Invalid token',
          error: 'Forbidden',
          statusCode: HttpStatus.FORBIDDEN,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/user/roles/permissions/:userId', () => {
    beforeEach(async () => {
      await userRolePipelineService.getPermissions(targetUser.user.id);

      cacheSetSpy.mockClear();
      cacheGetByIdSpy.mockClear();
      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      cacheInvalidateByKeyPatternSpy.mockClear();
    });

    it('200 OK - should successfully compile and return flat arrays listing all permission codes assigned to a user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/roles/permissions/${targetUser.user.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toEqual(systemPermissions.length);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(2);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should fail validation early via ParseUUIDPipe checks if identifier structure is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/roles/permissions/invalid-uuid-alphanumeric-token',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('403 FORBIDDEN - should drop connection pipelines instantly if search context lacks permission query rights', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
        permissionsToAssign: [],
        systemUserId,
        rolePipelineService,
        userRolePipelineService,
        testRole: testUser.role,
        cacheSetSpy,
        cacheGetByIdSpy,
        cacheInvalidateByIdSpy,
        cacheInvalidateByTagsSpy,
        cacheInvalidateByKeyPatternSpy,
        app,
        testUser: {
          id: testUser.user.id,
          email: testUser.user.email,
          password: testUserPassword,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/roles/permissions/${targetUser.user.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
