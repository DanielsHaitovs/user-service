import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import type { CreateUserDto } from '@/user/dto/user.dto';
import { generatePassword } from '@/utils/token-generator.util';
import { faker } from '@faker-js/faker/.';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  type INestApplication,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';

import { createNewDepartmentApi } from './department-api';
import {
  findPermissionsByCodesApi,
  generateNewPermissionsApi,
} from './permissions-api';
import { addPermissionsToRoleApi, createNewRoleApi } from './role-api';

export async function createNewUser(
  app: INestApplication,
  requiredPermissions: string[],
  accessToken: string,
): Promise<{
  id: UUID;
  email: string;
  password: string;
}> {
  const httpServer = app.getHttpServer() as Server;

  const department = await createNewDepartmentApi(app, accessToken);
  const role = await createNewRoleApi(app, accessToken, undefined);

  if (requiredPermissions.length === 0) {
    const permissions = await generateNewPermissionsApi(app, accessToken);

    await addPermissionsToRoleApi(
      app,
      accessToken,
      role.id,
      permissions.map((p) => p.id),
    );
  } else {
    await generateNewPermissionsApi(app, accessToken, requiredPermissions);

    const permissions = await findPermissionsByCodesApi(
      app,
      accessToken,
      requiredPermissions.length > 0 ? requiredPermissions : [],
    );

    await addPermissionsToRoleApi(
      app,
      accessToken,
      role.id,
      permissions.map((p) => p.id),
    );
  }

  const password = generatePassword();
  const userEmail = faker.internet.email();

  const userDto: CreateUserDto = {
    departmentIds: [department.id],
    roleIds: [role.id],
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: userEmail,
    password,
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate(),
    isTwoFactorEnabled: true,
    isActive: true,
    isEmailVerified: false,
  };

  const user = await request(httpServer)
    .post('/users')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(userDto);

  if (user.status === 403) {
    throw new ForbiddenException(user.body.message);
  }

  if (user.status === 500) {
    throw new BadRequestException(user.body.message);
  }

  if (user.status === 409) {
    throw new ConflictException(user.body.message);
  }

  if (user.status === 404) {
    throw new EntityNotFoundError('User', user.body.message);
  }

  return {
    id: user.body.id,
    email: userEmail,
    password,
  };
}

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
