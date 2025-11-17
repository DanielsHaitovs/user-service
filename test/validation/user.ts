// import type { UserResponseDto } from '@/user/dto/user.dto';
// import type { User } from '@/user/entities/user.entity';

// import type { UUID } from 'crypto';

// import { validateDepartmentsResponse } from './department';

// function validateUsers({
//   users,
//   amountExpected,
//   ids,
//   emails,
//   firstNames,
//   lastNames,
//   hasAccessToDepartments,
//   expectedDepartmentsAmount,
//   departmentIds,
//   departmentNames,
//   departmentCountries,
//   hasAccessToRoles,
//   // expectedRolesAmount,
//   // roleIds,
//   // roleNames,
//   // hasAccessToPermissions,
//   // expectedPermissionsAmount,
//   // permissionIds,
//   // permissionNames,
//   // permissionCodes,
// }: {
//   users: User[] | UserResponseDto[] | undefined;
//   amountExpected?: number;
//   ids?: string[] | undefined;
//   emails?: string[] | undefined;
//   firstNames?: string[] | undefined;
//   lastNames?: string[] | undefined;
//   hasAccessToDepartments?: boolean;
//   expectedDepartmentsAmount?: number;
//   departmentIds?: UUID[] | undefined;
//   departmentNames?: string[] | undefined;
//   departmentCountries?: string[] | undefined;
//   // hasAccessToRoles?: boolean;
//   // expectedRolesAmount?: number;
//   // roleIds?: UUID[] | undefined;
//   // roleNames?: string[] | undefined;
//   // hasAccessToPermissions?: boolean;
//   // expectedPermissionsAmount?: number;
//   // permissionIds?: UUID[] | undefined;
//   // permissionNames?: string[] | undefined;
//   // permissionCodes?: string[] | undefined;
// }): void {
//   if (
//     (users?.length === 0 || users === undefined) &&
//     amountExpected != undefined &&
//     amountExpected !== 0
//   ) {
//     throw new Error('Could not find any users');
//   }

//   if (
//     (amountExpected === 0 || amountExpected === undefined) &&
//     users != undefined &&
//     users.length > 0
//   ) {
//     throw new Error('Unexpected users found');
//   }

//   if (
//     (amountExpected === 0 || amountExpected === undefined) &&
//     (users?.length === 0 || users === undefined)
//   ) {
//     return;
//   }

//   if (users === undefined) {
//     throw new Error('Users are undefined, cannot validate');
//   }

//   expect(users).toBeDefined();

//   if (amountExpected !== undefined) {
//     expect(users).toHaveLength(amountExpected);
//   }

//   users.forEach((user) => {
//     expect(user).toBeDefined();

//     if (ids !== undefined) {
//       expect(user.id).toBeDefined();
//       expect(ids).toContain(user.id);
//     }

//     if (emails !== undefined) {
//       expect(user.email).toBeDefined();
//       expect(emails).toContain(user.email);
//     }

//     if (firstNames !== undefined) {
//       expect(user.firstName).toBeDefined();
//       expect(firstNames).toContain(user.firstName);
//     }

//     if (lastNames !== undefined) {
//       expect(user.lastName).toBeDefined();
//       expect(lastNames).toContain(user.lastName);
//     }

//     if (hasAccessToDepartments !== undefined && hasAccessToDepartments) {
//       expect(user).toHaveProperty('departments');

//       expect(Array.isArray(user.departments)).toBe(true);
//       validateDepartmentsResponse({
//         departments: user.departments,
//         amountExpected: expectedDepartmentsAmount,
//         ids: departmentIds,
//         names: departmentNames,
//         countries: departmentCountries,
//         hasAccessToUser: false,
//       });
//     }

//     if (hasAccessToRoles !== undefined && hasAccessToRoles) {
//       expect(user).toHaveProperty('userRoles');

//       expect(Array.isArray(user.departments)).toBe(true);
//       validateDepartmentsResponse({
//         departments: user.departments,
//         amountExpected: expectedDepartmentsAmount,
//         ids: departmentIds,
//         names: departmentNames,
//         countries: departmentCountries,
//         hasAccessToUser: false,
//       });
//     }
//   });
// }

// function normalizeDateLocal(value?: string | Date): string {
//   if (value == undefined) {
//     return '';
//   }

//   const date = new Date(value);
//   const year = String(date.getFullYear());
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');

//   return `${year}-${month}-${day}`;
// }
