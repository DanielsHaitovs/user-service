import { EntityQueryService } from '@/base/service/query.service';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import {
  AssignRolesToUserDto,
  GetUserRoleDto,
  UnassignRolesFromUserDto,
} from '@/userDto/roles.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError, In } from 'typeorm';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly userHelperService: UserHelperService,
    private readonly roleHelperService: RoleHelperService,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves the roles assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetUserRoleDto objects representing the user's roles.
   * @throws An EntityNotFoundError if the user does not exist.
   */
  async getRolesOrThrow(userId: UUID): Promise<GetUserRoleDto[]> {
    return await this.entityManager
      .findBy(UserRoles, {
        user: { id: userId },
      })
      .then((userRoles) => {
        if (userRoles.length === 0) {
          throw new EntityNotFoundError(
            UserRoles,
            `No roles found for user with ID ${userId}`,
          );
        }

        return userRoles;
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
    const userRoles = await this.getRolesOrThrow(userId);
    const roleIds = userRoles.map((userRole) => userRole.role?.id);

    if (roleIds.length === 0) {
      return [];
    }

    const query = this.entityManager
      .createQueryBuilder(Roles, 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.id IN (:...roleIds)', { roleIds })
      .select(['role.id', 'permission.code']);

    const roles = await this.queryService.getAll<Roles>({
      query,
      cache: true,
    });

    const permissionCodes = new Set<string>();

    roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissionCodes.add(permission.code);
      });
    });

    return Array.from(permissionCodes);
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
    await this.roleHelperService.validateRolesExist(roleIds);

    const userRoles = roleIds.map((roleId) => ({
      user: { id: userId },
      role: { id: roleId },
      assignedBy: { id: assignedById },
    }));

    await this.entityManager.save(UserRoles, userRoles);
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
    await this.roleHelperService.validateRolesExist(roleIds);

    await this.entityManager.delete(UserRoles, {
      user: { id: userId },
      role: { id: In(roleIds) },
    });
  }
}
