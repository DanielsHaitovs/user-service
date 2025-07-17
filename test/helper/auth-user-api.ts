import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import type { INestApplication } from '@nestjs/common';

import type { Server } from 'http';
import * as request from 'supertest';

import { createNewUser } from './create-api-user';

export async function systemUserAuthToken(
  app: INestApplication,
): Promise<string> {
  const httpServer = app.getHttpServer() as Server;
  const res = await request(httpServer)
    .post('/auth/login')
    .send({
      email: SYSTEM_USER_EMAIL,
      password: SYSTEM_USER_PASSWORD,
    })
    .expect(200);

  return res.body.access_token as string;
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const httpServer = app.getHttpServer() as Server;
  const res = await request(httpServer)
    .post('/auth/login')
    .send({
      email,
      password,
    })
    .expect(200);

  return res.body.access_token as string;
}

export async function initTestUser(
  app: INestApplication,
  accessToken: string,
  permissions: string[],
): Promise<string> {
  const user = await createNewUser(app, permissions, accessToken);

  return await loginUser(app, user.email, user.password);
}
