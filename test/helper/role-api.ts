import type {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import { faker } from '@faker-js/faker/.';
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

import { validatePermissionApiResponse } from './permissions-api';

export async function createNewRoleApi(
  app: INestApplication,
  accessToken: string,
  dto: CreateRoleDto | undefined,
): Promise<Role> {
  const httpServer = app.getHttpServer() as Server;

  dto ??= {
    name: `${faker.lorem.word()}-${uuid()}`,
  };

  const role = await request(httpServer)
    .post('/roles')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  if (role.status === 400) {
    throw new BadRequestException(role.body.message);
  }

  if (role.status === 403) {
    throw new ForbiddenException(role.body.message);
  }

  if (role.status === 404) {
    throw new EntityNotFoundError('Role', role.body.message);
  }

  if (role.status === 409) {
    throw new ConflictException(role.body.message);
  }

  if (role.status === 401) {
    throw new UnauthorizedException(role.body.message);
  }

  if (role.status === 500) {
    throw new InternalServerErrorException(role.body.message);
  }

  return role.body as Role;
}

export async function addPermissionsToRoleApi(
  app: INestApplication,
  accessToken: string,
  roleId: UUID,
  permissionIds: UUID[],
): Promise<Role> {
  const httpServer = app.getHttpServer() as Server;

  const role = await request(httpServer)
    .post('/roles/add-permissions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      permissionIds,
      roleId,
    });

  if (role.status === 403) {
    throw new ForbiddenException(role.body.message);
  }

  if (role.status === 404) {
    throw new EntityNotFoundError('Role', role.body.message);
  }

  if (role.status === 500) {
    throw new BadRequestException(role.body.message);
  }

  if (role.status === 409) {
    throw new ConflictException(role.body.message);
  }

  if (role.status === 401) {
    throw new UnauthorizedException(role.body.message);
  }

  if (role.status === 500) {
    throw new InternalServerErrorException(role.body.message);
  }

  return role.body as Role;
}

export async function findRolesByIdsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<Role[]> {
  const httpServer = app.getHttpServer() as Server;

  const roleQuery = ids.map((p) => `ids=${p}`).join('&');

  const roles = await request(httpServer)
    .get(`/roles/ids?${roleQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (roles.status === 403) {
    throw new ForbiddenException(roles.body.message);
  }

  if (roles.status === 401) {
    throw new UnauthorizedException(roles.body.message);
  }

  if (roles.status === 400) {
    throw new BadRequestException(roles.body.message);
  }

  if (roles.status === 404) {
    throw new EntityNotFoundError('Roles', roles.body.message);
  }

  if (roles.status === 500) {
    throw new InternalServerErrorException(roles.body.message);
  }

  return roles.body as Role[];
}

export async function searchRolesByValueApi(
  app: INestApplication,
  accessToken: string,
  value: string,
): Promise<RoleListResponseDto> {
  const httpServer = app.getHttpServer() as Server;

  const roles = await request(httpServer)
    .get(`/roles/${value}?page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (roles.status === 403) {
    throw new ForbiddenException(roles.body.message);
  }

  if (roles.status === 401) {
    throw new UnauthorizedException(roles.body.message);
  }

  if (roles.status === 400) {
    throw new BadRequestException(roles.body.message);
  }

  if (roles.status === 500) {
    throw new InternalServerErrorException(roles.body.message);
  }

  return roles.body as RoleListResponseDto;
}

export async function updateRoleApi(
  app: INestApplication,
  accessToken: string,
  role: UpdateRoleDto,
  id: UUID,
): Promise<Role> {
  const httpServer = app.getHttpServer() as Server;

  const updatedRole = await request(httpServer)
    .patch(`/roles/${id}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(role);

  if (updatedRole.status === 400) {
    throw new BadRequestException(updatedRole.body.message);
  }

  if (updatedRole.status === 403) {
    throw new ForbiddenException(updatedRole.body.message);
  }

  if (updatedRole.status === 401) {
    throw new UnauthorizedException(updatedRole.body.message);
  }

  if (updatedRole.status === 404) {
    throw new EntityNotFoundError('Role', updatedRole.body.message);
  }

  if (updatedRole.status === 409) {
    throw new ConflictException(updatedRole.body.message);
  }

  if (updatedRole.status === 500) {
    throw new InternalServerErrorException(updatedRole.body.message);
  }

  return updatedRole.body as Role;
}

export async function deleteRolesApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<{ deleted: number }> {
  const httpServer = app.getHttpServer() as Server;

  const roleQuery = ids.map((p) => `ids=${p}`).join('&');

  const role = await request(httpServer)
    .delete(`/roles?${roleQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (role.status === 400) {
    throw new BadRequestException(role.body.message);
  }

  if (role.status === 403) {
    throw new ForbiddenException(role.body.message);
  }

  if (role.status === 401) {
    throw new UnauthorizedException(role.body.message);
  }

  if (role.status === 404) {
    throw new EntityNotFoundError('Role', role.body.message);
  }

  if (role.status === 500) {
    throw new InternalServerErrorException(role.body.message);
  }

  return role.body as { deleted: number };
}

export function validateRoleApiResponse(roles: Role[]): void {
  if (roles.length === 0) {
    throw new Error('Role array is empty, nothing to validate');
  }

  expect(roles).toBeDefined();
  expect(roles.length).toBeGreaterThan(0);

  roles.forEach((role) => {
    expect(role).toHaveProperty('id');
    expect(role).toHaveProperty('name');

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (role.permissions != undefined && role.permissions.length > 0) {
      validatePermissionApiResponse(role.permissions);
    }
  });
}
