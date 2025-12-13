import { RoleHelperService } from '@/role/helper/helper.service';
import { AssignRolesDto, UnAssignRolesDto } from '@/user/dto/roles.dto';
import { UserRole } from '@/user/entities/userRoles.entity';
import { UserHelperService } from '@/user/helper/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly userService: UserHelperService,
    private readonly roleService: RoleHelperService,
  ) {}

  /**
   * Assigns multiple roles to a user, ensuring all roles exist and are valid.
   *
   * @param data - Data transfer object containing user ID, role IDs, and assignedBy user ID.
   * @returns A promise resolving to an array of UserRole entities representing the assignments.
   * @throws EntityNotFoundError if any of the specified roles do not exist.
   */
  async assignRolesToUser(data: AssignRolesDto): Promise<UserRole[]> {
    const { userId, roleIds, assignedBy } = data;

    const user = await this.userService.findByIdOrFail({
      id: userId,
      includeRoles: true,
      includeDepartments: false,
    });

    const assignedByUser = await this.userService.findByIdOrFail({
      id: assignedBy,
      includeDepartments: false,
      includeRoles: false,
    });

    const roles = await this.roleService.getManyByIdsOrFail(roleIds);

    const userRoles = roles.map((role) => {
      return this.userRoleRepository.create({
        user,
        role,
        assignedBy: assignedByUser,
      });
    });

    return await this.userRoleRepository.save(userRoles);
  }

  /**
   * Unassigns multiple roles from a user.
   *
   * @param data - Data transfer object containing user ID and role IDs to unassign and user id that unassigned the roles.
   * @returns A promise resolving to an object with the count of deleted assignments.
   */
  async unassignRolesFromUsers(
    data: UnAssignRolesDto,
  ): Promise<{ deleted: number; status: string }> {
    const { userIds, roleIds } = data;

    await this.userService.findManyByIdsOrFail(userIds);
    await this.roleService.getManyByIdsOrFail(roleIds);

    const result = await this.userRoleRepository
      .createQueryBuilder()
      .delete()
      .from(UserRole)
      .where('role.id IN (:...roleIds)', { roleIds })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .execute();

    return {
      deleted: result.affected ?? 0,
      status: 'Roles unassigned successfully',
    };
  }
}
