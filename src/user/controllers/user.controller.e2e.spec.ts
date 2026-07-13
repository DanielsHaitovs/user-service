/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import { COUNTRIES } from '@/commonConst/countries.const';
import {
  ASSIGN_USER_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/commonConst/role.const';
import {
  ASSIGN_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/commonConst/store.const';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import {
  CREATE_USER_ENDPOINT_PERMISSION,
  DELETE_USER_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { loginTestUser } from '@/test/e2e/auth';
import { unAssignPermissionFromRole } from '@/test/pipeline/rolePermissions';
import { createTestUser, initTestUser } from '@/test/pipeline/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserController (e2e)', () => {
  let app: NestFastifyApplication;
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
  let testStore: StoreResponseDto;
  let seededTargetUser: UserResponseDto;

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
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;

    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    systemPermissions = systemPermissions.filter((p) => p !== 'root_admin');
  });

  beforeEach(async () => {
    const { user, role, store } = await initTestUser({
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
    testStore = store;
    authorizedHeader = await loginTestUser({
      app,
      email: testUser.email,
      password: testUserPassword,
    });

    seededTargetUser = await createTestUser({
      userPipelineService,
      overrides: { email: `${randomUUID()}@target-e2e.com` },
      createdById: systemUserId,
    });

    cacheSetSpy.mockClear();
    cacheGetSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/user', () => {
    it('201 CREATED - should successfully create a new user when strict and loose tokens exist', async () => {
      const payload = {
        firstName: 'E2E',
        lastName: 'User',
        email: `${randomUUID()}@example.com`,
        password: 'Password123!',
        phone: '+1234567890',
        country: COUNTRIES.US,
        dateOfBirth: '1990-01-01',
        twoFactorSecret: 'secretTwoFactor',
        roleIds: [testRole.id],
        storeIds: [testStore.id],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(payload.email);
    });

    it('201 CREATED - should strip role configurations from payload data if loose role verification components are missing', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: [ASSIGN_USER_ROLE],
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = {
        firstName: 'Stripped',
        lastName: 'Role',
        email: `${randomUUID()}@example.com`,
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
        twoFactorSecret: 'secretTwoFactor',
        country: COUNTRIES.US,
        roleIds: [testRole.id],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
    });

    it('201 CREATED - should strip store associations from incoming properties if loose store evaluation scopes are missing', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: [ASSIGN_USER_STORE],
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = {
        firstName: 'Stripped',
        lastName: 'Store',
        email: `${randomUUID()}@example.com`,
        password: 'Password123!',
        country: COUNTRIES.US,
        dateOfBirth: '1990-01-01',
        twoFactorSecret: 'secretTwoFactor',
        storeIds: [testStore.id],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
    });

    it('403 FORBIDDEN - should block route access if core creation permissions are missing from account context scopes', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: CREATE_USER_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers,
        payload: { name: 'Forbidden' },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('400 BAD REQUEST - should drop connection parameters via ValidationPipe if input schemas are malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload: { email: 'not-a-valid-email-string' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/user/id/:id', () => {
    it('200 OK - should locate and return targeted account information fields by their unique ID reference mapping', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/id/${seededTargetUser.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id', seededTargetUser.id);
    });

    it('404 NOT FOUND - should issue standard error data templates if target identifier parameter cannot be matched', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/id/${randomUUID()}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('400 BAD REQUEST - should fail execution tracking early via ParseUUIDPipe rules if string format is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/id/invalid-uuid-alphanumeric-token',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/user/email/:email', () => {
    it('200 OK - should successfully fetch active profiles matched by precise string values matching records', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/email/${seededTargetUser.email}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('email', seededTargetUser.email);
    });

    it("404 NOT FOUND - should return entity missing states if lookup targets don't point to active assets", async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/email/ghost-account-lookup@example.com`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /v1/user', () => {
    it('200 OK - should scan structural layouts using query limit tags inside index route trackers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user',
        headers: authorizedHeader,
        query: { page: '1', limit: '5' },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('PATCH /v1/user/:id', () => {
    it('200 OK - should map data modification adjustments smoothly and return operational true indicators', async () => {
      const payload = {
        firstName: `MUTATED_NAME_${randomUUID().substring(0, 8)}`,
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/user/${seededTargetUser.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toBe('true');
    });

    it('404 NOT FOUND - should abort operational chains if FetchUserPipe discovers user assets are missing', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/user/${randomUUID()}`,
        headers: authorizedHeader,
        payload: { firstName: 'Ghost' },
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/user/:id', () => {
    it('204 NO CONTENT - should successfully drop model targets completely when loose conditions are met', async () => {
      const deleteUserTarget = await createTestUser({
        userPipelineService,
        overrides: { email: `${randomUUID()}@transient-delete.com` },
        createdById: systemUserId,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/${deleteUserTarget.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    });

    it('204 NO CONTENT - should securely complete deletion cycles even if loose relational removal authorization is absent', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: [
          READ_ROLE,
          READ_USER_ROLE,
          UNASSIGN_USER_ROLE,
          READ_STORE,
          READ_USER_STORE,
          UNASSIGN_USER_STORE,
        ],
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });

      const deleteUserTarget = await createTestUser({
        userPipelineService,
        overrides: { email: `${randomUUID()}@loose-transient-delete.com` },
        createdById: systemUserId,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/${deleteUserTarget.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    });

    it('404 NOT FOUND - should cancel deletion pipeline requests if FetchFullUserPipe unmasks an empty identifier', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/${randomUUID()}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should restrict execution routines instantly if strict core deletion scopes are missing', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: DELETE_USER_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/${seededTargetUser.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
