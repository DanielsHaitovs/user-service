import { createNewDepartmentApi } from '@/test/api/department-api';
import {
  findPermissionsByCodesApi,
  generateNewPermissionsApi,
} from '@/test/api/permissions-api';
import { addPermissionsToRoleApi, createNewRoleApi } from '@/test/api/role-api';
import { validateResponse } from '@/test/validation/request';
import type { CreateUserDto } from '@/user/dto/user.dto';
import { generatePassword } from '@/utils/token-generator.util';
import { faker } from '@faker-js/faker/.';
import type { INestApplication } from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';

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
    const permissions = await findPermissionsByCodesApi(
      app,
      accessToken,
      requiredPermissions.length > 0 ? requiredPermissions : [],
      false,
    );

    if (permissions.length < requiredPermissions.length) {
      const missing = await generateNewPermissionsApi(
        app,
        accessToken,
        requiredPermissions.filter(
          (p) => !permissions.map((perm) => perm.code).includes(p),
        ),
      );
      permissions.push(...missing);
    }

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
    phone: '+37123456789',
    dateOfBirth: faker.date.birthdate(),
    isTwoFactorEnabled: true,
    isActive: true,
    isEmailVerified: false,
  };

  const response = await request(httpServer)
    .post('/user')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(userDto);

  validateResponse({ response, alias: 'User' });

  return {
    id: response.body.id,
    email: userEmail,
    password,
  };
}
