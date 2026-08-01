import type { RolePipelineService } from '@/role/role.pipeline';
import type { StorePipelineService } from '@/store/store.pipeline';
import type {
  GetRelatedStoreDto,
  StoreResponseDto,
} from '@/storeDto/store.dto';
import {
  ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  READ_USER_STORE_ENDPOINT_PERMISSION,
  UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { changePermissionsForTestUser } from '@/test/e2e/auth';
import { createTestStore } from '@/test/pipeline/store';
import { validateStoreResponseDto } from '@/test/validate/store';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserStoresListResponseDto } from '@/userDto/stores.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('UserStoresController (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let authorizedHeader: Record<string, string>;
  let authorizedRootHeader: Record<string, string>;
  let systemUserId: UUID;

  let cacheSetSpy: jest.SpyInstance;
  let cacheGetSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheInvalidateByTagsSpy: jest.SpyInstance;
  let cacheInvalidateByKeyPatternSpy: jest.SpyInstance;

  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let userStorePipelineService: UserStorePipelineService;
  let storePipelineService: StorePipelineService;

  let testUserPassword: string;
  let testUser: TestUser;
  let targetUser: TestUser;
  let seedStore: StoreResponseDto;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      moduleFixture,
      systemUserId,
      testUser,
      testUserPassword,
      authorizedHeader,
      authorizedRootHeader,
      targetUser,
      cacheSetSpy,
      cacheGetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
      userStorePipelineService,
      userRolePipelineService,
      rolePipelineService,
      storePipelineService,
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;
  });

  beforeEach(async () => {
    await userStorePipelineService.getAssignedStores(targetUser.user.id);

    seedStore = await createTestStore({
      storePipelineService,
      createdById: systemUserId,
      cacheSetSpy,
      cacheInvalidateByTagsSpy,
    });

    cacheSetSpy.mockClear();
    cacheGetSpy.mockClear();
    cacheGetByIdSpy.mockClear();
    cacheInvalidateByIdSpy.mockClear();
    cacheInvalidateByTagsSpy.mockClear();
    cacheInvalidateByKeyPatternSpy.mockClear();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/user/stores/user/:id', () => {
    it('201 CREATED - should successfully associate store IDs to the target user account matching params', async () => {
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);

      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should forward missing exceptions if FetchUserStoresPipe fails parameter location lookups', async () => {
      const randomId = randomUUID();
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${randomId}`,
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

    it('403 FORBIDDEN - should block pipeline progression if assignment permissions are explicitly revoked from context roles', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
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

      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
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

    it('400 BAD REQUEST - should collapse processing via validation pipes if property constraints are broken', async () => {
      const randomId = 'abc-123-invalid-uuid';
      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${randomId}`,
        headers: authorizedHeader,
        payload: { storeIds: 'not-an-array-type' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: ['each value in storeIds must be a UUID'],
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

  describe('DELETE /v1/user/stores/user/:id', () => {
    beforeEach(async () => {
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.payload).toEqual('');

      await userStorePipelineService.getAssignedStores(testUser.user.id);

      cacheSetSpy.mockClear();
      cacheGetSpy.mockClear();
      cacheGetByIdSpy.mockClear();
      cacheInvalidateByIdSpy.mockClear();
      cacheInvalidateByTagsSpy.mockClear();
      cacheInvalidateByKeyPatternSpy.mockClear();
    });

    it('200 OK - should cleanly process store assignment configurations and return success code as a root', async () => {
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('200 OK - should cleanly process store assignment configurations and return success code', async () => {
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toEqual('');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should throw exception if FetchUserStoresPipe discovers target identifier details are absent', async () => {
      const randomId = randomUUID();
      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${randomId}`,
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

    it('403 FORBIDDEN - should intercept execution sequences if the assignment token right is revoked', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
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

      const payload = { storeIds: [seedStore.id] };

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/user/stores/user/${targetUser.user.id}`,
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

  describe('GET /v1/user/stores', () => {
    it('200 OK - should execute search queries cleanly and map matching array records inside lists', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/stores',
        headers: authorizedHeader,
        query: { page: '1', limit: '10', userId: testUser.user.id },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      const { data } = body as UserStoresListResponseDto;

      data.forEach((userStore) => {
        validateStoreResponseDto({
          response: userStore.store,
          expected: testUser.store,
        });
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should drop connections if reading permissions are absent from active user scopes', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_USER_STORE_ENDPOINT_PERMISSION,
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
        url: '/v1/user/stores',
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

  describe('GET /v1/user/stores/assigned/:id', () => {
    it('200 OK - should successfully fetch and map assigned stores by user ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/stores/assigned/${testUser.user.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const stores = JSON.parse(response.payload) as GetRelatedStoreDto[];

      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);

      stores.forEach((store) => {
        validateStoreResponseDto({
          response: store,
          expected: testUser.store,
        });
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should halt request execution if the provided user ID parameter is not a valid UUID', async () => {
      const invalidUuid = '12345-invalid-uuid';

      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/stores/assigned/${invalidUuid}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Validation failed (uuid is expected)',
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

    it('403 FORBIDDEN - should drop connections if reading permissions are absent from active user scopes', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_USER_STORE_ENDPOINT_PERMISSION,
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
        url: `/v1/user/stores/assigned/${testUser.user.id}`,
        headers,
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
});
