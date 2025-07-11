import { QueryService } from '@/base/service/query.service';
import { Role } from '@/role/entities/role.entity';
import { CreateUserRoleDto } from '@/user/dto/userRole.dto';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { batch } from '@/utils/batch.util';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError } from 'typeorm';

@Injectable()
export class UserRoleService extends QueryService {
  constructor(
    @InjectEntityManager()
    private readonly roleManager: EntityManager,
  ) {
    super(roleManager);
  }

  /**
   * Creates user roles in batches to optimize performance and handle large datasets.
   * Validates user and role existence before assignment.
   *
   * @param createUserRoleDto - DTO containing user ID, role IDs, and assigned by ID
   * @returns Promise resolving to an array of created UserRole entities
   * @throws EntityNotFoundError if user or roles are not found
   */
  async create(createUserRoleDto: CreateUserRoleDto): Promise<UserRole[]> {
    const { userId, roleIds, assignedById } = createUserRoleDto;

    const userQuery = this.roleManager
      .createQueryBuilder(User, 'user')
      .where('user.id = :userId', { userId })
      .getOneOrFail();

    const assignedByQuery = this.roleManager
      .createQueryBuilder(User, 'user')
      .where('user.id = :assignedById', { assignedById })
      .getOneOrFail();

    const [user, assignedBy] = await Promise.all([userQuery, assignedByQuery]);

    const roles = await this.roleManager
      .createQueryBuilder(Role, 'role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .getMany();

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'User Role',
        'No roles found for the provided IDs',
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
        this.roleManager.create(UserRole, { user, role, assignedBy }),
      );

      userRoles.push(...(await this.roleManager.save(userRolesBatch)));
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
    const query = this.roleManager.createQueryBuilder(UserRole, 'userRole');

    if (userIds && userIds.length > 0) {
      query.leftJoinAndSelect('userRole.user', 'user');
      query.andWhere('userRole.userId IN (:...userIds)', { userIds });
    }

    if (roleIds && roleIds.length > 0) {
      query.leftJoinAndSelect('userRole.role', 'role');
      query.andWhere('userRole.roleId IN (:...roleIds)', { roleIds });
    }

    if (assignedByIds && assignedByIds.length > 0) {
      if (!this.isLeftJoinPresent(query, 'user')) {
        query.leftJoinAndSelect('userRole.user', 'user');
      }
      query.andWhere('userRole.assignedById IN (:...assignedByIds)', {
        assignedByIds,
      });
    }

    return await query.getMany();
  }

  /**
   * Finds a user role by the user's email address.
   * This is useful for scenarios where roles need to be retrieved based on user identity.
   *
   * @param email - The email address of the user
   * @returns Promise resolving to the UserRole entity associated with the user
   * @throws EntityNotFoundError if no UserRole is found for the given email
   */
  async findByUserEmail(email: string): Promise<UserRole> {
    return await this.roleManager
      .createQueryBuilder(UserRole, 'userRole')
      .leftJoinAndSelect('userRole.user', 'user')
      .where('user.email = :email', { email })
      .orWhere('userRole.assignedBy = :email', { email })
      .getOneOrFail();
  }

  /**
   * Assigns a role to a user by their unique identifiers.
   * Validates the existence of both user and role before assignment.
   *
   * @param userId - UUID of the user to assign the role to
   * @param roleId - UUID of the role to assign
   * @returns Promise resolving to the created UserRole entity
   * @throws EntityNotFoundError if user or role is not found
   */
  async assignRoleToUser(userId: UUID, roleId: UUID): Promise<UserRole> {
    const user = await this.roleManager
      .createQueryBuilder(User, 'user')
      .where('user.id = :userId', { userId })
      .getOneOrFail();

    const role = await this.roleManager
      .createQueryBuilder(Role, 'role')
      .where('role.id = :roleId', { roleId })
      .getOneOrFail();

    const userRole = this.roleManager.create(UserRole, {
      user,
      role,
      assignedBy: user,
    });

    return await this.roleManager.save(userRole);
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
  async unassignRoleFromUser(
    userIds: UUID[],
    roleIds: UUID[],
  ): Promise<{ unassigned: boolean }> {
    if (userIds.length === 0 || roleIds.length === 0) {
      return { unassigned: false };
    }

    const result = await this.roleManager
      .createQueryBuilder()
      .delete()
      .from(UserRole)
      .where('userId IN (:...userIds)', { userIds })
      .andWhere('roleId IN (:...roleIds)', { roleIds })
      .execute();

    if (result.affected === 0) {
      throw new EntityNotFoundError(
        'User Role',
        `No UserRole records found for userId(s): [${userIds.join(', ')}] and roleId(s): [${roleIds.join(', ')}]`,
      );
    }

    return { unassigned: true };
  }
}
