import type { DepartmentService } from '@/department/services/department.service';
import type { User } from '@/modules/user/entities/user.entity';
import type { PermissionService } from '@/role/services/permission/permission.service';
import type { RoleService } from '@/role/services/role/role.service';
import { createDepartment } from '@/test/factories/department.factory';
import { createRoleWithPermissions } from '@/test/factories/role.factory';
import type { CreateUserDto } from '@/user/dto/user.dto';
import type { UserService } from '@/user/services/user.service';
import { generatePassword } from '@/utils/token-generator.util';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';
import { v4 as uuid } from 'uuid';

export async function createUser(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
  createdBy: UUID,
): Promise<User> {
  const department = await createDepartment({
    service: departmentService,
    createdBy,
    hasAccessToUser: true,
  });
  const role = await createRoleWithPermissions({
    roleService,
    permissionService,
    createdBy,
    hasAccessToCreatedBy: true,
    hasAccessToPermissions: true,
  });

  const userEmail = `${uuid()}@example.com`;

  const userDto: CreateUserDto = {
    departmentIds: [department.id],
    roleIds: [role.id],
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: userEmail,
    password: generatePassword(),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate(),
    isTwoFactorEnabled: true,
    isActive: true,
  };

  return await userService.create(userDto, createdBy);

  // validateUser(newUser, userDto);

  // return newUser;
}

// export async function findUserByIds(
//   userService: UserService,
//   roleService: RoleService,
//   permissionService: PermissionService,
//   departmentService: DepartmentService,
//   createdBy: UUID,
//   hasAccessToDepartments: boolean,
//   hasAccessToRoles: boolean,
//   hasAccessToPermissions: boolean,
// ): Promise<User[]> {
//   const newUser = await createUser(
//     userService,
//     roleService,
//     permissionService,
//     departmentService,
//     createdBy,
//   );

//   return await userService.findByIds({
//     ids: [newUser.id],
//     pagination: { page: 1, limit: 1 },
//     hasAccessToDepartments,
//     hasAccessToRoles,
//     hasAccessToPermissions,
//   });

//   // validateUser(user, newUser);
// }

// export async function findUserByEmail(
//   userService: UserService,
//   roleService: RoleService,
//   permissionService: PermissionService,
//   departmentService: DepartmentService,
//   createdBy: UUID,
//   hasAccessToDepartments: boolean,
//   hasAccessToRoles: boolean,
//   hasAccessToPermissions: boolean,
// ): Promise<User[]> {
//   const newUser = await createUser(
//     userService,
//     roleService,
//     permissionService,
//     departmentService,
//     createdBy,
//   );

//   return await userService.findByEmails({
//     emails: [newUser.email],
//     pagination: { page: 1, limit: 1 },
//     hasAccessToDepartments,
//     hasAccessToRoles,
//     hasAccessToPermissions,
//   });
// }

// export async function updateUserById(
//   userService: UserService,
//   roleService: RoleService,
//   permissionService: PermissionService,
//   departmentService: DepartmentService,
//   createdBy: UUID,
// ): Promise<User> {
//   const newUser = await createUser(
//     userService,
//     roleService,
//     permissionService,
//     departmentService,
//     createdBy,
//   );

//   const updatedUserDto: UpdateUserDto = {
//     firstName: faker.person.firstName(),
//     lastName: faker.person.lastName(),
//     email: `${uuid()}@example.com`,
//     password: generatePassword(),
//     phone: faker.phone.number(),
//     dateOfBirth: faker.date.birthdate(),
//     isActive: faker.datatype.boolean(),
//     isEmailVerified: faker.datatype.boolean(),
//   };

//   const updatedUser = await userService.updateById(newUser.id, updatedUserDto);

//   validateUser(updatedUser, updatedUserDto);

//   return updatedUser;
// }

// export async function updateUserByEmail(
//   userService: UserService,
//   roleService: RoleService,
//   permissionService: PermissionService,
//   departmentService: DepartmentService,
//   createdBy: UUID,
// ): Promise<User> {
//   const newUser = await createUser(
//     userService,
//     roleService,
//     permissionService,
//     departmentService,
//     createdBy,
//   );

//   const updatedUserDto: UpdateUserDto = {
//     firstName: faker.person.firstName(),
//     lastName: faker.person.lastName(),
//     email: `${uuid()}@example.com`,
//     password: generatePassword(),
//     phone: faker.phone.number(),
//     dateOfBirth: faker.date.birthdate(),
//     isActive: faker.datatype.boolean(),
//     isEmailVerified: faker.datatype.boolean(),
//   };

//   const updatedUser = await userService.updateByEmail(
//     newUser.email,
//     updatedUserDto,
//   );

//   validateUser(updatedUser, updatedUserDto);

//   return updatedUser;
// }

// export async function deleteUsersByIds(
//   userService: UserService,
//   roleService: RoleService,
//   permissionService: PermissionService,
//   departmentService: DepartmentService,
//   createdBy: UUID,
// ): Promise<void> {
//   const user = await createUser(
//     userService,
//     roleService,
//     permissionService,
//     departmentService,
//     createdBy,
//   );

//   const result = await userService.deleteByIds([user.id]);

//   expect(result).toEqual({ deleted: 1 });
//   await expect(userService.findById(user.id)).rejects.toThrow(
//     EntityNotFoundError,
//   );
// }

// function validateUser(user: User, newUser: User | UpdateUserDto): void {
//   expect(user).toBeDefined();
//   expect(user.id).toBeDefined();
//   expect(user.firstName).toBe(newUser.firstName);
//   expect(user.lastName).toBe(newUser.lastName);
//   expect(user.email).toBe(newUser.email);
//   expect(user.password).toBe(newUser.password);
//   expect(user.phone).toBe(newUser.phone);
//   expect(normalizeDateLocal(user.dateOfBirth)).toBe(
//     normalizeDateLocal(newUser.dateOfBirth),
//   );
//   expect(user.isActive).toBe(newUser.isActive);
//   expect(user.isEmailVerified).toBe(newUser.isEmailVerified);

//   if (newUser instanceof User) {
//     expect(user.emailVerificationToken).toBe(newUser.emailVerificationToken);
//     expect(user.passwordResetToken).toBe(newUser.passwordResetToken);
//     expect(user.passwordResetExpires).toBe(newUser.passwordResetExpires);
//   }
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
