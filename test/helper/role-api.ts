import type { CreateRoleDto } from '@/role/dto/role.dto';
import type { Role } from '@/role/entities/role.entity';
import { faker } from '@faker-js/faker/.';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createNewRoleApi(
  app: INestApplication,
  accessToken: string,
): Promise<Role> {
  const httpServer = app.getHttpServer() as Server;

  const dto: CreateRoleDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
  };

  const roles = await request(httpServer)
    .post('/roles')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  if (roles.status === 403) {
    throw new ForbiddenException(roles.body.message);
  }

  if (roles.status === 500) {
    throw new BadRequestException(roles.body.message);
  }

  if (roles.status === 404) {
    throw new EntityNotFoundError('Role', roles.body.message);
  }

  if (roles.status === 409) {
    throw new ConflictException(roles.body.message);
  }

  if (roles.status === 401) {
    throw new UnauthorizedException(roles.body.message);
  }

  return roles.body as Role;
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

  return role.body as Role;
}
