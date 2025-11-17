import { Departments } from '@/department/entities/department.entity';
import { READ_DEPARTMENT } from '@/lib/const/department.const';
import { READ_PERMISSION, READ_ROLE } from '@/lib/const/role.const';
import {
  READ_USER,
  READ_USER_ROLE,
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
  private readonly createdBy = {
    id: '25dd058e-5776-4360-91df-d13d8d45529e' as UUID,
  };

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async seedUser(): Promise<User> {
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
      password: await bcrypt.hash(SYSTEM_USER_PASSWORD, 10),
      isActive: true,
      isEmailVerified: true,
      isTwoFactorEnabled: false,
      createdBy: this.createdBy,
    });

    return await userRepo.save(newUser);
  }

  async seedDepartment(): Promise<Departments> {
    const department = this.entityManager.getRepository(Departments).create({
      name: `${faker.lorem.word()}-seed-${uuid()}`,
      country: 'US',
      createdBy: this.createdBy,
    });

    return await this.entityManager.getRepository(Departments).save(department);
  }

  async seedRole(): Promise<Roles> {
    const role = this.entityManager.getRepository(Roles).create({
      name: `seed-${uuid()}`,
      createdBy: this.createdBy,
    });

    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedPermissions(): Promise<Permission[]> {
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
            createdBy: this.createdBy,
          },
          {
            name: READ_ROLE,
            code: READ_ROLE,
            createdBy: this.createdBy,
          },
          {
            name: READ_PERMISSION,
            code: READ_PERMISSION,
            createdBy: this.createdBy,
          },
          {
            name: READ_USER_ROLE,
            code: READ_USER_ROLE,
            createdBy: this.createdBy,
          },
          {
            name: READ_USER,
            code: READ_USER,
            createdBy: this.createdBy,
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

  async seedRoleWithPermissions(): Promise<Roles> {
    const role = await this.seedRole();
    const permissions = await this.seedPermissions();
    role.permissions = permissions;
    return await this.entityManager.getRepository(Roles).save(role);
  }

  async seedUserRelations(): Promise<User> {
    const user = await this.seedUser();
    const department = await this.seedDepartment();
    const role = await this.seedRoleWithPermissions();

    user.departments = [department];
    user.userRoles = [];

    const userRole = this.entityManager.getRepository(UserRole).create({
      user,
      role,
      assignedBy: this.createdBy,
    });

    user.userRoles.push(userRole);

    await this.entityManager.getRepository(UserRole).save(userRole);
    return await this.entityManager.getRepository(User).save(user);
  }

  async seedUserRelationsBatched(amount: number): Promise<void> {
    const batchSize = 5000;
    const batchCount = Math.ceil(amount / batchSize);
    const traceId = getTraceId() ?? 'N/A';

    this.logger.log(
      `Seeding ${amount.toString()} user relations in ${batchCount.toString()} batches... traceId: ${traceId}`,
    );
    for (let i = 0; i < batchCount; i++) {
      const promises = new Array<Promise<User>>();

      this.logger.log(
        `Seeding batch ${(i + 1).toString()}/${batchCount.toString()}... traceId: ${traceId}`,
      );

      const currentBatchAmount = Math.min(batchSize, amount - i * batchSize);
      for (let j = 0; j < currentBatchAmount; j++) {
        promises.push(this.seedUserRelations());
      }

      this.logger.log(
        `Finished seeding batch ${(i + 1).toString()}/${batchCount.toString()} ... traceId: ${traceId}`,
      );
      await Promise.all(promises);
    }

    this.logger.log(
      `Completed batches ${batchCount.toString()} ... traceId: ${traceId}`,
    );
  }
}
