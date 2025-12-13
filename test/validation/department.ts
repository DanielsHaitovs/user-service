import type { DepartmentResponseDto } from '@/department/dto/department.dto';
import type { Departments } from '@/department/entities/department.entity';
import { getDepartmentProperties } from '@/department/helper/department-fields.util';
import { validateManyUsers, validateUser } from '@/test/validation/user';
import type { User } from '@/user/entities/user.entity';

import type { UUID } from 'crypto';

export function validateDepartmentsResponse({
  departments,
  amountExpected,
  expectedFields,
  ids,
  names,
  countries,
  hasCreatedBy,
  expectedCreatedByFields,
  expectedCreatedByIds,
  expectedCreatedByEmails,
  hasUsers,
  expectedUsersFields,
  expectedUserIds,
  expectedUserEmails,
  expectedUserAmount,
}: {
  departments: Departments[] | DepartmentResponseDto[] | undefined;
  amountExpected?: number | undefined;
  expectedFields?: (keyof Departments)[] | undefined;
  ids?: UUID[] | undefined;
  names?: string[] | undefined;
  countries?: string[] | undefined;
  hasCreatedBy?: boolean | undefined;
  expectedCreatedByFields?: (keyof User)[] | undefined;
  expectedCreatedByIds?: UUID[] | undefined;
  expectedCreatedByEmails?: string[] | undefined;
  hasUsers?: boolean | undefined;
  expectedUsersFields?: (keyof User)[] | undefined;
  expectedUserIds?: UUID[] | undefined;
  expectedUserEmails?: string[] | undefined;
  expectedUserAmount?: number | undefined;
}): void {
  const notEmpty = amountExpected != undefined && amountExpected > 0;
  const noDepartmentReceived =
    departments == undefined || departments.length < 1;

  if (noDepartmentReceived && notEmpty) {
    throw new Error('Could not find any departments');
  }

  if (!notEmpty && !noDepartmentReceived) {
    throw new Error('Unexpected departments found');
  }

  if (!notEmpty && noDepartmentReceived) {
    return;
  }

  if (departments === undefined) {
    throw new Error('departments are undefined, cannot validate');
  }

  expectedFields ??= getDepartmentProperties() as (keyof Departments)[];

  expect(departments).toBeDefined();

  if (amountExpected !== undefined) {
    expect(departments).toHaveLength(amountExpected);
  }

  validateDepartment({
    departments,
    expectedFields,
    ids,
    names,
    countries,
    hasCreatedBy,
    expectedCreatedByFields,
    expectedCreatedByIds,
    expectedCreatedByEmails,
    hasUsers,
    expectedUsersFields,
    expectedUserIds,
    expectedUserEmails,
    expectedUserAmount,
  });
}

export function validateDepartment({
  departments,
  expectedFields,
  ids,
  names,
  countries,
  hasCreatedBy,
  expectedCreatedByFields,
  expectedCreatedByIds,
  expectedCreatedByEmails,
  hasUsers,
  expectedUsersFields,
  expectedUserIds,
  expectedUserEmails,
  expectedUserAmount,
}: {
  departments: Departments[] | DepartmentResponseDto[];
  expectedFields: (keyof Departments)[];
  ids?: UUID[] | undefined;
  names?: string[] | undefined;
  countries?: string[] | undefined;
  hasCreatedBy?: boolean | undefined;
  expectedCreatedByFields?: (keyof User)[] | undefined;
  expectedCreatedByIds?: UUID[] | undefined;
  expectedCreatedByEmails?: string[] | undefined;
  hasUsers?: boolean | undefined;
  expectedUsersFields?: (keyof User)[] | undefined;
  expectedUserIds?: UUID[] | undefined;
  expectedUserEmails?: string[] | undefined;
  expectedUserAmount?: number | undefined;
}): void {
  departments.forEach((department) => {
    for (const field of expectedFields) {
      expect(department).toHaveProperty(field);
    }

    if (ids !== undefined && ids.length > 0 && expectedFields.includes('id')) {
      expect(ids).toContain(department.id);
    }

    if (
      names !== undefined &&
      names.length > 0 &&
      expectedFields.includes('name')
    ) {
      expect(names).toContain(department.name);
    }

    if (
      countries !== undefined &&
      countries.length > 0 &&
      expectedFields.includes('country')
    ) {
      expect(countries).toContain(department.country);
    }

    validateUser({
      user: department.createdBy,
      expectedFields: expectedCreatedByFields,
      hasAccess: hasCreatedBy,
      expectedEmails: expectedCreatedByEmails,
      expectedIds: expectedCreatedByIds,
    });

    validateManyUsers({
      users: department.users,
      expectedFields: expectedUsersFields,
      hasAccess: hasUsers,
      expectedEmails: expectedUserEmails,
      expectedIds: expectedUserIds,
      amountExpected: expectedUserAmount,
    });
  });
}

export function validateDeleteDepartmentResponse(
  response: {
    deleted: number;
  },
  amountRequested: number,
): void {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('deleted');
  expect(response.deleted).toBe(amountRequested);
}
