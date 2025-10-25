import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { Department } from '@/department/entities/department.entity';
import type { DepartmentService } from '@/department/services/department.service';
import type { DepartmentQueryService } from '@/department/services/query.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
import {
  validateDeleteDepartmentResponse,
  validateDepartmentsResponse,
} from '@/test/validation/department';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createDepartment(
  service: DepartmentService,
  createdBy: UUID,
  hasAccessToUser: boolean,
): Promise<Department> {
  const dto: CreateDepartmentDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    country: getRandomCountryCode(),
  };

  const department = await service.create({
    createDepartmentDto: dto,
    createdBy,
    hasAccessToUser,
  });

  validateDepartmentsResponse({
    departments: [department],
    ids: [department.id],
    names: [department.name],
    countries: [department.country],
    amountExpected: 1,
    hasAccessToUser,
  });

  return department;
}

export async function findDepartmentsByIds(
  service: DepartmentService,
  createdBy: UUID,
  hasAccessToUser: boolean,
): Promise<Department[]> {
  const department = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );

  const departments = await service.findByIds({
    ids: [department.id],
    pagination: { page: 1, limit: 1 },
    hasAccessToUser,
  });

  validateDepartmentsResponse({
    departments,
    ids: [department.id],
    names: [department.name],
    countries: [department.country],
    amountExpected: 1,
    hasAccessToUser,
  });

  return departments;
}

export async function searchForDepartments(
  service: DepartmentService,
  createdBy: UUID,
  hasAccessToUser: boolean,
): Promise<DepartmentListResponseDto> {
  const newDepartment = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );

  const res = await service.searchFor({
    value: newDepartment.name,
    pagination: {
      limit: 20,
      page: 1,
    },
    order: {
      sortField: `${DEPARTMENT_QUERY_ALIAS}.name`,
      sortOrder: 'ASC',
    },
    hasAccessToUser,
  });

  const departments = res.departments as Department[];

  validateDepartmentsResponse({
    departments,
    names: [newDepartment.name],
    countries: [newDepartment.country],
    ids: [newDepartment.id],
    amountExpected: 1,
    hasAccessToUser,
  });

  return res;
}

export async function updateDepartmentName(
  service: DepartmentService,
  createdBy: UUID,
): Promise<Department> {
  const department = await createDepartment(service, createdBy, false);

  const updateDto: UpdateDepartmentDto = {
    name: `from-${department.id}-to-${faker.lorem.word()}`,
  };

  const updatedDepartment = await service.update({
    id: department.id,
    updateDepartmentDto: updateDto,
  });

  validateDepartmentsResponse({
    departments: [updatedDepartment],
    ids: [department.id],
    names: [updatedDepartment.name],
    countries: [department.country],
    amountExpected: 1,
  });

  return updatedDepartment;
}

export async function updateDepartmentCountry(
  service: DepartmentService,
  createdBy: UUID,
): Promise<Department> {
  const department = await createDepartment(service, createdBy, false);

  const updateDto: UpdateDepartmentDto = {
    country: getRandomCountryCode(),
  };

  const updatedDepartment = await service.update({
    id: department.id,
    updateDepartmentDto: updateDto,
  });

  validateDepartmentsResponse({
    departments: [updatedDepartment],
    ids: [department.id],
    names: [department.name],
    countries: [updatedDepartment.country],
    amountExpected: 1,
  });

  return updatedDepartment;
}

export async function queryDepartments(
  service: DepartmentService,
  queryService: DepartmentQueryService,
  createdBy: UUID,
  hasAccessToUser: boolean,
): Promise<DepartmentListResponseDto> {
  const department1 = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );
  const department2 = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );
  const department3 = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );
  const department4 = await createDepartment(
    service,
    createdBy,
    hasAccessToUser,
  );

  const ids = [department1.id, department2.id, department3.id, department4.id];

  const countries = [
    department1.country,
    department2.country,
    department3.country,
    department4.country,
  ];

  const names = [
    department1.name,
    department2.name,
    department3.name,
    department4.name,
  ];

  const departments = await queryService.getDepartements(
    {
      query: {
        ids,
        names,
        countries,
      },
      pagination: {
        page: 1,
        limit: 20,
      },
    },
    hasAccessToUser,
  );

  validateDepartmentsResponse({
    departments: departments.departments as Department[],
    ids,
    names,
    countries,
    amountExpected: 4,
    hasAccessToUser,
  });

  return departments;
}

export async function deleteDepartments(
  service: DepartmentService,
  createdBy: UUID,
): Promise<void> {
  const department = await createDepartment(service, createdBy, false);

  const result = await service.deleteByIds([department.id]);

  validateDeleteDepartmentResponse(result, 1);

  await expect(
    service.findByIds({
      ids: [department.id],
      pagination: { page: 1, limit: 1 },
      hasAccessToUser: false,
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
