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

import { getDepartmentGenericSelectableFields } from '../../src/modules/department/helper/department-fields.util';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '../../src/modules/user/helper/user-fields.util';

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
      hasCreatedBy: hasAccessToUser,
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
  includeCreatedBy,
  includeUsers,
}: {
  service: DepartmentService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  includeCreatedBy?: boolean;
  includeUsers?: boolean;
}): Promise<DepartmentListResponseDto> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUser,
  });

  const response = await service.findByIds({
    ids: [department.id],
    control: {
      page: 1,
      limit: 1,
      includeCreatedBy: includeCreatedBy ?? false,
      includeUsers: includeUsers ?? false,
      selectCreatedByFields: getCreatedByGenericSelectableFields([
        'id',
        'email',
        'firstName',
        'lastName',
      ]),
      selectUserFields: getUserGenericSelectableFields({
        fields: ['id', 'email', 'firstName', 'lastName'],
      }),
      selectDepartmentFields: getDepartmentGenericSelectableFields({}),
      sortField: `${DEPARTMENT_QUERY_ALIAS}.createdAt`,
      sortOrder: 'ASC',
    },
    hasAccessToUser,
  });

  validateDepartmentsResponse({
    departments: response.departments,
    ids: [department.id],
    names: [department.name],
    countries: [department.country],
    amountExpected: 1,
    hasCreatedBy: (includeCreatedBy ?? false) && hasAccessToUser,
    hasUsers: (includeUsers ?? false) && hasAccessToUser,
  });

  return response;
}

export async function searchForDepartments({
  service,
  createdBy,
}: {
  service: DepartmentService;
  createdBy: UUID;
}): Promise<DepartmentListResponseDto> {
  const newDepartment = await createDepartment({
    service,
    createdBy,
    hasAccessToUser: false,
  });

  const res = await service.searchFor({
    value: newDepartment.name,
    control: {
      limit: 20,
      page: 1,
      sortField: `${DEPARTMENT_QUERY_ALIAS}.name`,
      sortOrder: 'ASC',
      selectDepartmentFields: getDepartmentGenericSelectableFields({}),
    },
  });

  const departments = res.departments as Departments[];

  validateDepartmentsResponse({
    departments,
    names: [newDepartment.name],
    countries: [newDepartment.country],
    ids: [newDepartment.id],
    amountExpected: 1,
    hasCreatedBy: false,
    hasUsers: false,
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

export async function queryDepartments({
  service,
  queryService,
  createdBy,
  hasAccessToUser,
  requestedByUser,
  includeCreatedBy,
  includeUsers,
}: {
  service: DepartmentService;
  queryService: QueryService;
  createdBy: UUID;
  hasAccessToUser: boolean;
  requestedByUser: UUID;
  includeCreatedBy?: boolean;
  includeUsers?: boolean;
}): Promise<DepartmentListResponseDto> {
  const newDepartments = await Promise.all([
    createDepartment({ service, createdBy, hasAccessToUser }),
    createDepartment({ service, createdBy, hasAccessToUser }),
    createDepartment({ service, createdBy, hasAccessToUser }),
    createDepartment({ service, createdBy, hasAccessToUser }),
  ]);

  const ids = newDepartments.flatMap((department) => department.id);
  const names = newDepartments.flatMap((department) => department.name);
  const countries = newDepartments.flatMap((department) => department.country);

  const departments = await queryService.getDepartements({
    filters: {
      ids,
      names,
      countries,
      userIds: [],
      createdByUserIds: [],
      page: 1,
      limit: 20,
      sortField: `${DEPARTMENT_QUERY_ALIAS}.createdAt`,
      sortOrder: 'ASC',
      includeCreatedBy: includeCreatedBy ?? false,
      includeUsers: includeUsers ?? false,
      selectCreatedByFields: getCreatedByGenericSelectableFields([
        'id',
        'email',
        'firstName',
        'lastName',
      ]),
      selectUserFields: getUserGenericSelectableFields({
        fields: ['id', 'email', 'firstName', 'lastName'],
      }),
      selectDepartmentFields: getDepartmentGenericSelectableFields({}),
    },
    requestedByUser,
    hasAccessToUser,
  });

  validateDepartmentsResponse({
    departments: departments.departments as Departments[],
    ids,
    names,
    countries,
    amountExpected: 4,
    hasCreatedBy: (includeCreatedBy ?? false) && hasAccessToUser,
    hasUsers: (includeUsers ?? false) && hasAccessToUser,
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
      control: {
        page: 1,
        limit: 1,
        includeCreatedBy: false,
        includeUsers: false,
        selectCreatedByFields: [],
        selectUserFields: [],
        selectDepartmentFields: getDepartmentGenericSelectableFields({}),
        sortField: `${DEPARTMENT_QUERY_ALIAS}.createdAt`,
        sortOrder: 'ASC',
      },
      hasAccessToUser: false,
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
