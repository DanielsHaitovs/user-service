import type { CreateDepartmentDto } from '@/department/dto/department.dto';
import type { Department } from '@/department/entities/department.entity';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
import { faker } from '@faker-js/faker/.';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { Server } from 'http';
import * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createNewDepartmentApi(
  app: INestApplication,
  accessToken: string,
): Promise<Department> {
  const httpServer = app.getHttpServer() as Server;

  const dto: CreateDepartmentDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    country: getRandomCountryCode(),
  };

  const department = await request(httpServer)
    .post('/departments')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  if (department.status === 403) {
    throw new ForbiddenException(department.body.message);
  }

  if (department.status === 404) {
    throw new EntityNotFoundError('Department', department.body.message);
  }

  if (department.status === 500) {
    throw new BadRequestException(department.body.message);
  }

  if (department.status === 409) {
    throw new ConflictException(department.body.message);
  }

  if (department.status === 401) {
    throw new UnauthorizedException(department.body.message);
  }

  return department.body as Department;
}
