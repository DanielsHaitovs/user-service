import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { DepartmentQueryDto } from '@/department/dto/query.dto';
import type { Department } from '@/department/entities/department.entity';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
import {
  validateDeleteDepartmentResponse,
  validateDepartmentsResponse,
} from '@/test/validation/department';
import { validateResponse } from '@/test/validation/request';
import { faker } from '@faker-js/faker/.';
import type { INestApplication } from '@nestjs/common';

import type { UUID } from 'crypto';
import type { Server } from 'http';
import * as request from 'supertest';
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

  const response = await request(httpServer)
    .post('/departments')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  validateResponse({ response, alias: 'Department' });

  const department = response.body as Department;

  validateDepartmentsResponse({
    departments: [department],
    ids: [department.id],
    names: [dto.name],
    countries: [dto.country],
    amountExpected: 1,
  });

  return department;
}

export async function findDepartmentByIdsApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<Department[]> {
  const httpServer = app.getHttpServer() as Server;

  const path = ids.map((p) => `ids=${p}`).join('&');
  const pagination = `&page=1&limit=${ids.length.toString()}`;

  const response = await request(httpServer)
    .get(`/departments?${path}${pagination}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Department' });

  const departments = response.body as Department[];

  validateDepartmentsResponse({ departments, ids, amountExpected: 1 });

  return departments;
}

export async function queryDepartmentApi(
  app: INestApplication,
  accessToken: string,
  filters: DepartmentQueryDto,
  hasUserPermission: boolean,
  amountExpected?: number,
): Promise<DepartmentListResponseDto> {
  const httpServer = app.getHttpServer() as Server;
  const path = new URLSearchParams();

  const {
    query: { ids, names, countries, createdByUserIds },
    sort,
    pagination: { page, limit },
    includeUsers,
    includeCreatedBy,
  } = filters;

  if (ids && ids.length > 0) {
    ids.forEach((id) => {
      path.append('ids', id);
    });
  }

  if (names && names.length > 0) {
    names.forEach((name) => {
      path.append('names', name);
    });
  }

  if (countries && countries.length > 0) {
    countries.forEach((country) => {
      path.append('countries', country);
    });
  }

  if (includeUsers !== undefined) {
    path.append('includeUsers', includeUsers.toString());
  }

  if (includeCreatedBy !== undefined) {
    path.append('includeCreatedBy', includeCreatedBy.toString());
  }

  if (createdByUserIds && createdByUserIds.length > 0) {
    createdByUserIds.forEach((id) => {
      path.append('createdByUserIds', id);
    });
  }

  path.append('page', page.toString());
  path.append('limit', limit.toString());

  if (sort?.sortField !== undefined) {
    path.append('sortField', sort.sortField);
  }

  if (sort?.sortOrder !== undefined) {
    path.append('sortOrder', sort.sortOrder);
  }

  const response = await request(httpServer)
    .get(`/departments/query?${path}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Department' });

  const data = response.body as DepartmentListResponseDto;

  validateDepartmentsResponse({
    departments: data.departments,
    ids,
    names,
    countries,
    amountExpected,
    hasUserPermission,
  });

  return data;
}

export async function searchDepartmentsByValueApi(
  app: INestApplication,
  accessToken: string,
  value: string,
): Promise<DepartmentListResponseDto> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .get(`/departments/search/${value}?page=1&limit=10`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Department' });

  const res = response.body as DepartmentListResponseDto;

  res.departments.forEach((department) => {
    validateDepartmentsResponse({ departments: [department] });
  });

  return res;
}

export async function updateDepartmentApi(
  app: INestApplication,
  accessToken: string,
  department: UpdateDepartmentDto,
  id: UUID,
): Promise<Department> {
  const httpServer = app.getHttpServer() as Server;

  const response = await request(httpServer)
    .patch(`/departments/${id}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(department);

  validateResponse({ response, alias: 'Department' });

  const updatedDepartment = response.body as Department;

  validateDepartmentsResponse({
    departments: [updatedDepartment],
    ids: [id],
    amountExpected: 1,
    ...(department.name != undefined && { names: [department.name] }),
    ...(department.country != undefined && { countries: [department.country] }),
  });

  return updatedDepartment;
}

export async function deleteDepartmentApi(
  app: INestApplication,
  accessToken: string,
  ids: UUID[],
): Promise<{ deleted: number }> {
  const httpServer = app.getHttpServer() as Server;

  const departmentQuery = ids.map((p) => `ids=${p}`).join('&');

  const response = await request(httpServer)
    .delete(`/departments?${departmentQuery}`)
    .set('Authorization', `Bearer ${accessToken}`);

  validateResponse({ response, alias: 'Department' });

  const department = response.body as { deleted: number };

  validateDeleteDepartmentResponse(department, ids.length);

  return department;
}
