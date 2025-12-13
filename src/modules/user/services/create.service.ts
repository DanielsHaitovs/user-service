import { User } from '@/user/entities/user.entity';
import { UserDepartments } from '@/user/entities/userDepartments.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { UserHelperService } from '@/user/helper/helper.service';
import { UserDepartmentsService } from '@/user/services/departments/user-departments.service';
import { UserRoleService } from '@/user/services/roles/user-role.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';
import { DataSource } from 'typeorm';

@Injectable()
export class UserCreateService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userDepartmentsService: UserDepartmentsService,
    private readonly userRoleService: UserRoleService,
    private readonly userService: UserHelperService,
  ) {}

  /*
   * Creates a new user with optional department and role assignments
   */
  async createUser({
    user,
    departmentIds,
    roleIds,
    createdById,
  }: {
    user: User;
    departmentIds?: UUID[] | undefined;
    roleIds?: UUID[] | undefined;
    createdById: UUID;
  }): Promise<User> {
    const createdBy = await this.userService.findByIdOrFail({
      id: createdById,
    });

    user.createdBy = createdBy;

    return this.dataSource.transaction(async (manager) => {
      const newUser = await manager.save(User, user);

      if (roleIds != undefined && roleIds.length === 0) {
        const assignedRoles = await this.userRoleService.assignRolesToUser({
          userId: newUser.id,
          roleIds,
          assignedBy: createdBy.id,
        });

        newUser.userRoles = assignedRoles.map(
          ({ user: _omit, ...rest }) => rest as UserRole,
        );
      }

      if (departmentIds != undefined && departmentIds.length === 0) {
        const assignedDepartments =
          await this.userDepartmentsService.assignDepartmentsToUser({
            userId: newUser.id,
            departmentIds,
            assignedBy: createdBy.id,
          });

        newUser.userDepartments = assignedDepartments.map(
          ({ user: _omit, ...rest }) => rest as UserDepartments,
        );
      }

      return newUser;
    });
  }
}
