import { RoleHelperService } from '@/roleHelper/helper.service';
import { USER_ROLE_QUERY_ALIAS } from '@/userConst/user.const';
import {
  AssignRolesDto,
  UnAssignRolesDto,
  UserRoleListResponseDto,
} from '@/userDto/roles.dto';
import { UnassignFromUserResponseDto } from '@/userDto/user.dto';
import { UserRole } from '@/userEntities/userRoles.entity';
import { UserHelperService } from '@/userHelper/helper.service';
import { GetUserRolesByIdsRequestDto } from '@/userQueryDto/role.dto';
import { QueryService } from '@/userService/query.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly queryService: QueryService,
    private readonly userService: UserHelperService,
    private readonly roleService: RoleHelperService,
  ) {}

  async getUserRole(
    filters: GetUserRolesByIdsRequestDto,
  ): Promise<UserRoleListResponseDto> {
    const query = this.queryService.initQuery<UserRole>({
      entity: UserRole,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    const { page, limit, ids, roleIds, userId } = filters;

    if (userId != undefined) {
      this.queryService.joinEntityRelation<UserRole>({
        query,
        relationAlias: 'user',
        shouldJoin: true,
        condition: 'AND',
        options: {
          filters: {
            id: [userId],
          },
        },
      });
    }

    this.queryService.joinEntityRelation<UserRole>({
      query,
      relationAlias: 'role',
      shouldJoin: true,
      condition: 'AND',
      options: {
        filters: {
          id: roleIds,
        },
      },
    });

    this.queryService.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination: { limit, page },
      sort: {
        sortField: `${USER_ROLE_QUERY_ALIAS}.createdAt`,
        sortOrder: 'DESC',
      },
      select: [],
      criteria: this.queryService.userQueryCriteria({
        includeRoles: true,
        hasAccessToRoles: true,
        hasAccessToDepartments: false,
        includeDepartments: false,
        includeCreatedBy: false,
        includePermissions: false,
        hasAccessToCreatedBy: false,
        hasAccessToPermissions: false,
      }),
    });

    const response = await this.queryService.paginatedResult({
      query,
      alias: 'userRoles',
    });

    if (response.userRoles.length === 0) {
      throw new EntityNotFoundError(
        'Users Roles',
        'Provided criteria resulted in no entities found',
      );
    }

    return response;
  }

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
        users: user,
        roles: role,
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
  ): Promise<UnassignFromUserResponseDto> {
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
      unassigned: result.affected ?? 0,
      status: 'Roles unassigned successfully',
    };
  }
}
