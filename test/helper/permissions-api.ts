import type { CreatePermissionDto } from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { Role } from '@/role/entities/role.entity';
import {
  BadRequestException,
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { Server } from 'http';
import * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createNewPermissionsApi(
  app: INestApplication,
  accessToken: string,
  permissions?: string[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const dto = new Array<CreatePermissionDto>();

  if (permissions === undefined || permissions.length === 0) {
    dto.push({
      name: `Permission-${uuid()}`,
      code: `permission-${uuid()}`,
      roleIds: [],
    });
    dto.push({
      name: `Permission2-${uuid()}`,
      code: `permission2-${uuid()}`,
      roleIds: [],
    });
  } else {
    const existingPermissions = await findPermissionsByCodesApi(
      app,
      accessToken,
      permissions,
    );

    const missing = existingPermissions.filter(
      (p) => !permissions.includes(p.code),
    );

    if (missing.length !== 0 && existingPermissions.length > 0) {
      dto.push(
        ...missing.map((p) => ({
          name: p.code,
          code: p.code,
          roleIds: [],
        })),
      );
    } else if (missing.length === 0) {
      return existingPermissions;
    }
  }

  const newPermissions = await request(httpServer)
    .post('/permission')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  if (newPermissions.status === 403) {
    throw new ForbiddenException(newPermissions.body.message);
  }

  if (newPermissions.status === 401) {
    throw new UnauthorizedException(newPermissions.body.message);
  }

  if (newPermissions.status === 404) {
    throw new EntityNotFoundError('Permission', newPermissions.body.message);
  }

  if (newPermissions.status === 500) {
    throw new BadRequestException(newPermissions.body.message);
  }

  return newPermissions.body as Permission[];
}

export async function findPermissionsByCodesApi(
  app: INestApplication,
  accessToken: string,
  permissions: string[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = permissions
    .map((p) => `permissionCodes=${p}`)
    .join('&');

  const newPermissions = await request(httpServer)
    .get(`/roles/query/filter?${permissionQuery}&page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (newPermissions.status === 403) {
    throw new ForbiddenException(newPermissions.body.message);
  }

  if (newPermissions.status === 401) {
    throw new UnauthorizedException(newPermissions.body.message);
  }

  if (newPermissions.status === 500) {
    throw new BadRequestException(newPermissions.body.message);
  }

  if (newPermissions.status === 404) {
    throw new EntityNotFoundError('Permission', newPermissions.body.message);
  }

  if (newPermissions.body.roles.length === 0) {
    return [];
  }

  const roles = newPermissions.body.roles as Role[];

  return roles.flatMap((role) => role.permissions);
}

export function validatePermissionApiResponse(permissions: Permission[]): void {
  if (permissions.length === 0) {
    throw new Error('No permissions created');
  }

  expect(permissions).toBeDefined();
  expect(permissions.length).toBeGreaterThan(0);

  permissions.forEach((permission) => {
    expect(permission).toHaveProperty('id');
    expect(permission).toHaveProperty('name');
    expect(permission).toHaveProperty('code');
  });
}
