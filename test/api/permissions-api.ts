import type {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import type { Permission } from '@/role/entities/permissions.entity';
import type { Role } from '@/role/entities/role.entity';
import {
  validateDeletePermissionResponse,
  validatePermissionResponse,
} from '@/test/validation/permissions';
import { validateResponse } from '@/test/validation/request';
import type { INestApplication } from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import { v4 as uuid } from 'uuid';

export async function createNewPermissionApi(
  app: INestApplication,
  accessToken: string,
  permissions: Partial<CreatePermissionDto>[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .post('/permission')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(permissions);

  validateResponse({ response, alias: 'Permission' });

  const newPermissions = response.body as Permission[];

  validatePermissionResponse({
    permissions: newPermissions,
    amountExpected: permissions.length,
    names: permissions
      .filter((p) => p.name !== undefined)
      .map((p) => p.name) as string[],
    codes: permissions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code) as string[],
  });

  return newPermissions;
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
        false,
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

  const response = await request(httpServer)
    .post('/permission')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  validateResponse({ response, alias: 'Permission' });

  const newPermissions = response.body as Permission[];

  validatePermissionResponse({
    permissions: newPermissions,
    amountExpected: dto.length,
    names: dto.map((p) => p.name),
    codes: dto.map((p) => p.code),
  });

  return newPermissions;
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

  const response = await request(httpServer)
    .get(`/roles/query/filter?${permissionQuery}&page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Permissions' });

  if (response.body.roles.length === 0) {
    return [];
  }

  const roles = response.body.roles as Role[];

  const foundPermissions = roles.flatMap((role) => role.permissions);

  validatePermissionResponse({
    permissions: foundPermissions,
    amountExpected: foundPermissions.length,
    codes: permissions,
  });

  return foundPermissions;
}

export async function findPermissionsByIdsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = ids.map((p) => `ids=${p}`).join('&');

  const response = await request(httpServer)
    .get(`/permission/ids?${permissionQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Permission' });

  const permissions = response.body as Permission[];

  validatePermissionResponse({
    permissions,
    amountExpected: ids.length,
    ids,
  });

  return permissions;
}

export async function findPermissionsByCodesApi(
  app: INestApplication,
  accessToken: string,
  codes: string[],
  validateAmount: boolean,
): Promise<Permission[]> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = codes.map((p) => `codes=${p}`).join('&');

  const response = await request(httpServer)
    .get(`/permission/codes?${permissionQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (!validateAmount && response.status === 404) {
    return [];
  }

  validateResponse({ response, alias: 'Permission' });

  const permissions = response.body as Permission[];

  validatePermissionResponse({
    permissions,
    ...(validateAmount && { amountExpected: codes.length }),
    codes,
  });

  return permissions;
}

export async function searchPermissionsByValueApi(
  app: INestApplication,
  accessToken: string,
  value: string,
): Promise<PermissionListResponseDto> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .get(`/permission/${value}?page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Permission' });

  const res = response.body as PermissionListResponseDto;

  const { permissions } = res;

  validatePermissionResponse({
    permissions,
  });

  return res;
}

export async function updatePermissionsApi(
  app: INestApplication,
  accessToken: string,
  permission: UpdatePermissionDto,
  id: UUID,
): Promise<Permission> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .patch(`/permission/${id}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(permission);

  validateResponse({ response, alias: 'Permission' });

  const updatedPermission = response.body as Permission;

  validatePermissionResponse({
    permissions: [updatedPermission],
    amountExpected: 1,
    ids: [id],
    ...(permission.name != undefined && { names: [permission.name] }),
    ...(permission.code != undefined && { codes: [permission.code] }),
  });

  return updatedPermission;
}

export async function deletePermissionsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<{ deleted: number }> {
  const httpServer = app.getHttpServer() as Server;

  const permissionQuery = ids.map((p) => `ids=${p}`).join('&');

  const response = await request(httpServer)
    .delete(`/permission?${permissionQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Permission' });

  const permissions = response.body as { deleted: number };

  validateDeletePermissionResponse(permissions, ids.length);

  return permissions;
}
