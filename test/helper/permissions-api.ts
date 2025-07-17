import type {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { Role } from '@/role/entities/role.entity';
import {
  BadRequestException,
  ConflictException,
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

  if (newPermissions.status === 409) {
    throw new ConflictException(newPermissions.body.message);
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
    let existingPermissions: Permission[] = [];

    try {
      existingPermissions = await findPermissionsByCodesApi(
        app,
        accessToken,
        permissions,
      );
    } catch {
      existingPermissions = [];
    }

    if (existingPermissions.length === 0) {
      dto.push(
        ...permissions.map((p) => ({
          name: p,
          code: p,
          roleIds,
        })),
      );
      return await createNewPermissionApi(app, accessToken, dto);
    }

    const missing = permissions.filter(
      (p) => !existingPermissions.some((perm) => perm.code === p),
    );

    if (missing.length !== 0 && existingPermissions.length > 0) {
      dto.push(
        ...missing.map((p) => ({
          name: p,
          code: p,
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

export async function queryPermissionsByCodesApi(
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

export async function findPermissionsByCodesApi(
  app: INestApplication,
  accessToken: string,
  codes: string[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = codes.map((p) => `codes=${p}`).join('&');

  const permissions = await request(httpServer)
    .get(`/permission/codes?${permissionQuery}`)
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

export async function searchPermissionsByValueApi(
  app: INestApplication,
  accessToken: string,
  value: string,
): Promise<PermissionListResponseDto> {
  const httpServer = app.getHttpServer() as Server;

  const permissions = await request(httpServer)
    .get(`/permission/${value}?page=1&limit=10`)
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

  if (permissions.status === 500) {
    throw new InternalServerErrorException(permissions.body.message);
  }

  return permissions.body as PermissionListResponseDto;
}

export async function updatePermissionsApi(
  app: INestApplication,
  accessToken: string,
  permission: UpdatePermissionDto,
  id: UUID,
): Promise<Permission> {
  const httpServer = app.getHttpServer() as Server;

  const updatedPermission = await request(httpServer)
    .patch(`/permission/${id}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(permission);

  if (updatedPermission.status === 400) {
    throw new BadRequestException(updatedPermission.body.message);
  }

  if (updatedPermission.status === 403) {
    throw new ForbiddenException(updatedPermission.body.message);
  }

  if (updatedPermission.status === 401) {
    throw new UnauthorizedException(updatedPermission.body.message);
  }

  if (updatedPermission.status === 404) {
    throw new EntityNotFoundError('Permission', updatedPermission.body.message);
  }

  if (updatedPermission.status === 409) {
    throw new ConflictException(updatedPermission.body.message);
  }

  if (updatedPermission.status === 500) {
    throw new InternalServerErrorException(updatedPermission.body.message);
  }

  return updatedPermission.body as Permission;
}

export async function deletePermissionsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<{ deleted: number }> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = ids.map((p) => `ids=${p}`).join('&');

  const permissions = await request(httpServer)
    .delete(`/permission?${permissionQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (permissions.status === 400) {
    throw new BadRequestException(permissions.body.message);
  }

  if (permissions.status === 403) {
    throw new ForbiddenException(permissions.body.message);
  }

  if (permissions.status === 401) {
    throw new UnauthorizedException(permissions.body.message);
  }

  if (permissions.status === 404) {
    throw new EntityNotFoundError('Permission', permissions.body.message);
  }

  if (permissions.status === 500) {
    throw new InternalServerErrorException(permissions.body.message);
  }

  return permissions.body as { deleted: number };
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
