import { validateResponse } from '@/test/validation/request';
import {
  validateUnassignUserRole,
  validateUserRoleApiResponse,
} from '@/test/validation/user-role';
import type {
  AssignRoleIdsDto,
  CreateUserRoleDto,
  UnassignRoleIdsDto,
} from '@/user/dto/userRole.dto';
import type { UserRole } from '@/user/entities/userRoles.entity';
import type { INestApplication } from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';

export async function createNewUserRole(
  app: INestApplication,
  accessToken: string,
  userId: UUID,
  roleIds: UUID[],
): Promise<UserRole[]> {
  const httpServer = app.getHttpServer() as Server;

  const dto: CreateUserRoleDto = {
    userId,
    roleIds,
  };

  const response = await request(httpServer)
    .post('/user-roles')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  validateResponse({ response, alias: 'UserRoles' });

  const userRoles = response.body as UserRole[];
  validateUserRoleApiResponse(userRoles);

  return userRoles;
}

export async function findUserRolesApi({
  app,
  accessToken,
  userIds,
  roleIds,
  assignedByIds,
}: {
  app: INestApplication;
  accessToken: string;
  userIds?: UUID[];
  roleIds?: UUID[];
  assignedByIds?: UUID[];
}): Promise<UserRole[]> {
  const httpServer = app.getHttpServer() as Server;

  const params = new URLSearchParams();

  userIds?.forEach((id) => {
    params.append('userIds', id);
  });
  roleIds?.forEach((id) => {
    params.append('roleIds', id);
  });
  assignedByIds?.forEach((id) => {
    params.append('assignedByIds', id);
  });

  const query = params.toString();
  const basePath = '/user-roles/ids/';
  const path = query.length > 0 ? `${basePath}?${query}` : basePath;

  const response = await request(httpServer)
    .get(path)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'UserRoles' });

  const userRoles = response.body as UserRole[];

  validateUserRoleApiResponse(userRoles);

  return userRoles;
}

export async function findUserRolesByEmailApi({
  app,
  accessToken,
  email,
}: {
  app: INestApplication;
  accessToken: string;
  email: string;
}): Promise<UserRole[]> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .get(`/user-roles/attribute/${email}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'UserRoles' });

  const userRoles = response.body as UserRole[];
  validateUserRoleApiResponse(userRoles);

  return userRoles;
}

export async function assignRolesToUserById(
  app: INestApplication,
  accessToken: string,
  userId: UUID,
  roleIds: UUID[],
): Promise<UserRole[]> {
  const httpServer = app.getHttpServer() as Server;

  const dto: AssignRoleIdsDto = {
    roleIds,
  };

  const response = await request(httpServer)
    .post(`/user-roles/assign/${userId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  validateResponse({ response, alias: 'UserRoles' });

  const userRoles = response.body as UserRole[];
  validateUserRoleApiResponse(userRoles);

  return userRoles;
}

export async function unassignRolesFromUsersById(
  app: INestApplication,
  accessToken: string,
  userIds: UUID[],
  roleIds: UUID[],
): Promise<{ unassigned: boolean }> {
  const httpServer = app.getHttpServer() as Server;

  const dto: UnassignRoleIdsDto = {
    userIds,
    roleIds,
  };

  const response = await request(httpServer)
    .post('/user-roles/unassign/')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  validateResponse({ response, alias: 'UserRoles' });

  const userRoles = response.body as { unassigned: boolean };

  validateUnassignUserRole(userRoles);

  return userRoles;
}
