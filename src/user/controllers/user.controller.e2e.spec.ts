/* eslint-disable sonarjs/no-hardcoded-passwords */
import { COUNTRIES } from '@/commonConst/countries.const';
import { ASSIGN_USER_ROLE } from '@/commonConst/role.const';
import type { RolePipelineService } from '@/role/role.pipeline';
import { bootstrapTestApp, type TestUser } from '@/test/bootstrap-e2e';
import { changePermissionsForTestUser } from '@/test/e2e/auth';
import { createTestUser } from '@/test/pipeline/user';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { CreateUserDto, UserResponseDto } from '@/userDto/user.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';

import { validateUserResponseDto } from '../../../test/validate/user';
import { ASSIGN_USER_STORE } from '../../common/const/store.const';
import { CREATE_USER_ENDPOINT_PERMISSION } from '../../system/const/user.const';

describe('UserController (e2e)', () => {
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

  let userPipelineService: UserPipelineService;
  let rolePipelineService: RolePipelineService;
  let userRolePipelineService: UserRolePipelineService;

  let testUserPassword: string;
  let testUser: TestUser;
  let seedUser: UserResponseDto;

  const createUserPayload: Partial<CreateUserDto> = {
    firstName: 'E2E',
    lastName: 'User',
    email: `${randomUUID()}@example.com`,
    password: 'testPassword123!',
    phone: '+1234567890',
    country: COUNTRIES.US,
    dateOfBirth: new Date('1990-01-01'),
    twoFactorSecret: 'secretTwoFactor',
    roleIds: [],
    storeIds: [],
  };

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({
      moduleFixture,
      systemUserId,
      testUser,
      testUserPassword,
      authorizedHeader,
      authorizedRootHeader,
      cacheSetSpy,
      cacheGetSpy,
      cacheGetByIdSpy,
      cacheInvalidateByIdSpy,
      cacheInvalidateByTagsSpy,
      cacheInvalidateByKeyPatternSpy,
      userPipelineService,
      userRolePipelineService,
      rolePipelineService,
    } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;
    createUserPayload.roleIds = [testUser.role.id];
    createUserPayload.storeIds = [testUser.store.id];
  });

  beforeEach(async () => {
    seedUser = await createTestUser({
      userPipelineService,
      overrides: {
        email: `${randomUUID()}@target-e2e.com`,
        password: testUserPassword,
      },
      createdById: systemUserId,
    });

    createUserPayload.email = `${randomUUID()}@example.com`;

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

  describe('POST /v1/user', () => {
    it('201 CREATED - should successfully create a new user when strict and loose tokens exist as a root', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedRootHeader,
        payload: createUserPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload) as UserResponseDto;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(createUserPayload.email);
      expect(body.firstName).toBe(createUserPayload.firstName);
      expect(body.lastName).toBe(createUserPayload.lastName);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
      expect(body.userRoles).toHaveLength(1);
      expect(body.userStores).toHaveLength(1);

      body.userRoles?.forEach((userRole) => {
        expect(userRole.role).toBeDefined();
        expect(userRole.role?.id).toBe(testUser.role.id);
      });

      body.userStores?.forEach((userStore) => {
        expect(userStore.store).toBeDefined();
        expect(userStore.store?.id).toBe(testUser.store.id);
      });
    });

    it('201 CREATED - should successfully create a new user when strict and loose tokens exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload: createUserPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload) as UserResponseDto;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(createUserPayload.email);
      expect(body.firstName).toBe(createUserPayload.firstName);
      expect(body.lastName).toBe(createUserPayload.lastName);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);

      expect(body.userRoles).toHaveLength(1);
      expect(body.userStores).toHaveLength(1);

      body.userRoles?.forEach((userRole) => {
        expect(userRole.role).toBeDefined();
        expect(userRole.role?.id).toBe(testUser.role.id);
      });

      body.userStores?.forEach((userStore) => {
        expect(userStore.store).toBeDefined();
        expect(userStore.store?.id).toBe(testUser.store.id);
      });
    });

    it('201 CREATED - should strip role configurations from payload data if user lack loose permissions to assign role to user', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [ASSIGN_USER_ROLE],
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
        method: 'POST',
        url: '/v1/user',
        headers,
        payload: createUserPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload) as UserResponseDto;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(createUserPayload.email);
      expect(body.firstName).toBe(createUserPayload.firstName);
      expect(body.lastName).toBe(createUserPayload.lastName);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);

      expect(body.userRoles).toBeUndefined();
      expect(body.userStores).toHaveLength(1);

      body.userStores?.forEach((userStore) => {
        expect(userStore.store).toBeDefined();
        expect(userStore.store?.id).toBe(testUser.store.id);
      });
    });

    it('201 CREATED - should strip store configurations from payload data if user lack loose permissions to assign store to user', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: [ASSIGN_USER_STORE],
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
        method: 'POST',
        url: '/v1/user',
        headers,
        payload: createUserPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      const body = JSON.parse(response.payload) as UserResponseDto;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(createUserPayload.email);
      expect(body.firstName).toBe(createUserPayload.firstName);
      expect(body.lastName).toBe(createUserPayload.lastName);
      expect(cacheSetSpy).toHaveBeenCalledTimes(2);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(3);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);

      expect(body.userRoles).toHaveLength(1);
      expect(body.userStores).toBeUndefined();

      body.userRoles?.forEach((userRole) => {
        expect(userRole.role).toBeDefined();
        expect(userRole.role?.id).toBe(testUser.role.id);
      });
    });

    it('403 FORBIDDEN - should block route access if core creation permissions are missing from account context scopes', async () => {
      const headers = await changePermissionsForTestUser({
        permissionsToUnassign: CREATE_USER_ENDPOINT_PERMISSION,
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
        method: 'POST',
        url: '/v1/user',
        headers,
        payload: createUserPayload,
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

    it('400 BAD REQUEST - should drop connection parameters via ValidationPipe if input schemas are malformed', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload: { email: 'not-a-valid-email-string' },
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('422 Unprocessable role ids - Should throw error if received payload contains role id that does not exist', async () => {
      const randomRoleId = randomUUID();
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload: {
          ...createUserPayload,
          roleIds: [randomRoleId],
        },
      });

      expect(response.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: `Failed to validate role. The following role ids do not exist: ${randomRoleId}`,
          error: 'Unprocessable Entity',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('422 Unprocessable store ids - Should throw error if received payload contains store id that does not exist', async () => {
      const randomStoreId = randomUUID();
      const response = await app.inject({
        method: 'POST',
        url: '/v1/user',
        headers: authorizedHeader,
        payload: {
          ...createUserPayload,
          storeIds: [randomStoreId],
        },
      });

      expect(response.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          message: `Failed to validate store. The following store ids do not exist: ${randomStoreId}`,
          error: 'Unprocessable Entity',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('GET /v1/user/id/:id', () => {
    it('200 OK - Should find user by its id as root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/id/${seedUser.id}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateUserResponseDto({
        response: body,
        expected: seedUser,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('200 OK - Should find user by its id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/id/${seedUser.id}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateUserResponseDto({
        response: body,
        expected: seedUser,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should issue standard error data templates if target identifier parameter cannot be matched', async () => {
      const randomId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/id/${randomId}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            'Could not find any entity of type "User" matching: {\n' +
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

    it('400 BAD REQUEST - should fail execution tracking early via ParseUUIDPipe rules if string format is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/user/id/invalid-uuid-alphanumeric-token',
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
  });
  describe('GET /v1/user/email/:email', () => {
    it('200 OK - Should find user by its email as root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/email/${seedUser.email}`,
        headers: authorizedRootHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateUserResponseDto({
        response: body,
        expected: seedUser,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });
    it('200 OK - Should find user by its email', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/email/${seedUser.email}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.OK);
      const body = JSON.parse(response.payload);
      validateUserResponseDto({
        response: body,
        expected: seedUser,
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
      expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(0);
    });

    it('404 NOT FOUND - should issue standard error data templates if target identifier parameter cannot be matched', async () => {
      const randomId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/v1/user/email/${randomId}`,
        headers: authorizedHeader,
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(JSON.parse(response.body)).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message:
            'Could not find any entity of type "User" matching: {\n' +
            '    "where": {\n' +
            `        "email": "${randomId}"\n` +
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
  });

  // describe('GET /v1/user', () => {
  //   it('200 OK - should scan structural layouts using query limit tags inside index route trackers', async () => {
  //     const response = await app.inject({
  //       method: 'GET',
  //       url: '/v1/user',
  //       headers: authorizedHeader,
  //       query: { page: '1', limit: '5' },
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.OK);
  //     const body = JSON.parse(response.payload);
  //     expect(body).toHaveProperty('data');
  //     expect(Array.isArray(body.data)).toBe(true);
  //   });
  // });

  // describe('PATCH /v1/user/:id', () => {
  //   it('200 OK - should map data modification adjustments smoothly and return operational true indicators', async () => {
  //     const payload = {
  //       firstName: `MUTATED_NAME_${randomUUID().substring(0, 8)}`,
  //     };

  //     const response = await app.inject({
  //       method: 'PATCH',
  //       url: `/v1/user/${seedUser.id}`,
  //       headers: authorizedHeader,
  //       payload,
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.OK);
  //     expect(response.payload).toBe('true');
  //   });

  //   it('404 NOT FOUND - should abort operational chains if FetchUserPipe discovers user assets are missing', async () => {
  //     const response = await app.inject({
  //       method: 'PATCH',
  //       url: `/v1/user/${randomUUID()}`,
  //       headers: authorizedHeader,
  //       payload: { firstName: 'Ghost' },
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  //   });
  // });

  // describe('DELETE /v1/user/:id', () => {
  //   it('204 NO CONTENT - should successfully drop model targets completely when loose conditions are met', async () => {
  //     const deleteUserTarget = await createTestUser({
  //       userPipelineService,
  //       overrides: { email: `${randomUUID()}@transient-delete.com` },
  //       createdById: systemUserId,
  //     });

  //     const response = await app.inject({
  //       method: 'DELETE',
  //       url: `/v1/user/${deleteUserTarget.id}`,
  //       headers: authorizedHeader,
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
  //   });

  //   it('204 NO CONTENT - should securely complete deletion cycles even if loose relational removal authorization is absent', async () => {
  //     await unAssignPermissionFromRole({
  //       rolePipelineService,
  //       testRole,
  //       permissionsToUnassign: [
  //         READ_ROLE,
  //         READ_USER_ROLE,
  //         UNASSIGN_USER_ROLE,
  //         READ_STORE,
  //         READ_USER_STORE,
  //         UNASSIGN_USER_STORE,
  //       ],
  //       systemUserId,
  //     });

  //     const headers = await loginTestUser({
  //       app,
  //       email: testUser.email,
  //       password: testUserPassword,
  //     });

  //     const deleteUserTarget = await createTestUser({
  //       userPipelineService,
  //       overrides: { email: `${randomUUID()}@loose-transient-delete.com` },
  //       createdById: systemUserId,
  //     });

  //     const response = await app.inject({
  //       method: 'DELETE',
  //       url: `/v1/user/${deleteUserTarget.id}`,
  //       headers,
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
  //   });

  //   it('404 NOT FOUND - should cancel deletion pipeline requests if FetchFullUserPipe unmasks an empty identifier', async () => {
  //     const response = await app.inject({
  //       method: 'DELETE',
  //       url: `/v1/user/${randomUUID()}`,
  //       headers: authorizedHeader,
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  //   });

  //   it('403 FORBIDDEN - should restrict execution routines instantly if strict core deletion scopes are missing', async () => {
  //     await unAssignPermissionFromRole({
  //       rolePipelineService,
  //       testRole,
  //       permissionsToUnassign: DELETE_USER_ENDPOINT_PERMISSION,
  //       systemUserId,
  //     });

  //     const headers = await loginTestUser({
  //       app,
  //       email: testUser.email,
  //       password: testUserPassword,
  //     });
  //     const response = await app.inject({
  //       method: 'DELETE',
  //       url: `/v1/user/${seedUser.id}`,
  //       headers,
  //     });

  //     expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
  //   });
  // });
});
