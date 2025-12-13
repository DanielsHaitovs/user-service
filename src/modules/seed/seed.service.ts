import { Departments } from '@/department/entities/department.entity';
import { RandomCountry } from '@/lib/const/countries.const';
import {
  CREATE_DEPARTMENT,
  CREATE_USER_DEPARTMENT,
  DELETE_DEPARTMENT,
  DELETE_USER_DEPARTMENT,
  READ_DEPARTMENT,
  READ_USER_DEPARTMENT,
  UPDATE_DEPARTMENT,
  UPDATE_USER_DEPARTMENT,
} from '@/lib/const/department.const';
import {
  CREATE_PERMISSION,
  DELETE_PERMISSION,
  READ_PERMISSION,
  UPDATE_PERMISSION,
} from '@/lib/const/permission.const';
import {
  CREATE_ROLE,
  DELETE_ROLE,
  READ_ROLE,
  UPDATE_ROLE,
} from '@/lib/const/role.const';
import {
  ASSIGN_USER_DEPARTMENT,
  ASSIGN_USER_ROLE,
  CREATE_USER,
  CREATE_USER_ROLE,
  DELETE_USER,
  DELETE_USER_ROLE,
  READ_USER,
  READ_USER_ROLE,
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
  UPDATE_USER,
  UPDATE_USER_ROLE,
} from '@/lib/const/user.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import { User } from '@/user/entities/user.entity';
import { UserDepartments } from '@/user/entities/userDepartments.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { getTraceId } from '@/utils/trace.util';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private readonly batchSize = 1000;
  private readonly concurrency = 100;
  private readonly permissionMap: Record<string, string> = {
    [READ_DEPARTMENT]: 'Read Department',
    [CREATE_DEPARTMENT]: 'Create Department',
    [UPDATE_DEPARTMENT]: 'Update Department',
    [DELETE_DEPARTMENT]: 'Delete Department',
    [ASSIGN_USER_DEPARTMENT]: 'Assign User Department',
    [READ_PERMISSION]: 'Read Permission',
    [CREATE_PERMISSION]: 'Create Permission',
    [UPDATE_PERMISSION]: 'Update Permission',
    [DELETE_PERMISSION]: 'Delete Permission',
    [READ_USER_DEPARTMENT]: 'Read User Department',
    [CREATE_USER_DEPARTMENT]: 'Create User Department',
    [UPDATE_USER_DEPARTMENT]: 'Update User Department',
    [DELETE_USER_DEPARTMENT]: 'Delete User Department',
    [ASSIGN_USER_DEPARTMENT]: 'Assign User Department',
    [READ_ROLE]: 'Read Role',
    [CREATE_ROLE]: 'Create Role',
    [UPDATE_ROLE]: 'Update Role',
    [DELETE_ROLE]: 'Delete Role',
    [READ_USER_ROLE]: 'Read User Role',
    [CREATE_USER_ROLE]: 'Create User Role',
    [UPDATE_USER_ROLE]: 'Update User Role',
    [DELETE_USER_ROLE]: 'Delete User Role',
    [ASSIGN_USER_ROLE]: 'Assign User Role',
    [CREATE_USER]: 'Create User',
    [UPDATE_USER]: 'Update User',
    [DELETE_USER]: 'Delete User',
    [READ_USER]: 'Read User',
  };

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async seedUser({
    passwordHash,
    systemUserID,
  }: {
    passwordHash?: string;
    systemUserID?: { id: UUID };
  }): Promise<User> {
    systemUserID ??= await this.getSystemUserId();
    passwordHash ??= await bcrypt.hash(SYSTEM_USER_PASSWORD, 10);

    const userRepo = this.entityManager.getRepository(User);
    const userEmail = `${uuid()}@example.com`;

    const newUser = userRepo.create({
      email: userEmail,
      firstName: faker.internet.username(),
      lastName: faker.internet.displayName(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.past({ years: 80, refDate: new Date() }),
      country: RandomCountry(),
      emailVerificationToken: uuid(),
      passwordResetToken: uuid(),
      passwordResetExpires: new Date(Date.now() + 3600000),
      twoFactorSecret: uuid(),
      password: passwordHash,
      isActive: true,
      isEmailVerified: true,
      isTwoFactorEnabled: false,
      createdBy: systemUserID,
    });

    return await userRepo.save(newUser);
  }

  async seedDepartment({
    systemUserID,
  }: {
    systemUserID?: { id: UUID };
  }): Promise<Departments> {
    systemUserID ??= await this.getSystemUserId();

    const department = this.entityManager.getRepository(Departments).create({
      name: `${faker.lorem.word()}-seed-${uuid()}`,
      country: RandomCountry(),
      createdBy: systemUserID,
    });

    return await this.entityManager.getRepository(Departments).save(department);
  }

  async seedRole({
    systemUserID,
  }: {
    systemUserID?: { id: UUID };
  }): Promise<Roles> {
    systemUserID ??= await this.getSystemUserId();

    const role = this.entityManager.getRepository(Roles).create({
      name: `seed-${uuid()}`,
      createdBy: systemUserID,
    });

    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedPermissions({
    systemUserID,
  }: {
    systemUserID?: { id: UUID };
  }): Promise<Permission[]> {
    systemUserID ??= await this.getSystemUserId();

    const listOfPermissionCodes = Object.keys(this.permissionMap);

    const permissions = await this.entityManager
      .createQueryBuilder(Permission, 'permission')
      .where('permission.code IN (:...codes)', {
        codes: listOfPermissionCodes,
      })
      .getMany();

    if (permissions.length === 0) {
      const newPermissions = this.entityManager
        .getRepository(Permission)
        .create([
          {
            name: 'Read Department',
            code: READ_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Create Department',
            code: CREATE_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Update Department',
            code: UPDATE_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Delete Department',
            code: DELETE_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Read User Department',
            code: READ_USER_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Create User Department',
            code: CREATE_USER_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Update User Department',
            code: UPDATE_USER_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Delete User Department',
            code: DELETE_USER_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Assign User Department',
            code: ASSIGN_USER_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: 'Read Permission',
            code: READ_PERMISSION,
            createdBy: systemUserID,
          },
          {
            name: 'Create Permission',
            code: CREATE_PERMISSION,
            createdBy: systemUserID,
          },
          {
            name: 'Update Permission',
            code: UPDATE_PERMISSION,
            createdBy: systemUserID,
          },
          {
            name: 'Delete Permission',
            code: DELETE_PERMISSION,
            createdBy: systemUserID,
          },
          { name: 'Read Role', code: READ_ROLE, createdBy: systemUserID },
          { name: 'Create Role', code: CREATE_ROLE, createdBy: systemUserID },
          { name: 'Update Role', code: UPDATE_ROLE, createdBy: systemUserID },
          { name: 'Delete Role', code: DELETE_ROLE, createdBy: systemUserID },
          {
            name: 'Read User Role',
            code: READ_USER_ROLE,
            createdBy: systemUserID,
          },
          {
            name: 'Create User Role',
            code: CREATE_USER_ROLE,
            createdBy: systemUserID,
          },
          {
            name: 'Update User Role',
            code: UPDATE_USER_ROLE,
            createdBy: systemUserID,
          },
          {
            name: 'Delete User Role',
            code: DELETE_USER_ROLE,
            createdBy: systemUserID,
          },
          {
            name: 'Assign User Role',
            code: ASSIGN_USER_ROLE,
            createdBy: systemUserID,
          },
          { name: 'Create User', code: CREATE_USER, createdBy: systemUserID },
          { name: 'Update User', code: UPDATE_USER, createdBy: systemUserID },
          { name: 'Delete User', code: DELETE_USER, createdBy: systemUserID },
          { name: 'Read User', code: READ_USER, createdBy: systemUserID },
        ]);

      return await this.entityManager
        .getRepository(Permission)
        .save(newPermissions);
    } else if (permissions.length === listOfPermissionCodes.length) {
      return permissions;
    } else {
      const missingPermissions = listOfPermissionCodes.filter((code) => {
        return !permissions.some((permission) => permission.code === code);
      });

      this.logger.error(
        `Some required permissions are missing in the database: ${missingPermissions.join(
          ', ',
        )}`,
      );

      const newPermissions = this.entityManager
        .getRepository(Permission)
        .create(
          missingPermissions.map((code) => {
            return {
              name: this.permissionMap[code] ?? code,
              code,
              createdBy: systemUserID,
            };
          }),
        );

      const savedPermissions = await this.entityManager
        .getRepository(Permission)
        .save(newPermissions);

      return [...permissions, ...savedPermissions];
    }
  }

  async seedRoleWithPermissions({
    systemUserID,
    permissions,
  }: {
    systemUserID?: { id: UUID };
    permissions?: Permission[] | undefined;
  }): Promise<Roles> {
    systemUserID ??= await this.getSystemUserId();

    const role = await this.seedRole({ systemUserID });
    permissions ??= await this.seedPermissions({ systemUserID });

    role.permissions = permissions;

    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedUserRelations({
    passwordHash,
    systemUserID,
    permissions,
  }: {
    passwordHash?: string;
    systemUserID?: { id: UUID };
    permissions?: Permission[];
  }): Promise<User> {
    systemUserID ??= await this.getSystemUserId();
    passwordHash ??= await bcrypt.hash(SYSTEM_USER_PASSWORD, 10);

    const user = await this.seedUser({ passwordHash, systemUserID });
    const department = await this.seedDepartment({ systemUserID });
    const role = await this.seedRoleWithPermissions({
      systemUserID,
      permissions,
    });

    user.userDepartments = [];
    user.userRoles = [];

    const userRole = this.entityManager.getRepository(UserRole).create({
      user,
      role,
      assignedBy: systemUserID,
    });

    user.userRoles.push(userRole);

    const userDepartment = this.entityManager
      .getRepository(UserDepartments)
      .create({
        user,
        department,
        assignedBy: systemUserID,
      });

    user.userDepartments.push(userDepartment);

    await this.entityManager.getRepository(UserRole).save(userRole);
    await this.entityManager
      .getRepository(UserDepartments)
      .save(userDepartment);
    return await this.entityManager.getRepository(User).save(user);
  }

  async seedUserRelationsBatched(amount: number): Promise<void> {
    const systemUserID = await this.getSystemUserId();
    const permissions = await this.seedPermissions({ systemUserID });

    const traceId = getTraceId() ?? 'N/A';
    const passwordHash = await bcrypt.hash(SYSTEM_USER_PASSWORD, 10);

    const batchCount = Math.ceil(amount / this.batchSize);

    this.logger.log(
      `Seeding ${amount.toString()} user relations in ${batchCount.toString()} batches... traceId: ${traceId}`,
    );

    for (let i = 0; i < batchCount; i++) {
      const currentBatchAmount = Math.min(
        this.batchSize,
        amount - i * this.batchSize,
      );
      this.logger.log(
        `Seeding batch ${(i + 1).toString()}/${batchCount.toString()} (${currentBatchAmount.toString()} items)... traceId: ${traceId}`,
      );

      let index = 0;

      const worker = async (): Promise<void> => {
        while (index < currentBatchAmount) {
          index = index + 1;
          await this.seedUserRelations({
            passwordHash,
            systemUserID,
            permissions,
          });
        }
      };

      const workers = Array.from({ length: this.concurrency }, worker);
      await Promise.all(workers);

      this.logger.log(
        `Finished batch ${(i + 1).toString()}/${batchCount.toString()}... traceId: ${traceId}`,
      );
    }

    this.logger.log(
      `Completed batches ${batchCount.toString()} ... traceId: ${traceId}`,
    );
  }

  private async getSystemUserId(): Promise<{ id: UUID }> {
    return await this.entityManager
      .getRepository(User)
      .findOneByOrFail({ email: SYSTEM_USER_EMAIL });
  }
}
