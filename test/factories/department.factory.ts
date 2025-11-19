import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { Departments } from '@/department/entities/department.entity';
import type { DepartmentService } from '@/department/services/department.service';
import type { QueryService } from '@/department/services/query.service';
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

export async function createDepartment({
  service,
  createdBy,
  hasAccessToUser,
}: {
  service: DepartmentService;
  createdBy: UUID;
  hasAccessToUser: boolean;
}): Promise<Departments> {
  const dto: CreateDepartmentDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    country: getRandomCountryCode(),
  };

  try {
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
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

export async function findDepartmentsByIds({
  service,
  createdBy,
  hasAccessToUser,
}: {
  service: DepartmentService;
  createdBy: UUID;
  hasAccessToUser: boolean;
}): Promise<Departments[]> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });

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

export async function searchForDepartments({
  service,
  createdBy,
  hasAccessToUser,
}: {
  service: DepartmentService;
  createdBy: UUID;
  hasAccessToUser: boolean;
}): Promise<DepartmentListResponseDto> {
  const newDepartment = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });

  const res = await service.searchFor({
    value: newDepartment.name,
    pagination: {
      limit: 20,
      page: 1,
    },
    sort: {
      sortField: `${DEPARTMENT_QUERY_ALIAS}.name`,
      sortOrder: 'ASC',
    },
  });

  const departments = res.departments as Departments[];

  validateDepartmentsResponse({
    departments,
    names: [newDepartment.name],
    countries: [newDepartment.country],
    ids: [newDepartment.id],
    amountExpected: 1,
    hasAccessToUser: false,
  });

  return res;
}

export async function updateDepartmentName({
  service,
  createdBy,
}: {
  service: DepartmentService;
  createdBy: UUID;
}): Promise<Departments> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUser: false,
  });

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

export async function updateDepartmentCountry({
  service,
  createdBy,
}: {
  service: DepartmentService;
  createdBy: UUID;
}): Promise<Departments> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUser: false,
  });

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
  queryService: QueryService,
  createdBy: UUID,
  hasAccessToUser: boolean,
): Promise<DepartmentListResponseDto> {
  const department1 = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });
  const department2 = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });
  const department3 = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });
  const department4 = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });

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
      sort: {
        sortField: `${DEPARTMENT_QUERY_ALIAS}.name`,
        sortOrder: 'ASC',
      },
    },
    hasAccessToUser,
  );

  validateDepartmentsResponse({
    departments: departments.departments as Departments[],
    ids,
    names,
    countries,
    amountExpected: 4,
    hasAccessToUser,
  });

  return departments;
}

export async function deleteDepartments({
  service,
  createdBy,
}: {
  service: DepartmentService;
  createdBy: UUID;
}): Promise<void> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUser: false,
  });

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
