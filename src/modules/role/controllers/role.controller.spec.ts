import {
  CREATE_PERMISSION,
  CREATE_ROLE,
  DELETE_ROLE,
  READ_PERMISSION,
  READ_ROLE,
  UPDATE_ROLE,
} from '@/lib/const/role.const';
import type { CreateRoleDto, UpdateRoleDto } from '@/role/dto/role.dto';
import { initTestUser, systemUserAuthToken } from '@/test/api/auth-user-api';
import { generateNewPermissionsApi } from '@/test/api/permissions-api';
import {
  createNewRoleApi,
  deleteRolesApi,
  findRolesByIdsApi,
  searchRolesByValueApi,
  updateRoleApi,
} from '@/test/api/role-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('RoleController', () => {
  let app: INestApplication<App>;
  let systemToken: string;
  let httpServer: Server;

  beforeAll(async () => {
    ({ app } = await bootstrapTestApp());
    httpServer = app.getHttpServer() as Server;
    systemToken = await systemUserAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/role (POST)', () => {
    it('/role (POST) - should allow user to create new role', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        READ_PERMISSION,
      ]);

      await createNewRoleApi(app, userToken, undefined);
    });
    it('/role (POST) - should not allow user to create new role because user access is forbiden', async () => {
      await expect(createNewRoleApi(app, '', undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/role (POST) - should not allow user to create new role because its missing permission read:role', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_PERMISSION,
      ]);

      await expect(createNewRoleApi(app, userToken, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/role (POST) - should not allow user to create new role because its missing permission create:role', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(createNewRoleApi(app, userToken, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/role (POST) - should not allow user to create new role because its missing permission create:permissions', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_ROLE,
      ]);

      await expect(createNewRoleApi(app, userToken, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/role (POST) - should not allow user to create new role because its missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(createNewRoleApi(app, userToken, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/role (POST) - should not allow user to create new role when body is missing', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(
        createNewRoleApi(app, userToken, {} as CreateRoleDto),
      ).rejects.toThrow(BadRequestException);
    });
    it('/role (POST) - should not allow user to create new role when name is not unique', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_ROLE,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);

      await expect(
        createNewRoleApi(app, userToken, { name: role.name }),
      ).rejects.toThrow(ConflictException);
    });
  });
  describe('/role (POST with Permissions)', () => {
    it('/role (POST) - should allow user to create new role with Permissions', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      await createNewRoleApi(app, userToken, {
        name: `role-with-permissions-${uuid()}`,
        permissions: permissions.map((p) => p.code),
      });
    });
    it('/role (POST) - should not allow user to create new role because user is not authorized', async () => {
      await expect(createNewRoleApi(app, '', undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/role (POST) - should not allow user to create new role because its missing permission to read role entity', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_PERMISSION,
        UPDATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      await expect(
        createNewRoleApi(app, userToken, {
          name: `role-with-permissions-${uuid()}`,
          permissions: permissions.map((p) => p.code),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (POST) - should not allow user to create new role because its missing permission to create role entity', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
        UPDATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      await expect(
        createNewRoleApi(app, userToken, {
          name: `role-with-permissions-${uuid()}`,
          permissions: permissions.map((p) => p.code),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (POST) - should not allow user to create new role because its missing permission to read permissions entity', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        UPDATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      await expect(
        createNewRoleApi(app, userToken, {
          name: `role-with-permissions-${uuid()}`,
          permissions: permissions.map((p) => p.code),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (POST) - should not allow user to create new role because its missing permission to update role entity', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        CREATE_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      await expect(
        createNewRoleApi(app, userToken, {
          name: `role-with-permissions-${uuid()}`,
          permissions: permissions.map((p) => p.code),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (POST) - should not allow user to create new role because its missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(createNewRoleApi(app, userToken, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/role (POST) - should not allow user to create new role when body is missing', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(
        createNewRoleApi(app, userToken, {} as CreateRoleDto),
      ).rejects.toThrow(BadRequestException);
    });
    it('/role (POST) - should not allow user to create new role when name is not unique', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_ROLE,
        READ_ROLE,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);
      const permissions = await generateNewPermissionsApi(app, systemToken);

      await expect(
        createNewRoleApi(app, userToken, {
          name: role.name,
          permissions: permissions.map((p) => p.code),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
  describe('/role (GET) find by Ids', () => {
    it('/role (GET) - should retrieve permissions by ids', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_ROLE],
      );

      await findRolesByIdsApi(app, targetToken, [role.id]);
    });
    it('/role (GET) - should not retrieve roles by ids because user does not have permission -> read role ', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);
      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(
        findRolesByIdsApi(app, targetToken, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (GET) - should not retrieve role by ids because user is not authorized', async () => {
      await expect(
        findRolesByIdsApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/role (GET) - should not retrieve role by ids because ids are not found', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
      ]);

      await expect(
        findRolesByIdsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/role (GET) - should not retrieve role by ids because ids are not UUID', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
      ]);

      await request(httpServer)
        .get('/roles/attributes/ids?ids=aaaa&page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });
  describe('/role (GET) search by value', () => {
    it('/role (GET) - should search permissions by value like name or id', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_ROLE],
      );

      const partialValue = role.name.slice(0, 5);

      await searchRolesByValueApi(app, targetToken, partialValue);
    });
    it('/role (GET) - should not search roles by value because user does not have permission -> read role', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_ROLE,
        READ_PERMISSION,
      ]);

      const role = await createNewRoleApi(app, userToken, undefined);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      const partialValue = role.name.slice(0, 5);

      await expect(
        searchRolesByValueApi(app, targetToken, partialValue),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (GET) - should not retrieve role by value because user is not authorized', async () => {
      await expect(searchRolesByValueApi(app, '', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('/role (PATCH)', () => {
    it('/role (PATCH) - should update role name', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        UPDATE_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);
      const updateDto: UpdateRoleDto = {
        name: `${role.name}-updated`,
      };

      await updateRoleApi(app, userToken, updateDto, role.id);
    });
    it('/role (PATCH) - should not update role because is not authorized', async () => {
      await expect(
        updateRoleApi(app, '', { name: 'random name' }, uuid() as UUID),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/role (PATCH) - should not update role because is user does not have required permission -> role:update', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);
      const updateDto: UpdateRoleDto = {
        name: `${role.name}-updated`,
      };

      await expect(
        updateRoleApi(app, userToken, updateDto, role.id),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (PATCH) - should not update role because role id does not exist', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        UPDATE_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);
      const updateDto: UpdateRoleDto = {
        name: `${role.name}-updated`,
      };

      await expect(
        updateRoleApi(app, userToken, updateDto, uuid() as UUID),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/role (PATCH) - should not update role because role name already exists', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        UPDATE_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);
      const secondRole = await createNewRoleApi(app, systemToken, undefined);

      const updateDto: UpdateRoleDto = {
        name: role.name,
      };

      await expect(
        updateRoleApi(app, userToken, updateDto, secondRole.id),
      ).rejects.toThrow(ConflictException);
    });
  });
  describe('/role (DELETE)', () => {
    it('/role (DELETE) - should delete role by ids', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        DELETE_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);
      const deletedPermissions = await deleteRolesApi(app, userToken, [
        role.id,
      ]);

      expect(deletedPermissions).toBeDefined();
      expect(deletedPermissions.deleted).toBe(1);
    });
    it('/role (DELETE) - should not delete role by ids because user is not authorized', async () => {
      await expect(deleteRolesApi(app, '', [uuid() as UUID])).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/role (DELETE) - should not delete role because is user does not have required permission -> role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        DELETE_ROLE,
      ]);

      await expect(
        deleteRolesApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (DELETE) - should not delete role because is user does not have required permission -> role:delete', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
      ]);

      await expect(
        deleteRolesApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/role (DELETE) - should not delete role because is role ids are not found', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_ROLE,
        DELETE_ROLE,
      ]);

      await expect(
        deleteRolesApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
