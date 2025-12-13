/* eslint-disable @typescript-eslint/require-await */

/* eslint-disable unused-imports/no-unused-vars */
// import {
//   SYSTEM_USER_EMAIL,
//   SYSTEM_USER_PASSWORD,
// } from '@/lib/const/user.const';
import type { INestApplication } from '@nestjs/common';

import type { UUID } from 'crypto';
// import type { Server } from 'http';
// import * as request from 'supertest';

// export async function systemUserAuthToken(
//   app: INestApplication,
// ): Promise<string> {
//   const httpServer = app.getHttpServer() as Server;
//   const res = await request(httpServer)
//     .post('/auth/login')
//     .send({
//       email: SYSTEM_USER_EMAIL,
//       password: SYSTEM_USER_PASSWORD,
//     })
//     .expect(200);

//   return res.body.access_token as string;
// }

export async function getSystemUserId(app: INestApplication): Promise<UUID> {
  // const accessToken = await systemUserAuthToken(app);

  // const httpServer = app.getHttpServer() as Server;

  // const res = await request(httpServer)
  //   .get(`/user/email/${SYSTEM_USER_EMAIL}`)
  //   .set('Authorization', `Bearer ${accessToken}`)
  //   .expect(200);

  return '0155036c-184e-426b-9661-57cdd0bbb6c2';
}

// export async function loginUser(
//   app: INestApplication,
//   email: string,
//   password: string,
// ): Promise<string> {
//   const httpServer = app.getHttpServer() as Server;
//   const res = await request(httpServer)
//     .post('/auth/login')
//     .send({
//       email,
//       password,
//     })
//     .expect(200);

//   return res.body.access_token as string;
// }

// export async function verifyUser(
//   app: INestApplication,
//   accessToken: string,
//   id: UUID,
// ): Promise<void> {
//   const httpServer = app.getHttpServer() as Server;
//   await request(httpServer)
//     .patch(`/user/id/${id}`)
//     .set('Authorization', `Bearer ${accessToken}`)
//     .send({
//       isEmailVerified: true,
//     })
//     .expect(200);
// }

// export async function initTestUser(
//   app: INestApplication,
//   accessToken: string,
//   permissions: string[],
//   verify?: boolean,
// ): Promise<{ userId: UUID; accessToken: string }> {
//   const user = await createNewUser(app, permissions, accessToken);

//   if (verify !== undefined && verify) {
//     await verifyUser(app, accessToken, user.id);
//   }

//   const userAccessToken = await loginUser(app, user.email, user.password);

//   return {
//     userId: user.id,
//     accessToken: userAccessToken,
//   };
// }
