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

describe('RolePermissionsController (e2e)', () => {
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
  let seedRole: RoleResponseDto;
  let targetPermissionCode: string;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      moduleFixture,
      systemUserId,
      systemPermissions,
      cacheSetSpy,
      cacheGetSpy,
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

    seedRole = await createTestRole({
      dataSource,
      overrides: {
        name: `SEED_PERMISSION_ROLE_${randomUUID()}`,
        createdBy: { id: systemUserId } as User,
      },
    });

    cacheSetSpy.mockClear();
    cacheGetSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/role/permissions/assign/:roleId', () => {
    it('201 CREATED - should successfully assign permissions to a valid role target', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
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
    });

    it('403 FORBIDDEN - should intercept execution if user context lacks assignment permissions', async () => {
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/v1/role/permissions/assign/${seedRole.id}`,
        headers,
        payload: { permissionCodes: [targetPermissionCode] },
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /v1/role/permissions/unAssign/:roleId', () => {
    it('201 CREATED - should successfully execute unassigned routines and return created status code', async () => {
      const payload = { permissionCodes: [targetPermissionCode] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/role/permissions/unAssign/${seedRole.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
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
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign:
          UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
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
      await unAssignPermissionFromRole({
        rolePipelineService,
        testRole,
        permissionsToUnassign: READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
        systemUserId,
      });

      const headers = await loginTestUser({
        app,
        email: testUser.email,
        password: testUserPassword,
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
