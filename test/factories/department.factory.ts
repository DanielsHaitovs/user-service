import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { Departments } from '@/department/entities/department.entity';
import { getDepartmentGenericSelectableFields } from '@/department/helper/department-fields.util';
import type { DepartmentService } from '@/department/services/department.service';
import type { QueryService } from '@/department/services/query.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
import {
  validateDeleteDepartmentResponse,
  validateDepartmentsResponse,
} from '@/test/validation/department';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '@/user/helper/user-fields.util';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

import type { User } from '../../src/modules/user/entities/user.entity';

export async function createDepartment({
  service,
  createDepartmentDto,
  createdBy,
  hasAccessToUsers,
}: {
  service: DepartmentService;
  createDepartmentDto?: CreateDepartmentDto;
  createdBy: UUID;
  hasAccessToUsers: boolean;
}): Promise<DepartmentResponseDto> {
  createDepartmentDto ??= {
    name: `${faker.lorem.word()}-${uuid()}`,
    country: getRandomCountryCode(),
  };

  try {
    const department = await service.create({
      createDepartmentDto,
      createdBy,
      hasAccessToUsers,
    });

    validateDepartmentsResponse({
      departments: [department],
      ids: [department.id],
      names: [department.name],
      countries: [department.country],
      amountExpected: 1,
      hasCreatedBy: hasAccessToUsers,
      expectedCreatedByIds: hasAccessToUsers ? [createdBy] : undefined,
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
  selectFields,
  hasAccessToUsers,
  includeCreatedBy,
  selectCreatedByFields,
  includeUsers,
  selectUserFields,
}: {
  service: DepartmentService;
  createdBy: UUID;
  selectFields?: (keyof Departments)[] | undefined;
  hasAccessToUsers: boolean;
  includeCreatedBy?: boolean;
  selectCreatedByFields?: (keyof User)[] | undefined;
  includeUsers?: boolean;
  selectUserFields?: (keyof User)[] | undefined;
}): Promise<DepartmentListResponseDto> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUsers,
  });

  includeUsers ??= false;
  includeCreatedBy ??= false;
  selectCreatedByFields ??= ['id', 'email', 'firstName', 'lastName'];
  selectUserFields ??= ['id', 'email', 'firstName', 'lastName'];

  const response = await service.findByIds({
    ids: [department.id],
    control: {
      page: 1,
      limit: 1,
      includeCreatedBy,
      includeUsers,
      selectCreatedByFields: getCreatedByGenericSelectableFields(
        selectCreatedByFields,
      ),
      selectUserFields: getUserGenericSelectableFields({
        fields: selectUserFields,
      }),
      selectDepartmentFields: getDepartmentGenericSelectableFields({
        fields: selectFields,
      }),
      sortField: `${DEPARTMENT_QUERY_ALIAS}.createdAt`,
      sortOrder: 'ASC',
    },
    hasAccessToUsers,
  });

  validateDepartmentsResponse({
    departments: response.departments,
    ids: [department.id],
    names: [department.name],
    countries: [department.country],
    expectedFields: selectFields,
    amountExpected: 1,
    hasCreatedBy: includeCreatedBy && hasAccessToUsers,
    hasUsers: includeUsers && hasAccessToUsers,
    expectedUserIds: includeUsers ? [createdBy] : undefined,
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
    hasAccessToUsers: false,
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
}): Promise<DepartmentResponseDto> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUsers: false,
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
}): Promise<DepartmentResponseDto> {
  const department = await createDepartment({
    service,
    createdBy,
    hasAccessToUsers: false,
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
  hasAccessToUsers,
  requestedByUserId,
  includeCreatedBy,
  includeUsers,
}: {
  service: DepartmentService;
  queryService: QueryService;
  createdBy: UUID;
  hasAccessToUsers: boolean;
  requestedByUserId: UUID;
  includeCreatedBy?: boolean;
  includeUsers?: boolean;
}): Promise<DepartmentListResponseDto> {
  const newDepartments = await Promise.all([
    createDepartment({ service, createdBy, hasAccessToUsers }),
    createDepartment({ service, createdBy, hasAccessToUsers }),
    createDepartment({ service, createdBy, hasAccessToUsers }),
    createDepartment({ service, createdBy, hasAccessToUsers }),
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
    requestedByUserId,
    hasAccessToUsers,
  });

  validateDepartmentsResponse({
    departments: departments.departments as Departments[],
    ids,
    names,
    countries,
    amountExpected: 4,
    hasCreatedBy: (includeCreatedBy ?? false) && hasAccessToUsers,
    hasUsers: (includeUsers ?? false) && hasAccessToUsers,
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
    hasAccessToUsers: false,
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
      hasAccessToUsers: false,
    }),
  ).rejects.toThrow(EntityNotFoundError);
}
