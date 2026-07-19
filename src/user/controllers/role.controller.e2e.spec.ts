/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import {
  ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
  READ_USER_ROLE_ENDPOINT_PERMISSION,
  UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestRole } from '@/test/db/role';
import { loginTestUser } from '@/test/e2e/auth';
import { unAssignPermissionFromRole } from '@/test/pipeline/rolePermissions';
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

describe('UserRolesController (e2e)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let authorizedHeader: Record<string, string>;
  let systemUserId: UUID;
  let systemPermissions: string[];
  let cacheSetSpy: jest.SpyInstance;
  let cacheGetSpy: jest.SpyInstance;

  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;

  const testUserPassword = 'TestPassword123!';
  let testUser: UserResponseDto;
  let testRole: RoleResponseDto;
  let targetTransientRole: RoleResponseDto;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      moduleFixture,
      systemUserId,
      systemPermissions,
      cacheSetSpy,
      cacheGetSpy,
      userPipelineService,
      userRolePipelineService,
      rolePipelineService,
      storePipelineService,
      userStorePipelineService,
      dataSource,
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
    });

    testUser = user;
    testRole = role;
    authorizedHeader = await loginTestUser({
      app,
      email: testUser.email,
      password: testUserPassword,
    });

    targetTransientRole = await createTestRole({
      dataSource,
      overrides: {
        name: `TRANSIENT_ROLE_${randomUUID()}`,
        createdBy: { id: systemUserId } as User,
      },
    });

    cacheSetSpy.mockClear();
    cacheGetSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/user/roles/user/:userId', () => {
    it('201 CREATED - should successfully assign an array of role IDs to an active target user', async () => {
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${testUser.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
    });

    it('404 NOT FOUND - should throw exception if FetchUserRolesPipe fails to discover target userId matching parameters', async () => {
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should intercept execution loops if request user context lacks explicit assignment permissions', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${testUser.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('400 BAD REQUEST - should halt request flows via ValidationPipe checks if payload schemas are malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/roles/user/${testUser.id}`,
        headers: authorizedHeader,
        payload: { roleIds: 'not-an-array-instance' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /v1/user/roles/user/:userId', () => {
    it('200 OK - should execute role unassignment routines cleanly and return status success matching specs', async () => {
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${testUser.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    it('404 NOT FOUND - should return entity missing error codes if FetchUserRolesPipe fails tracking validation lookups', async () => {
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should block target execution pathways if the strict unassignment token is explicitly revoked', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = { roleIds: [targetTransientRole.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/roles/user/${testUser.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /v1/user/roles', () => {
    it('200 OK - should return structural lists matching search criteria grids when query contains required elements', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/roles',
        headers: authorizedHeader,
        query: { page: '1', limit: '10', userId: testUser.id },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('403 FORBIDDEN - should trigger guard block actions if context profiles are missing lookup read permissions', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_USER_ROLE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/roles',
        headers,
        query: { userId: testUser.id },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /v1/user/roles/permissions/:userId', () => {
    it('200 OK - should successfully compile and return flat arrays listing all permission codes assigned to a user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/roles/permissions/${testUser.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(Array.isArray(body)).toBe(true);
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
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/roles/permissions/${testUser.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
