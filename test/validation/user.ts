import type { UserResponseDto } from '@/user/dto/user.dto';
import type { User } from '@/user/entities/user.entity';

import type { UUID } from 'crypto';

import type { COUNTRIES } from '../../src/lib/const/countries.const';
import { getUserProperties } from '../../src/modules/user/helper/user-fields.util';

import { validateDepartmentsResponse } from './department';

function validateUsersResponse({
  users,
  amountExpected,
  expectedFields,
  ids,
  emails,
  firstNames,
  lastNames,
  passwords,
  phones,
  dateOfBirths,
  isActiveStatuses,
  isEmailVerifiedStatuses,
  emailVerificationTokens,
  passwordResetTokens,
  passwordResetExpiresDates,
  isTwoFactorEnabledStatuses,
  twoFactorSecrets,
  hasCreatedBy,
  expectedCreatedByFields,
  hasAccessToDepartments,
  expectedDepartmentsAmount,
  departmentIds,
  departmentNames,
  departmentCountries,
  hasAccessToRoles,
  expectedRolesAmount,
  roleIds,
  roleNames,
  hasAccessToPermissions,
  expectedPermissionsAmount,
  permissionIds,
  permissionNames,
  permissionCodes,
}: {
  users: User[] | UserResponseDto[] | undefined;
  amountExpected?: number | undefined;
  expectedFields?: (keyof User)[];
  ids?: UUID[] | undefined;
  emails?: string[] | undefined;
  firstNames?: string[] | undefined;
  lastNames?: string[] | undefined;
  passwords?: string[] | undefined;
  phones?: string[] | undefined;
  dateOfBirths?: string[] | undefined;
  isActiveStatuses?: boolean[] | undefined;
  isEmailVerifiedStatuses?: boolean[] | undefined;
  emailVerificationTokens?: string[] | undefined;
  passwordResetTokens?: string[] | undefined;
  passwordResetExpiresDates?: string[] | undefined;
  isTwoFactorEnabledStatuses?: boolean[] | undefined;
  twoFactorSecrets?: string[] | undefined;
  hasCreatedBy?: boolean | undefined;
  expectedCreatedByFields?: (keyof User['createdBy'])[] | undefined;
  hasAccessToDepartments?: boolean | undefined;
  expectedDepartmentsAmount?: number | undefined;
  departmentIds?: UUID[] | undefined;
  departmentNames?: string[] | undefined;
  departmentCountries?: COUNTRIES[] | undefined;
  hasAccessToRoles?: boolean | undefined;
  expectedRolesAmount?: number | undefined;
  roleIds?: UUID[] | undefined;
  roleNames?: string[] | undefined;
  hasAccessToPermissions?: boolean | undefined;
  expectedPermissionsAmount?: number | undefined;
  permissionIds?: UUID[] | undefined;
  permissionNames?: string[] | undefined;
  permissionCodes?: string[] | undefined;
}): void {
  const notEmpty = amountExpected != undefined && amountExpected > 0;
  const noUserReceived = users == undefined || users.length < 1;

  if (noUserReceived && notEmpty) {
    throw new Error('Could not find any departments');
  }

  if (!notEmpty && !noUserReceived) {
    throw new Error('Unexpected departments found');
  }

  if (!notEmpty && noUserReceived) {
    return;
  }

  if (users === undefined) {
    throw new Error('Users are undefined, cannot validate');
  }

  expect(users).toBeDefined();

  if (amountExpected !== undefined) {
    expect(users).toHaveLength(amountExpected);
  }

  users.forEach((user) => {
    expect(user).toBeDefined();

    if (ids !== undefined) {
      expect(user.id).toBeDefined();
      expect(ids).toContain(user.id);
    }

    if (emails !== undefined) {
      expect(user.email).toBeDefined();
      expect(emails).toContain(user.email);
    }

    if (firstNames !== undefined) {
      expect(user.firstName).toBeDefined();
      expect(firstNames).toContain(user.firstName);
    }

    if (lastNames !== undefined) {
      expect(user.lastName).toBeDefined();
      expect(lastNames).toContain(user.lastName);
    }

    if (hasAccessToDepartments !== undefined && hasAccessToDepartments) {
      expect(user).toHaveProperty('departments');

      expect(Array.isArray(user.departments)).toBe(true);
      validateDepartmentsResponse({
        departments: user.departments,
        amountExpected: expectedDepartmentsAmount,
        ids: departmentIds,
        names: departmentNames,
        countries: departmentCountries,
        hasAccessToUser: false,
      });
    }

    if (hasAccessToRoles !== undefined && hasAccessToRoles) {
      expect(user).toHaveProperty('userRoles');

      expect(Array.isArray(user.departments)).toBe(true);
      validateDepartmentsResponse({
        departments: user.departments,
        amountExpected: expectedDepartmentsAmount,
        ids: departmentIds,
        names: departmentNames,
        countries: departmentCountries,
        hasAccessToUser: false,
      });
    }
  });
}

export function validateUser({
  user,
  expectedFields,
  expectedIds,
  expectedEmails,
  hasAccess,
}: {
  user: User | UserResponseDto | undefined;
  expectedFields?: (keyof User)[] | undefined;
  expectedIds?: UUID[] | undefined;
  expectedEmails?: string[] | undefined;
  hasAccess?: boolean | undefined;
}): void {
  if (hasAccess === true && user == undefined) {
    throw new Error('User by is undefiend');
  }

  if (hasAccess === false && user != undefined) {
    throw new Error('User should not be present');
  }

  expectedFields ??= getUserProperties() as (keyof User)[];

  if (hasAccess === true && user != undefined) {
    for (const field of expectedFields) {
      expect(user).toHaveProperty(field);
    }

    if (expectedIds !== undefined && expectedFields.includes('id')) {
      expect(expectedIds).toContain(user.id);
    }

    if (expectedEmails !== undefined && expectedFields.includes('email')) {
      expect(expectedEmails).toContain(user.email);
    }
  }
}

export function validateManyUsers({
  users,
  amountExpected,
  expectedFields,
  expectedIds,
  expectedEmails,
  hasAccess,
}: {
  users: User[] | UserResponseDto[] | undefined;
  amountExpected?: number | undefined;
  expectedFields?: (keyof User)[] | undefined;
  expectedIds?: UUID[] | undefined;
  expectedEmails?: string[] | undefined;
  hasAccess?: boolean | undefined;
}): void {
  const noUsers = users == undefined || users.length === 0;

  if (hasAccess === false && noUsers) {
    return;
  }

  if (hasAccess === false && !noUsers) {
    throw new Error('Users should not be defined!');
  }

  if (hasAccess === true && noUsers) {
    throw new Error(
      'Users should be defined, can not validate properties of undefined',
    );
  }

  expectedFields ??= getUserProperties() as (keyof User)[];

  if (hasAccess != undefined && hasAccess) {
    expect(users).toBeInstanceOf(Array);

    if (noUsers) {
      throw new Error('Users are not defined');
    }

    if (amountExpected !== undefined) {
      expect(users).toHaveLength(amountExpected);
    }

    for (const user of users) {
      validateUser({
        user,
        expectedFields,
        hasAccess,
        expectedEmails,
        expectedIds,
      });
    }
  }
}

function normalizeDateLocal(value?: string | Date): string {
  if (value == undefined) {
    return '';
  }

  const date = new Date(value);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
