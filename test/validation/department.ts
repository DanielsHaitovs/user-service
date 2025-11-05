import type { DepartmentResponseDto } from '@/department/dto/department.dto';
import type { Departments } from '@/department/entities/department.entity';

import type { UUID } from 'crypto';

export function validateDepartmentsResponse(response: {
  departments: Departments[] | DepartmentResponseDto[];
  ids?: UUID[] | undefined;
  names?: string[] | undefined;
  countries?: string[] | undefined;
  amountExpected?: number | undefined;
  hasAccessToUser?: boolean;
  hasUser?: boolean;
}): void {
  const { departments, ids, names, countries, amountExpected, hasUser } =
    response;

  if (departments.length === 0 && amountExpected !== 0) {
    throw new Error('Departments array is empty, nothing to validate');
  }

  expect(departments).toBeDefined();

  if (amountExpected !== undefined) {
    expect(departments).toHaveLength(amountExpected);
  }

  if (amountExpected === 0) {
    return;
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

    if (response.hasAccessToUser !== undefined && response.hasAccessToUser) {
      expect(department).toHaveProperty('createdBy');
      expect(department.createdBy).toHaveProperty('id');
      expect(department.createdBy).toHaveProperty('email');
      expect(department.createdBy).toHaveProperty('firstName');
      expect(department.createdBy).toHaveProperty('lastName');
    }

    if (
      response.hasAccessToUser !== undefined &&
      response.hasAccessToUser &&
      hasUser != undefined &&
      hasUser
    ) {
      expect(department).toHaveProperty('user');
      expect(department.users).toBeInstanceOf(Array);

      if (department.users == undefined || department.users.length === 0) {
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
