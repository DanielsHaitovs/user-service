import { UserDepartmentsService } from '@/userDepartmentService/user-departments.service';
import { User } from '@/userEntities/user.entity';
import { UserDepartments } from '@/userEntities/userDepartments.entity';
import { UserRole } from '@/userEntities/userRoles.entity';
import { UserHelperService } from '@/userHelper/helper.service';
import { UserRoleService } from '@/userRoleService/user-role.service';
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
          ({ users: _omit, ...rest }) => rest as UserRole,
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
          ({ users: _omit, ...rest }) => rest as UserDepartments,
        );
      }

      return newUser;
    });
  }
}
