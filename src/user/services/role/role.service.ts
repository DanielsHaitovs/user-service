import { EntityQueryService } from '@/baseServices/query.service';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { RoleHelperService } from '@/roleServices/helper.service';
import {
  AssignRolesToUserDto,
  UnassignRolesFromUserDto,
  UserRolesListResponseDto,
  UserRolesQueryRequest,
} from '@/userDto/roles.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRoles)
    private readonly roleRepository: Repository<UserRoles>,
    private readonly roleHelperService: RoleHelperService,
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
      names,
      page,
      limit,
      sortField,
      sortOrder,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = data;

    const query = this.queryService.initQuery<UserRoles>({
      entity: UserRoles,
      alias: USER_ROLE_QUERY_ALIAS,
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
        field: dateFilterParam,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<UserRoles>({
        query,
        field: dateFilterParam,
        condition: 'AND',
        date: dateTo,
      });
    }

    if (names != undefined && names.length > 0) {
      this.queryService.whereIn<UserRoles>({
        query,
        field: 'role.name',
        condition: 'AND',
        values: names,
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
      `${USER_ROLE_QUERY_ALIAS}.id`,
      `${USER_ROLE_QUERY_ALIAS}.createdAt`,
      `${USER_ROLE_QUERY_ALIAS}.updatedAt`,
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
      cache: true,
    });
  }

  /**
   * Retrieves the permissions associated with the roles assigned to a user.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of strings representing the permission codes associated with the user's roles.
   * @throws An EntityNotFoundError if the user does not exist or if no roles are found for the user.
   */
  async getPermissions(userId: UUID): Promise<string[]> {
    const userRoles = await this.getAssignedRoles(userId);

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
    userId,
    assignedRoles,
    data,
    assignedById,
  }: {
    userId: UUID;
    assignedRoles: GetRelatedRoleDto[];
    data: AssignRolesToUserDto;
    assignedById: UUID;
  }): Promise<void> {
    await this.validatePayload({ roleIds: data.roleIds });

    const missingRoleIds = data.roleIds.filter(
      (roleId) =>
        !assignedRoles.some((assignedRole) => assignedRole.id === roleId),
    );

    if (missingRoleIds.length === 0) {
      return;
    }

    const userRoles = missingRoleIds.map((roleId) => ({
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
    assignedRoles,
    data,
  }: {
    userId: UUID;
    assignedRoles: GetRelatedRoleDto[];
    data: UnassignRolesFromUserDto;
  }): Promise<void> {
    await this.validatePayload({ roleIds: data.roleIds });

    if (assignedRoles.length === 0) {
      return;
    }

    const rolesToUnassign = assignedRoles.filter((assignedRole) =>
      data.roleIds.includes(assignedRole.id),
    );

    if (rolesToUnassign.length === 0) {
      return;
    }

    await this.roleRepository.delete({
      user: { id: userId },
      role: { id: In(rolesToUnassign.flatMap((role) => role.id)) },
    });
  }

  /**
   * Retrieves the roles assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetRelatedRoleDto objects representing the user's roles.
   */
  async getAssignedRoles(userId: UUID): Promise<GetRelatedRoleDto[]> {
    const query = this.roleRepository
      .createQueryBuilder(USER_ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.role`, 'role')
      .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.user`, 'user')
      .where('user.id = :userId', { userId })
      .select([
        `${USER_ROLE_QUERY_ALIAS}.id`,
        'role.id',
        'role.name',
        'role.createdAt',
        'role.updatedAt',
      ]);

    const userRoles = await this.queryService.getAll<UserRoles>({
      query,
    });

    return userRoles.map((userRole) => userRole.role);
  }

  /**
   * Validates the existence of a user and the specified roles.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @param roleIds - An array of unique identifiers (UUIDs) representing the roles to be validated.
   * @returns A promise that resolves when the validation is successful.
   * @throws An UnprocessableEntityException if the user does not exist or if any of the specified roles do not exist.
   */
  private async validatePayload({
    roleIds,
  }: {
    roleIds?: UUID[] | undefined;
  }): Promise<void> {
    await this.roleHelperService.checkIfManyExistOrThrow(roleIds);
  }
}
