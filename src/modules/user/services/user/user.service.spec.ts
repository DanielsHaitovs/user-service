import { DepartmentService } from '@/department/services/department.service';
import { SYSTEM_USER_EMAIL } from '@/lib/const/user.const';
import { PermissionService } from '@/role/services/permission.service';
import { RoleService } from '@/role/services/role.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createDepartment } from '@/test/factories/department.factory';
import {
  createUser,
  deleteUsersByIds,
  findUserByEmail,
  findUserById,
  updateUserByEmail,
  updateUserById,
} from '@/test/factories/user.factory';
import type { CreateUserDto, UpdateUserDto } from '@/user/dto/user.dto';
import { UserService } from '@/user/services/user/user.service';
import { generatePassword } from '@/utils/token-generator.util';
import { faker } from '@faker-js/faker/.';
import { ConflictException, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('UserService (Integration - PostgreSQL)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let departmentService: DepartmentService;
  let userService: UserService;
  let systemUserId: UUID;

  beforeAll(async () => {
    ({ moduleFixture: module, app } = await bootstrapTestApp());
    permissionService = module.get<PermissionService>(PermissionService);
    roleService = module.get<RoleService>(RoleService);
    userService = module.get<UserService>(UserService);
    departmentService = module.get<DepartmentService>(DepartmentService);
    systemUserId = await getSystemUserId(app);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create()', () => {
    it('should create and persist user', async () => {
      await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });
    it('should throw notfound error, because department(s) for user is not found', async () => {
      const userDto: CreateUserDto = {
        departmentIds: [uuid() as UUID],
        roleIds: [uuid() as UUID],
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
        isTwoFactorEnabled: true,
        isActive: true,
        isEmailVerified: false,
      };

      await expect(userService.create(userDto, uuid() as UUID)).rejects.toThrow(
        EntityNotFoundError,
      );
    });
    it('should throw notfound error, because role(s) for user is not found', async () => {
      const department = await createDepartment(
        departmentService,
        systemUserId,
      );

      const userDto: CreateUserDto = {
        departmentIds: [department.id],
        roleIds: [uuid() as UUID],
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
        isTwoFactorEnabled: true,
        isActive: true,
        isEmailVerified: false,
      };

      await expect(userService.create(userDto, uuid() as UUID)).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it('should throw conflict error because user email already exists', async () => {
      const systemUser = await userService.findByEmail(SYSTEM_USER_EMAIL);
      const user = await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );

      if (user.departments[0] === undefined) {
        throw new Error('Department for user should be defined');
      }

      if (user.userRoles[0]?.id === undefined) {
        throw new Error('Role for user should be defined');
      }

      const userWithTheSameEmail: CreateUserDto = {
        departmentIds: [user.departments[0].id],
        roleIds: [user.userRoles[0].id],
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: user.email,
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
        isTwoFactorEnabled: true,
        isActive: true,
        isEmailVerified: false,
      };

      await expect(
        userService.create(userWithTheSameEmail, systemUser.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById()', () => {
    it('should find user by id(uuid)', async () => {
      await findUserById(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });

    it('should throw not found exception, because user id does not exist', async () => {
      await expect(userService.findById(uuid() as UUID)).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
  describe('findByEmail()', () => {
    it('should find user by id(uuid)', async () => {
      await findUserByEmail(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });

    it('should throw not found exception, because user email does not exist', async () => {
      await expect(
        userService.findByEmail('123fake@email123.com'),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('updateById()', () => {
    it('should update user by uuid', async () => {
      await updateUserById(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });

    it('should throw Conflict exception, because user email already exists', async () => {
      const user = await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );

      const updatedUserDto: UpdateUserDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: user.email,
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
      };

      const anotherUser = await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );

      await expect(
        userService.updateById(anotherUser.id, updatedUserDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw not found exception, because user id does not exist', async () => {
      const updatedUserDto: UpdateUserDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `${uuid()}@example.com`,
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
      };

      await expect(
        userService.updateById(uuid() as UUID, updatedUserDto),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
  describe('updateByEmail()', () => {
    it('should update user by email', async () => {
      await updateUserByEmail(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });

    it('should throw Conflict exception, because user email already exists', async () => {
      const user = await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );

      const updatedUserDto: UpdateUserDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: user.email,
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
      };

      const anotherUser = await createUser(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );

      await expect(
        userService.updateByEmail(anotherUser.email, updatedUserDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw not found exception, because user email does not exist', async () => {
      const updatedUserDto: UpdateUserDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `${uuid()}@example.com`,
        password: generatePassword(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate(),
      };

      await expect(
        userService.updateByEmail(`${uuid()}@example.com`, updatedUserDto),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('deleteIds()', () => {
    it('should delete user by uuids', async () => {
      await deleteUsersByIds(
        userService,
        roleService,
        permissionService,
        departmentService,
        systemUserId,
      );
    });

    it('should throw not found exception, because user id(s) does not exist', async () => {
      await expect(userService.deleteByIds([uuid() as UUID])).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
});
