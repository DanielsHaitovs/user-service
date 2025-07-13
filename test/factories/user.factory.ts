import type { DepartmentService } from '@/department/services/department.service';
import { SYSTEM_USER_EMAIL } from '@/lib/const/user.const';
import { User } from '@/modules/user/entities/user.entity';
import type { UserService } from '@/modules/user/services/user/user.service';
import type { PermissionService } from '@/role/services/permission.service';
import type { RoleService } from '@/role/services/role.service';
import { createDepartment } from '@/test/factories/department.factory';
import { createRoleWithPermissins } from '@/test/factories/role.factory';
import type { CreateUserDto, UpdateUserDto } from '@/user/dto/user.dto';
import { generatePassword } from '@/utils/token-generator.util';
import { faker } from '@faker-js/faker/.';

import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

export async function createUser(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<User> {
  const systemUser = await userService.findByEmail(SYSTEM_USER_EMAIL);
  const department = await createDepartment(departmentService);
  const role = await createRoleWithPermissins(roleService, permissionService);

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
    isEmailVerified: false,
  };

  const newUser = await userService.create(userDto, systemUser.id);

  validateUser(newUser, userDto);

  return newUser;
}

export async function findUserById(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<User> {
  const newUser = await createUser(
    userService,
    roleService,
    permissionService,
    departmentService,
  );

  const user = await userService.findById(newUser.id);

  validateUser(user, newUser);

  return user;
}

export async function findUserByEmail(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<User> {
  const newUser = await createUser(
    userService,
    roleService,
    permissionService,
    departmentService,
  );

  const user = await userService.findByEmail(newUser.email);

  validateUser(user, newUser);

  return user;
}

export async function updateUserById(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<User> {
  const newUser = await createUser(
    userService,
    roleService,
    permissionService,
    departmentService,
  );

  const updatedUserDto: UpdateUserDto = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${uuid()}@example.com`,
    password: generatePassword(),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate(),
    isActive: faker.datatype.boolean(),
    isEmailVerified: faker.datatype.boolean(),
  };

  const updatedUser = await userService.updateById(newUser.id, updatedUserDto);

  validateUser(updatedUser, updatedUserDto);

  return updatedUser;
}

export async function updateUserByEmail(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<User> {
  const newUser = await createUser(
    userService,
    roleService,
    permissionService,
    departmentService,
  );

  const updatedUserDto: UpdateUserDto = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${uuid()}@example.com`,
    password: generatePassword(),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate(),
    isActive: faker.datatype.boolean(),
    isEmailVerified: faker.datatype.boolean(),
  };

  const updatedUser = await userService.updateByEmail(
    newUser.email,
    updatedUserDto,
  );

  validateUser(updatedUser, updatedUserDto);

  return updatedUser;
}

export async function deleteUsersByIds(
  userService: UserService,
  roleService: RoleService,
  permissionService: PermissionService,
  departmentService: DepartmentService,
): Promise<void> {
  const user = await createUser(
    userService,
    roleService,
    permissionService,
    departmentService,
  );

  const result = await userService.deleteByIds([user.id]);

  expect(result).toEqual({ deleted: 1 });
  await expect(userService.findById(user.id)).rejects.toThrow(
    EntityNotFoundError,
  );
}

function validateUser(user: User, newUser: User | UpdateUserDto): void {
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
  expect(user.firstName).toBe(newUser.firstName);
  expect(user.lastName).toBe(newUser.lastName);
  expect(user.email).toBe(newUser.email);
  expect(user.password).toBe(newUser.password);
  expect(user.phone).toBe(newUser.phone);
  expect(normalizeDateLocal(user.dateOfBirth)).toBe(
    normalizeDateLocal(newUser.dateOfBirth),
  );
  expect(user.isActive).toBe(newUser.isActive);
  expect(user.isEmailVerified).toBe(newUser.isEmailVerified);

  if (newUser instanceof User) {
    expect(user.emailVerificationToken).toBe(newUser.emailVerificationToken);
    expect(user.passwordResetToken).toBe(newUser.passwordResetToken);
    expect(user.passwordResetExpires).toBe(newUser.passwordResetExpires);
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
