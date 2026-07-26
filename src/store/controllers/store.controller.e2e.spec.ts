/* eslint-disable sonarjs/no-hardcoded-passwords */
import {
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/commonConst/store.const';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import type { StorePipelineService } from '@/store/store.pipeline';
import type { StoreResponseDto } from '@/storeDto/store.dto';
import {
  CREATE_STORE_ENDPOINT_PERMISSION,
  DELETE_STORE_ENDPOINT_PERMISSION,
  READ_STORE_ENDPOINT_PERMISSION,
} from '@/system/const/store.const';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { changePermissionsForTestUser, loginTestUser } from '@/test/e2e/auth';
import { initTestUser } from '@/test/pipeline/user';
import { validateStoreResponseDto } from '@/test/validate/store';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserStorePipelineService } from '@/user/store.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

describe('StoreController (e2e)', () => {
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

  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;
  let storePipelineService: StorePipelineService;
  let userStorePipelineService: UserStorePipelineService;

  const testUserPassword = 'TestPassword123!';
  let testUser: UserResponseDto;
  let rootUser: UserResponseDto;
  let testRole: RoleResponseDto;
  let seedStore: StoreResponseDto;

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
      userRolePipelineService,
      rolePipelineService,
      storePipelineService,
      userStorePipelineService,
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;

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

    seedStore = await storePipelineService.create({
      createDto: {
        name: `SEED_STORE_${randomUUID()}`,
        code: `CODE_${randomUUID().substring(0, 8)}`,
        viewCode: `VIEW_${randomUUID().substring(0, 8)}`,
      },
      createdById: systemUserId,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
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

  describe('POST /v1/store', () => {
    it('201 CREATED - should successfully create a new store with unique attributes as root', async () => {
      const payload = {
        name: `STORE_${randomUUID()}`,
        code: `CODE_${randomUUID().substring(0, 8)}`,
        viewCode: `VIEW_${randomUUID().substring(0, 8)}`,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/store',
        headers: authorizedRootHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);
      expect(body.code).toBe(payload.code);
      expect(body.viewCode).toBe(payload.viewCode);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('201 CREATED - should successfully create a new store with unique attributes', async () => {
      const payload = {
        name: `STORE_${randomUUID()}`,
        code: `CODE_${randomUUID().substring(0, 8)}`,
        viewCode: `VIEW_${randomUUID().substring(0, 8)}`,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/store',
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);
      expect(body.code).toBe(payload.code);
      expect(body.viewCode).toBe(payload.viewCode);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block store creation if user lacks strict permission scope', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: CREATE_STORE_ENDPOINT_PERMISSION,
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

      const payload = { name: 'FORBIDDEN_STORE', code: 'F1', viewCode: 'V1' };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/store',
        headers,
        payload,
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

    it('400 BAD REQUEST - should fail global validation pipes if input types are structurally malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/store',
        headers: authorizedHeader,
        payload: { name: 12345 },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: [
            'name must be shorter than or equal to 100 characters',
            'name must be longer than or equal to 1 characters',
            'name must be a string',
            'code must be shorter than or equal to 100 characters',
            'code must be longer than or equal to 1 characters',
            'code must be a string',
            'viewCode must be shorter than or equal to 100 characters',
            'viewCode must be longer than or equal to 1 characters',
            'viewCode must be a string',
          ],
          error: 'Bad Request',
          statusCode: 400,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/store/id/:id', () => {
    it('200 OK - should locate and return the target store data by its unique ID record as root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/id/${seedStore.id}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);

      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('200 OK - should locate and return the target store data by its unique ID record', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/id/${seedStore.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);

      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block access to store records if user lacks strict permission scope', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_STORE_ENDPOINT_PERMISSION,
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
        url: `/v1/store/id/${seedStore.id}`,
        headers,
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

    it('404 NOT FOUND - should throw entity missing exception for a valid unassigned UUID format', async () => {
      const randomId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/id/${randomId}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: 404,
          message:
            'Could not find any entity of type "Store" matching: {\n' +
            '    "where": {\n' +
            `        "id": "${randomId}"\n` +
            '    }\n' +
            '}',
          error: 'EntityNotFoundError',
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should halt execution at the gateway via ParseUUIDPipe checks if structure is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/store/id/invalid-uuid-string-token',
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
          statusCode: 400,
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/store/code/:code', () => {
    it('200 OK - should successfully fetch store properties as root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/code/${seedStore.code}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);

      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('200 OK - should successfully fetch store properties matching string code paths', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/code/${seedStore.code}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);

      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block access to store records if user lacks strict permission scope', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_STORE_ENDPOINT_PERMISSION,
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
        url: `/v1/store/code/${seedStore.code}`,
        headers,
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

    it('404 NOT FOUND - should map an error payload if string code cannot be located in storage', async () => {
      const randomCode = `GHOST_CODE_${randomUUID()}`;
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/code/${randomCode}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: 404,
          message:
            'Could not find any entity of type "Store" matching: {\n' +
            '    "where": {\n' +
            `        "code": "${randomCode}"\n` +
            '    }\n' +
            '}',
          error: 'EntityNotFoundError',
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/store/viewCode/:viewCode', () => {
    it('200 OK - should find target store payloads using public custom viewCode strings by root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/viewCode/${seedStore.viewCode}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('200 OK - should find target store payloads using public custom viewCode strings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/viewCode/${seedStore.viewCode}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateStoreResponseDto({ response: body, expected: seedStore });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('403 FORBIDDEN - should block access to store records if user lacks strict permission scope', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_STORE_ENDPOINT_PERMISSION,
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
        url: `/v1/store/viewCode/${seedStore.viewCode}`,
        headers,
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

    it('404 NOT FOUND - should flag exceptions if custom viewCode records do not exist', async () => {
      const randomCode = `GHOST_VIEW_${randomUUID()}`;
      const response = await app.inject({
        method: 'GET',
        url: `/v1/store/viewCode/${randomCode}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: 404,
          message:
            'Could not find any entity of type "Store" matching: {\n' +
            '    "where": {\n' +
            `        "viewCode": "${randomCode}"\n` +
            '    }\n' +
            '}',
          error: 'EntityNotFoundError',
        }),
      );

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/store', () => {
    it('200 OK - should evaluate internal pagination grids using basic search parameter queries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/store',
        headers: authorizedHeader,
        query: { page: '1', limit: '10', ids: [seedStore.id] },
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('403 FORBIDDEN - should drop connection requests if global view tokens are missing from context profiles', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: READ_STORE_ENDPOINT_PERMISSION,
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
        url: '/v1/store',
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('PATCH /v1/store/:id', () => {
    it('200 OK - should process modifications smoothly and return true for valid updates', async () => {
      const payload = { name: `MUTATED_STORE_${randomUUID()}` };

      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/store/${seedStore.id}`,
        headers: authorizedHeader,
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.payload).toBe('true');
    });

    it('404 NOT FOUND - should break early if FetchStorePipe unmasks a completely fake identifier', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/store/${randomUUID()}`,
        headers: authorizedHeader,
        payload: { name: 'NEW_NAME' },
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('400 BAD REQUEST - should trip validation logic early if input attributes break criteria guidelines', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/v1/store/${seedStore.id}`,
        headers: authorizedHeader,
        payload: { name: 12345 },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /v1/store/:id', () => {
    it('204 NO CONTENT - should process structural asset purges completely when strict and loose tokens exist', async () => {
      const transientDeleteTarget = await storePipelineService.create({
        createDto: {
          name: `DELETE_TARGET_${randomUUID()}`,
          code: `DL_${randomUUID().substring(0, 8)}`,
          viewCode: `DLV_${randomUUID().substring(0, 8)}`,
        },
        createdById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/store/${transientDeleteTarget.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    });

    it('204 NO CONTENT - should successfully execute deletions even if loose metadata check scopes are removed', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [READ_USER_STORE, UNASSIGN_USER_STORE],
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

      const transientDeleteTarget = await storePipelineService.create({
        createDto: {
          name: `LOOSE_DELETE_TARGET_${randomUUID()}`,
          code: `LD_${randomUUID().substring(0, 8)}`,
          viewCode: `LDV_${randomUUID().substring(0, 8)}`,
        },
        createdById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/store/${transientDeleteTarget.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    });

    it('403 FORBIDDEN - should block operational cycles instantly if strict elimination rights are revoked', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: DELETE_STORE_ENDPOINT_PERMISSION,
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
        url: `/v1/store/${seedStore.id}`,
        headers,
      });

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
