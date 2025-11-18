import { Departments } from '@/department/entities/department.entity';
import { READ_DEPARTMENT } from '@/lib/const/department.const';
import { READ_PERMISSION, READ_ROLE } from '@/lib/const/role.const';
import {
  READ_USER,
  READ_USER_ROLE,
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import { User } from '@/user/entities/user.entity';
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
  private readonly batchSize = 500;
  private readonly concurrency = 50;

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

  async seedDepartment(systemUserID?: { id: UUID }): Promise<Departments> {
    systemUserID ??= await this.getSystemUserId();

    const department = this.entityManager.getRepository(Departments).create({
      name: `${faker.lorem.word()}-seed-${uuid()}`,
      country: 'US',
      createdBy: systemUserID,
    });

    return await this.entityManager.getRepository(Departments).save(department);
  }

  async seedRole(systemUserID?: { id: UUID }): Promise<Roles> {
    systemUserID ??= await this.getSystemUserId();

    const role = this.entityManager.getRepository(Roles).create({
      name: `seed-${uuid()}`,
      createdBy: systemUserID,
    });

    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedPermissions(systemUserID?: { id: UUID }): Promise<Permission[]> {
    systemUserID ??= await this.getSystemUserId();

    const permissions = await this.entityManager
      .createQueryBuilder(Permission, 'permission')
      .where('permission.code IN (:...codes)', {
        codes: [
          READ_DEPARTMENT,
          READ_ROLE,
          READ_PERMISSION,
          READ_USER_ROLE,
          READ_USER,
        ],
      })
      .getMany();

    if (permissions.length === 0) {
      const newPermissions = this.entityManager
        .getRepository(Permission)
        .create([
          {
            name: READ_DEPARTMENT,
            code: READ_DEPARTMENT,
            createdBy: systemUserID,
          },
          {
            name: READ_ROLE,
            code: READ_ROLE,
            createdBy: systemUserID,
          },
          {
            name: READ_PERMISSION,
            code: READ_PERMISSION,
            createdBy: systemUserID,
          },
          {
            name: READ_USER_ROLE,
            code: READ_USER_ROLE,
            createdBy: systemUserID,
          },
          {
            name: READ_USER,
            code: READ_USER,
            createdBy: systemUserID,
          },
        ]);
      return await this.entityManager
        .getRepository(Permission)
        .save(newPermissions);
    } else if (permissions.length === 5) {
      return permissions;
    } else {
      throw new Error('Some required permissions are missing in the database');
    }
  }

  async seedRoleWithPermissions(systemUserID?: { id: UUID }): Promise<Roles> {
    systemUserID ??= await this.getSystemUserId();

    const role = await this.seedRole(systemUserID);
    const permissions = await this.seedPermissions(systemUserID);
    role.permissions = permissions;
    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedUserRelations({
    passwordHash,
    systemUserID,
  }: {
    passwordHash?: string;
    systemUserID?: { id: UUID };
  }): Promise<User> {
    systemUserID ??= await this.getSystemUserId();
    passwordHash ??= await bcrypt.hash(SYSTEM_USER_PASSWORD, 10);

    const user = await this.seedUser({ passwordHash, systemUserID });
    const department = await this.seedDepartment(systemUserID);
    const role = await this.seedRoleWithPermissions(systemUserID);

    user.departments = [department];
    user.userRoles = [];

    const userRole = this.entityManager.getRepository(UserRole).create({
      user,
      role,
      assignedBy: systemUserID,
    });

    user.userRoles.push(userRole);

    await this.entityManager.getRepository(UserRole).save(userRole);
    return await this.entityManager.getRepository(User).save(user);
  }

  async seedUserRelationsBatched(amount: number): Promise<void> {
    const systemUserID = await this.getSystemUserId();
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
          await this.seedUserRelations({ passwordHash, systemUserID });
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
