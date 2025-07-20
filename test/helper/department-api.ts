import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { Department } from '@/department/entities/department.entity';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
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

export async function createNewDepartmentApi(
  app: INestApplication,
  accessToken: string,
  dto?: CreateDepartmentDto,
): Promise<Department> {
  const httpServer = app.getHttpServer() as Server;

  dto ??= {
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

  if (department.status === 400) {
    throw new BadRequestException(department.body.message);
  }

  if (department.status === 409) {
    throw new ConflictException(department.body.message);
  }

  if (department.status === 401) {
    throw new UnauthorizedException(department.body.message);
  }

  if (department.status === 500) {
    throw new InternalServerErrorException(department.body.message);
  }

  return department.body as Department;
}

export async function findDepartmentByIdApi(
  app: INestApplication,
  accessToken: string,
  id: UUID,
): Promise<Department[]> {
  const httpServer = app.getHttpServer() as Server;

  const department = await request(httpServer)
    .get(`/departments/${id}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (department.status === 403) {
    throw new ForbiddenException(department.body.message);
  }

  if (department.status === 401) {
    throw new UnauthorizedException(department.body.message);
  }

  if (department.status === 400) {
    throw new BadRequestException(department.body.message);
  }

  if (department.status === 404) {
    throw new EntityNotFoundError('Department', department.body.message);
  }

  if (department.status === 500) {
    throw new InternalServerErrorException(department.body.message);
  }

  return department.body as Department[];
}

export async function searchDepartmentsByValueApi(
  app: INestApplication,
  accessToken: string,
  value: string,
): Promise<DepartmentListResponseDto> {
  const httpServer = app.getHttpServer() as Server;

  const departments = await request(httpServer)
    .get(`/departments/search/${value}?page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (departments.status === 403) {
    throw new ForbiddenException(departments.body.message);
  }

  if (departments.status === 401) {
    throw new UnauthorizedException(departments.body.message);
  }

  if (departments.status === 400) {
    throw new BadRequestException(departments.body.message);
  }

  if (departments.status === 500) {
    throw new InternalServerErrorException(departments.body.message);
  }

  return departments.body as DepartmentListResponseDto;
}

export async function updateDepartmentApi(
  app: INestApplication,
  accessToken: string,
  department: UpdateDepartmentDto,
  id: UUID,
): Promise<Department> {
  const httpServer = app.getHttpServer() as Server;

  const updatedDepartment = await request(httpServer)
    .patch(`/departments/${id}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(department);

  if (updatedDepartment.status === 400) {
    throw new BadRequestException(updatedDepartment.body.message);
  }

  if (updatedDepartment.status === 403) {
    throw new ForbiddenException(updatedDepartment.body.message);
  }

  if (updatedDepartment.status === 401) {
    throw new UnauthorizedException(updatedDepartment.body.message);
  }

  if (updatedDepartment.status === 404) {
    throw new EntityNotFoundError('Department', updatedDepartment.body.message);
  }

  if (updatedDepartment.status === 409) {
    throw new ConflictException(updatedDepartment.body.message);
  }

  if (updatedDepartment.status === 500) {
    throw new InternalServerErrorException(updatedDepartment.body.message);
  }

  return updatedDepartment.body as Department;
}

export async function deleteDepartmentApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<{ deleted: number }> {
  const httpServer = app.getHttpServer() as Server;

  const departmentQuery = ids.map((p) => `ids=${p}`).join('&');

  const department = await request(httpServer)
    .delete(`/departments?${departmentQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  if (department.status === 400) {
    throw new BadRequestException(department.body.message);
  }

  if (department.status === 403) {
    throw new ForbiddenException(department.body.message);
  }

  if (department.status === 401) {
    throw new UnauthorizedException(department.body.message);
  }

  if (department.status === 404) {
    throw new EntityNotFoundError('Department', department.body.message);
  }

  if (department.status === 500) {
    throw new InternalServerErrorException(department.body.message);
  }

  return department.body as { deleted: number };
}

export function validateDepartmentsApiResponse(
  departments: Department[] | DepartmentResponseDto[],
): void {
  if (departments.length === 0) {
    throw new Error('Role array is empty, nothing to validate');
  }

  expect(departments).toBeDefined();
  expect(departments.length).toBeGreaterThan(0);

  departments.forEach((department) => {
    expect(department).toHaveProperty('id');
    expect(department).toHaveProperty('name');
    expect(department).toHaveProperty('country');
  });
}
