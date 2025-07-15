import type { CreatePermissionDto } from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { Role } from '@/role/entities/role.entity';
import {
  BadRequestException,
  ForbiddenException,
  type INestApplication,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createNewPermissionApi(
  app: INestApplication,
  accessToken: string,
  permissions: Partial<CreatePermissionDto>[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const newPermissions = await request(httpServer)
    .post('/permission')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(permissions);

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
    throw new InternalServerErrorException(newPermissions.body.message);
  }

  if (newPermissions.status === 400) {
    throw new BadRequestException(newPermissions.body.message);
  }

  return newPermissions.body as Permission[];
}

export async function generateNewPermissionsApi(
  app: INestApplication,
  accessToken: string,
  permissions?: string[],
  roleIds?: UUID[],
  name?: string,
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const dto = new Array<CreatePermissionDto>();
  roleIds = roleIds ?? [];
  if (permissions === undefined || permissions.length === 0) {
    name = name ?? `Permission-${uuid()}`;
    dto.push({
      name: `${name}-${uuid()}`,
      code: `${name}-${uuid()}`,
      roleIds,
    });
    dto.push({
      name: `Permission2-${uuid()}`,
      code: `permission2-${uuid()}`,
      roleIds,
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
          roleIds,
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

export async function findPermissionsByIdsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = ids.map((p) => `ids=${p}`).join('&');

  const permissions = await request(httpServer)
    .get(`/permission/ids?${permissionQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (permissions.status === 403) {
    throw new ForbiddenException(permissions.body.message);
  }

  if (permissions.status === 401) {
    throw new UnauthorizedException(permissions.body.message);
  }

  if (permissions.status === 400) {
    throw new BadRequestException(permissions.body.message);
  }

  if (permissions.status === 404) {
    throw new EntityNotFoundError('Permission', permissions.body.message);
  }

  if (permissions.status === 500) {
    throw new InternalServerErrorException(permissions.body.message);
  }

  return permissions.body as Permission[];
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
