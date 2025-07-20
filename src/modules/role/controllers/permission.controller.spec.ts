import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import {
  CREATE_PERMISSION,
  CREATE_ROLE,
  DELETE_PERMISSION,
  READ_PERMISSION,
  READ_ROLE,
  UPDATE_PERMISSION,
} from '@/lib/const/role.const';
import { createTestModule } from '@/test/db.connection';
import { initTestUser } from '@/test/helper/auth-user-api';
import { systemUserAuthToken } from '@/test/helper/create-api-user';
import {
  createNewPermissionApi,
  deletePermissionsApi,
  findPermissionsByCodesApi,
  findPermissionsByIdsApi,
  generateNewPermissionsApi,
  searchPermissionsByValueApi,
  updatePermissionsApi,
  validatePermissionApiResponse,
} from '@/test/helper/permissions-api';
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

import type { Permission } from '../entities/permissions.entity';

describe('PermissionController', () => {
  let app: INestApplication<App>;
  let systemToken: string;
  let httpServer: Server;

  beforeAll(async () => {
    const { module } = await createTestModule();
    app = module.createNestApplication();
    app.useGlobalFilters(new EntityNotFoundFilter());

    await app.init();

    httpServer = app.getHttpServer() as Server;

    systemToken = await systemUserAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/permissions (POST)', () => {
    it('/permissions (POST) - should allow user to create new permissions', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);
    });
    it('/permissions (POST) - should not allow user to create new permissions because user access is forbiden', async () => {
      await expect(generateNewPermissionsApi(app, '')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions because its missing permission to read permissions entity', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
      ]);

      await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions because its missing permission to create permissions entity', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions because its missing permission to read role entity', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions because its missing required permissions', async () => {
      const userToken = await initTestUser(app, systemToken, []);

      await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions body is missing', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      await expect(createNewPermissionApi(app, userToken, [])).rejects.toThrow(
        BadRequestException,
      );
    });
    it('/permissions (POST) - should not allow user to create new permissions body is missing permission code', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      await expect(
        createNewPermissionApi(app, userToken, [{ name: 'Name', roleIds: [] }]),
      ).rejects.toThrow(BadRequestException);
    });
    it('/permissions (POST) - should not allow user to create new permissions body is missing permission name', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      await expect(
        createNewPermissionApi(app, userToken, [
          { name: '', code: 'code', roleIds: [] },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
    it('/permissions (POST) - should not allow user to create new permissions when name is not unique', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const unniqueValue = uuid();

      await createNewPermissionApi(app, userToken, [
        { name: unniqueValue, code: unniqueValue, roleIds: [] },
      ]);

      await expect(
        createNewPermissionApi(app, userToken, [
          { name: unniqueValue, code: `${unniqueValue}-1`, roleIds: [] },
        ]),
      ).rejects.toThrow(ConflictException);
    });
    it('/permissions (POST) - should not allow user to create new permissions when code is not unique', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const unniqueValue = uuid();
      await createNewPermissionApi(app, userToken, [
        { name: unniqueValue, code: unniqueValue, roleIds: [] },
      ]);

      await expect(
        createNewPermissionApi(app, userToken, [
          { name: `${unniqueValue}-1`, code: unniqueValue, roleIds: [] },
        ]),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('/permissions (GET) find by Ids', () => {
    it('/permissions (GET) - should retrieve permissions by ids', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      const foundPermissions = await findPermissionsByIdsApi(
        app,
        targetToken,
        permissions.map((p) => p.id),
      );

      validatePermissionApiResponse(foundPermissions);
    });
    it('/permissions (GET) - should not retrieve permissions by ids because user does not have permission -> read role ', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
      ]);

      await expect(
        findPermissionsByIdsApi(
          app,
          targetToken,
          permissions.map((p) => p.id),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (GET) - should not retrieve permissions by ids because user does not have permission -> read permissions ', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [READ_ROLE]);

      await expect(
        findPermissionsByIdsApi(
          app,
          targetToken,
          permissions.map((p) => p.id),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (GET) - should not retrieve permissions by ids because user is not authorized', async () => {
      await expect(
        findPermissionsByIdsApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/permissions (GET) - should not retrieve permissions by ids because ids are not found', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(
        findPermissionsByIdsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/permissions (GET) - should not retrieve permissions by ids because ids are not UUID', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await request(httpServer)
        .get('/permission/ids?ids=aaaa')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('/permissions (GET) find by codes', () => {
    it('/permissions (GET) - should retrieve permissions by codes', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      const foundPermissions = await findPermissionsByCodesApi(
        app,
        targetToken,
        permissions.map((p) => p.code),
      );

      validatePermissionApiResponse(foundPermissions);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because user does not have permission -> read role ', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
      ]);

      await expect(
        findPermissionsByCodesApi(
          app,
          targetToken,
          permissions.map((p) => p.code),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because user does not have permission -> read permissions ', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [READ_ROLE]);

      await expect(
        findPermissionsByCodesApi(
          app,
          targetToken,
          permissions.map((p) => p.code),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because user is not authorized', async () => {
      await expect(
        findPermissionsByCodesApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because codes are not found', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await expect(
        findPermissionsByCodesApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because codes are not string', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        READ_PERMISSION,
      ]);

      await request(httpServer)
        .get('/permission/codes?codes[0]={}&codes[1]=456')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });
  describe('/permissions (GET) search by value', () => {
    it('/permissions (GET) - should search permissions by value', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
      ]);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test search');
      }

      const partialValue = permissions[0].code.slice(0, 5);

      const { permissions: foundPermissions } =
        await searchPermissionsByValueApi(app, targetToken, partialValue);

      validatePermissionApiResponse(foundPermissions as Permission[]);
    });
    it('/permissions (GET) - should not search permissions by value because user does not have permission -> read permissions', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_ROLE,
        CREATE_PERMISSION,
        READ_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      const targetToken = await initTestUser(app, systemToken, []);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test search');
      }

      const partialValue = permissions[0].code.slice(0, 3);

      await expect(
        searchPermissionsByValueApi(app, targetToken, partialValue),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (GET) - should not retrieve permissions by codes because user is not authorized', async () => {
      await expect(searchPermissionsByValueApi(app, '', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('/permissions (PATCH)', () => {
    it('/permissions (PATCH) - should update permission name and code', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test update');
      }

      permissions[0].code = `${permissions[0].code}-updated`;
      permissions[0].name = `${permissions[0].name}-updated`;

      const updatedPermissions = await updatePermissionsApi(
        app,
        userToken,
        { name: permissions[0].name, code: permissions[0].code },
        permissions[0].id,
      );

      validatePermissionApiResponse([updatedPermissions]);
    });
    it('/permissions (PATCH) - should not update permission because is not authorized', async () => {
      await expect(
        updatePermissionsApi(
          app,
          '',
          { name: 'zdfs', code: 'asdasd' },
          uuid() as UUID,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/permissions (PATCH) - should not update permission because is user does not have required permission -> permission:read', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test update');
      }

      const targetToken = await initTestUser(app, systemToken, [
        UPDATE_PERMISSION,
      ]);

      permissions[0].code = `${permissions[0].code}-updated`;
      permissions[0].name = `${permissions[0].name}-updated`;

      await expect(
        updatePermissionsApi(
          app,
          targetToken,
          { name: permissions[0].name, code: permissions[0].code },
          permissions[0].id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (PATCH) - should not update permission because is user does not have required permission -> permission:update', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test update');
      }

      const targetToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
      ]);

      permissions[0].code = `${permissions[0].code}-updated`;
      permissions[0].name = `${permissions[0].name}-updated`;

      await expect(
        updatePermissionsApi(
          app,
          targetToken,
          { name: permissions[0].name, code: permissions[0].code },
          permissions[0].id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/permissions (PATCH) - should not update permission because permission id does not exist', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined) {
        throw new Error('No permissions found to test update');
      }

      permissions[0].code = `${permissions[0].code}-updated`;
      permissions[0].name = `${permissions[0].name}-updated`;

      await expect(
        updatePermissionsApi(
          app,
          userToken,
          { name: permissions[0].name, code: permissions[0].code },
          uuid() as UUID,
        ),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/permissions (PATCH) - should not update permission because permission name already exists', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test update');
      }

      permissions[1].code = `${permissions[1].code}-updated`;

      await expect(
        updatePermissionsApi(
          app,
          userToken,
          { name: permissions[0].name, code: permissions[1].code },
          permissions[1].id,
        ),
      ).rejects.toThrow(ConflictException);
    });
    it('/permissions (PATCH) - should not update permission because permission code already exists', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        CREATE_PERMISSION,
        UPDATE_PERMISSION,
        READ_ROLE,
        CREATE_ROLE,
      ]);

      const permissions = await generateNewPermissionsApi(app, userToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test update');
      }

      permissions[1].name = `${permissions[1].name}-updated`;

      await expect(
        updatePermissionsApi(
          app,
          userToken,
          { name: permissions[1].name, code: permissions[0].code },
          permissions[1].id,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('/permissions (DELETE)', () => {
    it('/permissions (DELETE) - should delete permission by ids', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        DELETE_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test delete');
      }

      const ids = permissions.map((p) => p.id);

      const deletedPermissions = await deletePermissionsApi(
        app,
        userToken,
        ids,
      );

      expect(deletedPermissions).toBeDefined();
      expect(deletedPermissions.deleted).toBe(2);
    });
    it('/permissions (DELETE) - should not delete permission by ids because user is not authorized', async () => {
      await expect(
        deletePermissionsApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/permissions (DELETE) - should not delete permission because is user does not have required permission -> permission:read', async () => {
      const userToken = await initTestUser(app, systemToken, [
        DELETE_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test delete');
      }

      const ids = permissions.map((p) => p.id);

      await expect(deletePermissionsApi(app, userToken, ids)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (DELETE) - should not delete permission because is user does not have required permission -> permission:delete', async () => {
      const userToken = await initTestUser(app, systemToken, [READ_PERMISSION]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test delete');
      }

      const ids = permissions.map((p) => p.id);

      await expect(deletePermissionsApi(app, userToken, ids)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/permissions (DELETE) - should not delete permission because permission id was not found', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_PERMISSION,
        DELETE_PERMISSION,
      ]);

      const permissions = await generateNewPermissionsApi(app, systemToken);

      validatePermissionApiResponse(permissions);

      if (permissions[0] === undefined || permissions[1] === undefined) {
        throw new Error('No permissions found to test delete');
      }

      await expect(
        deletePermissionsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
