import { EntityQueryService } from '@/base/service/query.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import {
  AssignRolesToUserDto,
  UnassignRolesFromUserDto,
  UserRolesListResponseDto,
  UserRolesQueryRequest,
} from '@/userDto/roles.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserRoleHelperService } from '@/userRoleServices/helper.service';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRoles)
    private readonly roleRepository: Repository<UserRoles>,
    private readonly userHelperService: UserHelperService,
    private readonly roleHelperService: RoleHelperService,
    private readonly userRoleHelperService: UserRoleHelperService,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves the roles assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetUserRoleDto objects representing the user's roles.
   */
  async getRoles(
    data: UserRolesQueryRequest,
  ): Promise<UserRolesListResponseDto> {
    const {
      userId,
      page,
      limit,
      sortField,
      sortOrder,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = data;
    await this.userHelperService.validateIfExists({ id: userId });

    const query = this.queryService.initQuery<UserRoles>({
      entity: UserRoles,
      alias: 'userRole',
    });

    this.queryService.joinRelation<UserRoles>({
      query,
      alias: 'user',
    });

    this.queryService.joinRelation<UserRoles>({
      query,
      alias: 'role',
    });

    this.queryService.where<UserRoles>({
      query,
      field: 'user.id',
      condition: 'AND',
      value: userId,
    });

    if (dateFilterParam != undefined) {
      this.queryService.dateGreaterThan<UserRoles>({
        query,
        field: `userRole.${dateFilterParam}`,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<UserRoles>({
        query,
        field: `userRole.${dateFilterParam}`,
        condition: 'AND',
        date: dateTo,
      });
    }

    this.queryService.sort<UserRoles>({
      query,
      sort: {
        sortField,
        sortOrder,
      },
    });

    query.select([
      'userRole.id',
      'userRole.createdAt',
      'userRole.updatedAt',
      'role.id',
      'role.name',
      'role.createdAt',
    ]);

    this.queryService.paginate<UserRoles>({
      query,
      pagination: {
        page,
        limit,
      },
    });

    return await this.queryService.paginatedResult({
      query,
    });
  }

  /**
   * Retrieves the permissions associated with the roles assigned to a user.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of strings representing the permission codes associated with the user's roles.
   * @throws An EntityNotFoundError if the user does not exist or if no roles are found for the user.
   */
  async getPermissionsOrThrow(userId: UUID): Promise<string[]> {
    const userRoles = await this.userRoleHelperService.getAssignedRoles(userId);

    if (userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map((userRole) => userRole.id);

    return await this.roleHelperService.getAllPermissions(roleIds);
  }

  /**
   * Assigns roles to a user.
   *
   * @param userId - The unique identifier of the user to whom roles will be assigned (UUID).
   * @param roleIds - An array of unique identifiers (UUIDs) representing the roles to be assigned to the user.
   * @param assignedById - The unique identifier of the user who is assigning the roles (UUID).
   * @returns A promise that resolves when the roles have been successfully assigned to the user.
   * @throws An EntityNotFoundError if the user or the assigning user does not exist.
   */
  async assignRolesToUser({
    data,
    assignedById,
  }: {
    data: AssignRolesToUserDto;
    assignedById: UUID;
  }): Promise<void> {
    const { userId, roleIds } = data;
    await this.userHelperService.validateIfExists({ id: userId });
    await this.userHelperService.validateIfExists({ id: assignedById });
    await this.roleHelperService.validateIfExist(roleIds);

    const userRoles = roleIds.map((roleId) => ({
      user: { id: userId },
      role: { id: roleId },
      assignedBy: { id: assignedById },
    }));

    await this.roleRepository.save(userRoles);
  }

  /**
   * Removes roles from a user.
   *
   * @param userId - The unique identifier of the user from whom roles will be removed (UUID).
   * @param roleIds - An array of unique identifiers (UUIDs) representing the roles to be removed from the user.
   * @returns A promise that resolves when the roles have been successfully removed from the user.
   * @throws An EntityNotFoundError if the user does not exist.
   */
  async unassignRolesFromUser({
    userId,
    roleIds,
  }: UnassignRolesFromUserDto): Promise<void> {
    await this.userHelperService.validateIfExists({ id: userId });
    await this.roleHelperService.validateIfExist(roleIds);

    await this.roleRepository.delete({
      user: { id: userId },
      role: { id: In(roleIds) },
    });
  }
}
