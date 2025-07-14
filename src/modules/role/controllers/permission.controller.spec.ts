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
  createNewPermissionsApi,
  validatePermissionApiResponse,
} from '@/test/helper/permissions-api';
import { ForbiddenException, type INestApplication } from '@nestjs/common';

import type { Server } from 'http';
import * as request from 'supertest';
import type { App } from 'supertest/types';

describe('PermissionController', () => {
  let app: INestApplication<App>;
  let systemToken: string;

  beforeAll(async () => {
    const { module } = await createTestModule();
    app = module.createNestApplication();
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

    const permissions = await createNewPermissionsApi(app, userToken);

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

    await expect(createNewPermissionsApi(app, userToken)).rejects.toThrow(
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

    await expect(createNewPermissionsApi(app, userToken)).rejects.toThrow(
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

    await expect(createNewPermissionsApi(app, userToken)).rejects.toThrow(
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

    await expect(createNewPermissionsApi(app, userToken)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
