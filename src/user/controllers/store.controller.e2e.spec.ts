/* eslint-disable sonarjs/no-hardcoded-passwords */
import { CacheService } from '@/baseServices/cache.service';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import {
  ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  READ_USER_STORE_ENDPOINT_PERMISSION,
  UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { loginTestUser } from '@/test/e2e/auth';
import { unAssignPermissionFromRole } from '@/test/pipeline/rolePermissions';
import { initTestUser } from '@/test/pipeline/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserStoresController (e2e)', () => {
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
  let targetTransientStore: StoreResponseDto;

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

    targetTransientStore = await storePipelineService.create({
      createDto: {
        name: `TRANSIENT_STORE_${randomUUID()}`,
        code: `CD_${randomUUID().substring(0, 8)}`,
        viewCode: `VW_${randomUUID().substring(0, 8)}`,
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    });

    cacheSetSpy.mockClear();
    cacheGetSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/user/stores/user/:id', () => {
    it('201 CREATED - should successfully associate store IDs to the target user account matching params', async () => {
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${testUser.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
    });

    it('404 NOT FOUND - should forward missing exceptions if FetchUserStoresPipe fails parameter location lookups', async () => {
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should block pipeline progression if assignment permissions are explicitly revoked from context roles', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${testUser.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('400 BAD REQUEST - should collapse processing via validation pipes if property constraints are broken', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${testUser.id}`,
        headers: authorizedHeader,
        payload: { storeIds: 'not-an-array-type' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /v1/user/stores/user/:id', () => {
    it('200 OK - should cleanly process store unassignment configurations and return success code', async () => {
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${testUser.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
    });

    it('404 NOT FOUND - should throw exception if FetchUserStoresPipe discovers target identifier details are absent', async () => {
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${randomUUID()}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('403 FORBIDDEN - should intercept execution sequences if the unassignment token right is revoked', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const payload = { storeIds: [targetTransientStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${testUser.id}`,
        headers,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /v1/user/stores', () => {
    it('200 OK - should execute search queries cleanly and map matching array records inside lists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/stores',
        headers: authorizedHeader,
        query: { page: '1', limit: '10', userId: testUser.id },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('403 FORBIDDEN - should drop connections if reading permissions are absent from active user scopes', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_USER_STORE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/stores',
        headers,
        query: { userId: testUser.id },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
