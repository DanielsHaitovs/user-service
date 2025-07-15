import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import {
  CREATE_PERMISSION,
  READ_PERMISSION,
  READ_ROLE,
} from '@/lib/const/role.const';
import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import { createTestModule } from '@/test/db.connection';
import { createNewUser } from '@/test/helper/create-api-user';
import {
  createNewPermissionApi,
  findPermissionsByIdsApi,
  generateNewPermissionsApi,
  validatePermissionApiResponse,
} from '@/test/helper/permissions-api';
import {
  BadRequestException,
  ForbiddenException,
  type INestApplication,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('PermissionController', () => {
  let app: INestApplication<App>;
  let systemToken: string;

  beforeAll(async () => {
    const { module } = await createTestModule();
    app = module.createNestApplication();
    app.useGlobalFilters(new EntityNotFoundFilter());
    await app.init();

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: SYSTEM_USER_EMAIL,
        password: SYSTEM_USER_PASSWORD,
      })
      .expect(200);

    systemToken = res.body.access_token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/permissions (POST) - should allow user to create new permissions', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    const permissions = await generateNewPermissionsApi(app, userToken);

    validatePermissionApiResponse(permissions);
  });
  it('/permissions (POST) - should not allow user to create new permissions because its missing permission to read permissions entity', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('/permissions (POST) - should not allow user to create new permissions because its missing permission to create permissions entity', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('/permissions (POST) - should not allow user to create new permissions because its missing permission to read role entity', async () => {
    const user = await createNewUser(
      app,
      [CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('/permissions (POST) - should not allow user to create new permissions because its missing required permissions', async () => {
    const user = await createNewUser(app, [], systemToken);

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('/permissions (POST) - should not allow user to create new permissions body is missing', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(createNewPermissionApi(app, userToken, [])).rejects.toThrow(
      BadRequestException,
    );
  });
  it('/permissions (POST) - should not allow user to create new permissions body is missing permission code', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(
      createNewPermissionApi(app, userToken, [{ name: 'Name', roleIds: [] }]),
    ).rejects.toThrow(BadRequestException);
  });
  it('/permissions (POST) - should not allow user to create new permissions body is missing permission name', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(
      createNewPermissionApi(app, userToken, [
        { name: '', code: 'code', roleIds: [] },
      ]),
    ).rejects.toThrow(BadRequestException);
  });
  it('/permissions (GET) - should retrieve permissions by ids', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    const permissions = await generateNewPermissionsApi(app, userToken);

    validatePermissionApiResponse(permissions);

    const newUser = await createNewUser(
      app,
      [READ_ROLE, READ_PERMISSION],
      systemToken,
    );

    const newUserAuth = await request(httpServer)
      .post('/auth/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      })
      .expect(200);

    const targetToken = newUserAuth.body.access_token as string;

    const foundPermissions = await findPermissionsByIdsApi(
      app,
      targetToken,
      permissions.map((p) => p.id),
    );

    validatePermissionApiResponse(foundPermissions);
  });
  it('/permissions (GET) - should not retrieve permissions by ids because ids are not found', async () => {
    const user = await createNewUser(
      app,
      [READ_ROLE, READ_PERMISSION],
      systemToken,
    );

    const httpServer = app.getHttpServer() as Server;
    const res = await request(httpServer)
      .post('/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    const userToken = res.body.access_token as string;

    await expect(
      findPermissionsByIdsApi(app, userToken, [uuid() as UUID]),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
