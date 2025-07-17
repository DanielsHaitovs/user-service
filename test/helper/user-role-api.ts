import type { CreateUserRoleDto } from '@/user/dto/userRole.dto';
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
): Promise<UserRole> {
  const httpServer = app.getHttpServer() as Server;

  const dto: CreateUserRoleDto = {
    userId,
    roleIds,
    assignedById: userId,
  };

  const userRole = await request(httpServer)
    .post('/userRoles')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto)
    .expect(200);

  return userRole.body as UserRole;
}
