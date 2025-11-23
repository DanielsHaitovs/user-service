import type { DepartmentResponseDto } from '@/department/dto/department.dto';
import type { Departments } from '@/department/entities/department.entity';

import type { UUID } from 'crypto';

import { USER_QUERY_ALIAS } from '../../src/lib/const/user.const';

export function validateDepartmentsResponse({
  departments,
  ids,
  names,
  countries,
  amountExpected,
  hasCreatedBy,
  hasUsers,
}: {
  departments: Departments[] | DepartmentResponseDto[] | undefined;
  ids?: UUID[] | undefined;
  names?: string[] | undefined;
  countries?: string[] | undefined;
  amountExpected?: number | undefined;
  hasCreatedBy?: boolean;
  hasUsers?: boolean;
}): void {
  if (
    (departments?.length === 0 || departments === undefined) &&
    amountExpected != undefined &&
    amountExpected !== 0
  ) {
    throw new Error('Could not find any departments');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    departments != undefined &&
    departments.length > 0
  ) {
    throw new Error('Unexpected departments found');
  }

  if (
    (amountExpected === 0 || amountExpected === undefined) &&
    (departments?.length === 0 || departments === undefined)
  ) {
    return;
  }

  if (departments === undefined) {
    throw new Error('departments are undefined, cannot validate');
  }

  departments.forEach((department) => {
    expect(department).toHaveProperty('id');
    expect(department).toHaveProperty('name');
    expect(department).toHaveProperty('country');

    if (ids !== undefined && ids.length > 0) {
      expect(ids).toContain(department.id);
    }

    if (names !== undefined && names.length > 0) {
      expect(names).toContain(department.name);
    }

    if (countries !== undefined && countries.length > 0) {
      expect(countries).toContain(department.country);
    }

    if (hasCreatedBy !== undefined && hasCreatedBy) {
      expect(department).toHaveProperty('createdBy');
      expect(department.createdBy).toHaveProperty('id');
      expect(department.createdBy).toHaveProperty('email');
      expect(department.createdBy).toHaveProperty('firstName');
      expect(department.createdBy).toHaveProperty('lastName');
    }

    if (
      hasCreatedBy !== undefined &&
      hasCreatedBy &&
      hasUsers != undefined &&
      hasUsers
    ) {
      expect(department).toHaveProperty(USER_QUERY_ALIAS);
      expect(department.users).toBeInstanceOf(Array);

      if (department.users == undefined || department.users.length === 0) {
        console.log(department);
        throw new Error('Department users is undefined');
      }

      for (const user of department.users) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
      }
    }
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
