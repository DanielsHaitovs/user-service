import { HelperService as RoleHelperService } from '@/role/services/role/helper.service';
import { AssignRoleIdsDto } from '@/user/dto/userRole.dto';
import { UserRole } from '@/user/entities/userRoles.entity';
import { HelperService } from '@/user/services/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly helperService: HelperService,
    private readonly roleHelperService: RoleHelperService,
  ) {}

  /**
   * Assigns multiple roles to a user, ensuring all roles exist and are valid.
   *
   * @param data - Data transfer object containing user ID, role IDs, and assignedBy user ID.
   * @returns A promise resolving to an array of UserRole entities representing the assignments.
   * @throws EntityNotFoundError if any of the specified roles do not exist.
   */
  async assignRolesToUser(data: AssignRoleIdsDto): Promise<UserRole[]> {
    const { userId, roleIds, assignedBy } = data;

    const user = await this.helperService.findByIdOrFail({
      id: userId,
      includeRoles: true,
      includeDepartments: false,
    });

    const assignedByUser = await this.helperService.findByIdOrFail({
      id: assignedBy,
      includeDepartments: false,
      includeRoles: false,
    });

    const roles = await this.roleHelperService.getManyByIdsOrFail(roleIds);

    const userRoles = roles.map((role) => {
      return this.userRoleRepository.create({
        user,
        role,
        assignedBy: assignedByUser,
      });
    });

    return this.userRoleRepository.save(userRoles);
  }

  /**
   * Unassigns multiple roles from a user.
   *
   * @param data - Data transfer object containing user ID and role IDs to unassign.
   * @returns A promise resolving to an object with the count of deleted assignments.
   */
  async unassignRolesFromUser(
    data: AssignRoleIdsDto,
  ): Promise<{ deleted: number }> {
    const { userId, roleIds } = data;

    await this.helperService.findByIdOrFail({
      id: userId,
      includeDepartments: false,
      includeRoles: false,
    });

    await this.roleHelperService.getManyByIdsOrFail(roleIds);

    const result = await this.userRoleRepository
      .createQueryBuilder()
      .delete()
      .from(UserRole)
      .where('role.id IN (:...roleIds)', { roleIds })
      .andWhere('user.id = :userId', { userId })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
