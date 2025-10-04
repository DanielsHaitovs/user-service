import { QueryService } from '@/base/service/query.service';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import {
  ASSIGNED_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { Role } from '@/role/entities/role.entity';
import {
  AssignRoleIdsDto,
  CreateUserRoleDto,
  UnassignRoleIdsDto,
} from '@/user/dto/userRole.dto';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { batch } from '@/utils/batch.util';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError } from 'typeorm';

@Injectable()
export class UserRoleService extends QueryService {
  constructor(
    @InjectEntityManager()
    private readonly queryManager: EntityManager,
  ) {
    super(queryManager);
  }

  /**
   * Creates user roles in batches to optimize performance and handle large datasets.
   * Validates user and role existence before assignment.
   *
   * @param createUserRoleDto - DTO containing user ID, role IDs, and assigned by ID
   * @returns Promise resolving to an array of created UserRole entities
   * @throws EntityNotFoundError if user or roles are not found
   */
  async create(
    createUserRoleDto: CreateUserRoleDto,
    assignedById: UUID,
  ): Promise<UserRole[]> {
    const { userId, roleIds } = createUserRoleDto;

    if (assignedById === userId) {
      throw new BadRequestException(
        'assignedById cannot be the same as userId',
      );
    }

    const assignedByQuery = this.queryManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id = :assignedById`, {
        assignedById,
      })
      .getOneOrFail();

    const userQuery = this.queryManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id = :userId`, { userId })
      .getOneOrFail();

    const [user, assignedBy] = await Promise.all([userQuery, assignedByQuery]);

    const roles = await this.queryManager
      .createQueryBuilder(Role, 'role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .getMany();

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No roles found for the provided IDs: [${roleIds.join(', ')}]`,
      );
    }

    if (roles.length !== roleIds.length) {
      const missingRoleIds = roleIds.filter(
        (id) => !roles.some((role) => role.id === id),
      );
      throw new EntityNotFoundError(
        'User Role',
        `Roles with IDs [${missingRoleIds.join(', ')}] not found`,
      );
    }

    const rolesBatch = batch(roles, 50);

    const userRoles: UserRole[] = [];

    for (const roleBatch of rolesBatch) {
      const userRolesBatch = roleBatch.map((role) =>
        this.queryManager.create(UserRole, { user, role, assignedBy }),
      );

      userRoles.push(...(await this.queryManager.save(userRolesBatch)));
    }

    return userRoles;
  }

  /**
   * Finds user roles by various criteria including user IDs, role IDs, and assigned by IDs.
   * Supports partial matching and returns all matching UserRole entities.
   *
   * @param userIds - Optional array of user IDs to filter by
   * @param roleIds - Optional array of role IDs to filter by
   * @param assignedByIds - Optional array of assigned by IDs to filter by
   * @returns Promise resolving to an array of UserRole entities
   */
  async findByIds({
    userIds,
    roleIds,
    assignedByIds,
  }: {
    userIds?: UUID[];
    roleIds?: UUID[];
    assignedByIds?: UUID[];
  }): Promise<UserRole[]> {
    if (!userIds && !roleIds && !assignedByIds) {
      throw new BadRequestException(
        'At least one of userIds, roleIds, or assignedByIds search critireas must be provided',
      );
    }

    const query = this.queryManager
      .createQueryBuilder(UserRole, USER_ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${USER_QUERY_ALIAS}`,
        USER_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
        ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ASSIGNED_USER_QUERY_ALIAS}`,
        ASSIGNED_USER_QUERY_ALIAS,
      );

    if (userIds && userIds.length > 0) {
      query.andWhere(`${USER_ROLE_QUERY_ALIAS}.userId IN (:...userIds)`, {
        userIds,
      });
    }

    if (roleIds && roleIds.length > 0) {
      query.andWhere(`${USER_ROLE_QUERY_ALIAS}.roleId IN (:...roleIds)`, {
        roleIds,
      });
    }

    if (assignedByIds && assignedByIds.length > 0) {
      query.andWhere(
        `${USER_ROLE_QUERY_ALIAS}.assignedBy IN (:...assignedByIds)`,
        {
          assignedByIds,
        },
      );
    }

    const userRoles = await query.getMany();

    this.validateUserRoleExists({
      ...(userIds !== undefined && { userIds }),
      ...(roleIds !== undefined && { roleIds }),
      ...(assignedByIds !== undefined && { assignedByIds }),
      userRoles,
    });

    return userRoles;
  }

  /**
   * Finds a user role by the user's email address.
   * This is useful for scenarios where roles need to be retrieved based on user identity.
   *
   * @param email - The email address of the user
   * @returns Promise resolving to the UserRole entity associated with the user
   * @throws EntityNotFoundError if no UserRole is found for the given email
   */
  async findByUserEmail(email: string): Promise<UserRole[]> {
    const userRoles = await this.queryManager
      .createQueryBuilder(UserRole, USER_ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
        ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${USER_QUERY_ALIAS}`,
        USER_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ASSIGNED_USER_QUERY_ALIAS}`,
        ASSIGNED_USER_QUERY_ALIAS,
      )
      .where(`${USER_QUERY_ALIAS}.email = :email`, { email })
      .getMany();

    if (userRoles.length === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No UserRole records found for user with email: ${email}`,
      );
    }

    return userRoles;
  }

  /**
   * Assigns a role to a user by their unique identifiers.
   * Validates the existence of both user and role before assignment.
   *
   * @param userId - UUID of the user to assign the role to
   * @param roleIds - Array of UUIDs representing the roles to assign
   * @returns Promise resolving to the created UserRole entity
   * @throws EntityNotFoundError if user or role is not found
   */
  async assignRolesToUser(
    userId: UUID,
    data: AssignRoleIdsDto,
    assignedById: UUID,
  ): Promise<UserRole[]> {
    const { roleIds } = data;

    if (roleIds.length === 0) {
      throw new BadRequestException('roleIds array cannot be empty');
    }

    const user = await this.queryManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id = :userId`, { userId })
      .getOneOrFail();

    const assignedBy = await this.queryManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id = :assignedById`, { assignedById })
      .getOneOrFail();

    const roles = await this.queryManager
      .createQueryBuilder(Role, ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`, { roleIds })
      .getMany();

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No roles found for the provided IDs: [${roleIds.join(', ')}]`,
      );
    }

    if (roles.length !== roleIds.length) {
      const missingRoleIds = roleIds.filter(
        (id) => !roles.some((role) => role.id === id),
      );
      throw new EntityNotFoundError(
        'User Role',
        `Roles with IDs [${missingRoleIds.join(', ')}] not found`,
      );
    }

    const exidstingUserRoles = await this.queryManager
      .createQueryBuilder(UserRole, USER_ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
        ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${USER_QUERY_ALIAS}`,
        USER_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ASSIGNED_USER_QUERY_ALIAS}`,
        ASSIGNED_USER_QUERY_ALIAS,
      )
      .where(`${USER_ROLE_QUERY_ALIAS}.userId = :userId`, { userId })
      .andWhere(`${USER_ROLE_QUERY_ALIAS}.roleId IN (:...roleIds)`, {
        roleIds,
      })
      .getMany();

    const userRoles = new Array<UserRole>();

    for (const role of roles) {
      if (exidstingUserRoles.find((ur) => ur.roles.id === role.id)) {
        continue;
      }

      userRoles.push(
        this.queryManager.create(UserRole, {
          user,
          role,
          assignedBy,
        }),
      );
    }

    if (userRoles.length === 0) {
      return exidstingUserRoles;
    }

    const newUserRole = await this.queryManager.save(userRoles);

    return [...exidstingUserRoles, ...newUserRole];
  }

  /**
   * Unassigns a role from a user by their unique identifiers.
   * Validates the existence of the UserRole before deletion.
   *
   * @param userId - UUID of the user to unassign the role from
   * @param roleId - UUID of the role to unassign
   * @returns Promise resolving to an object indicating whether the unassignment was successful
   * @throws EntityNotFoundError if UserRole is not found for the given user and role IDs
   */
  async unassignRolesFromUsers(
    data: UnassignRoleIdsDto,
  ): Promise<{ unassigned: boolean }> {
    const { userIds, roleIds } = data;

    if (userIds.length === 0 || roleIds.length === 0) {
      return { unassigned: false };
    }

    await this.findByIds({ userIds, roleIds });

    const result = await this.queryManager
      .createQueryBuilder()
      .delete()
      .from(UserRole)
      .where(`${USER_QUERY_ALIAS}.id IN (:...userIds)`, { userIds })
      .andWhere(`${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`, { roleIds })
      .execute();

    if (result.affected === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No UserRole records found for userId(s): [${userIds.join(', ')}] and roleId(s): [${roleIds.join(', ')}]`,
      );
    }

    return { unassigned: true };
  }

  private validateUserRoleExists({
    userIds,
    roleIds,
    assignedByIds,
    userRoles,
  }: {
    userIds?: UUID[];
    roleIds?: UUID[];
    assignedByIds?: UUID[];
    userRoles: UserRole[];
  }): void {
    if (userRoles.length === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No UserRole records found for the provided criteria.`,
      );
    }

    const missingUserIds = userIds?.filter(
      (id) => !userRoles.some((ur) => ur.user.id === id),
    );

    const missingRoleIds = roleIds?.filter(
      (id) => !userRoles.some((ur) => ur.roles.id === id),
    );

    const missingAssignedByIds = assignedByIds?.filter(
      (id) => !userRoles.some((ur) => ur.assignedBy.id === id),
    );

    if (
      (missingUserIds && missingUserIds.length > 0) ||
      (missingRoleIds && missingRoleIds.length > 0) ||
      (missingAssignedByIds && missingAssignedByIds.length > 0)
    ) {
      let errorMessage = 'No UserRole records found for the following IDs:';

      if (missingUserIds && missingUserIds.length > 0) {
        errorMessage += ` userIds [${missingUserIds.join(', ')}];`;
      }
      if (missingRoleIds && missingRoleIds.length > 0) {
        errorMessage += ` roleIds [${missingRoleIds.join(', ')}];`;
      }
      if (missingAssignedByIds && missingAssignedByIds.length > 0) {
        errorMessage += ` assignedByIds [${missingAssignedByIds.join(', ')}];`;
      }

      throw new EntityNotFoundError('User Role', errorMessage);
    }
  }
}
