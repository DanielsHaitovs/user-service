import { EntityQueryService } from '@/base/service/query.service';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { UpdatePermissionDto } from '@/role/dto/permission.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { UUID } from 'crypto';
import { Brackets, EntityNotFoundError } from 'typeorm';

@Injectable()
export class HelperService extends EntityQueryService {
  /**
   * Checks for role name conflicts when creating or updating a role.
   * Throws a ConflictException if a role with the same name already exists.
   *
   * @param id - Optional UUID of the role being updated (to exclude from conflict check)
   * @param name - Name of the role to check for conflicts
   * @returns Promise resolving to void
   * @throws ConflictException when a role with the same name already exists
   */
  async findNameConflicts({
    id,
    name,
  }: {
    id?: UUID;
    name: string;
  }): Promise<void> {
    const query = this.entityManager
      .createQueryBuilder(Roles, ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name = :name`, { name });

    if (id !== undefined) {
      query.andWhere(`${ROLE_QUERY_ALIAS}.id != :id`, { id });
    }

    const role = await query.getOne();

    if (role != undefined) {
      throw new ConflictException(
        `Roles with name "${name}" already exists. Please choose a different name.`,
      );
    }
  }

  /**
   * Retrieves a role by its ID.
   *
   * @param id - UUID of the role to retrieve
   * @returns Promise resolving to the Roles entity
   */
  async getByIdOrFail(id: UUID): Promise<Roles> {
    return await this.entityManager
      .createQueryBuilder(Roles, ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id = :id`, { id })
      .getOneOrFail();
  }

  /**
   * Validates the existence of roles by their IDs.
   * Throws an EntityNotFoundError if any role ID does not exist.
   *
   * @param roleIds - Array of role UUIDs to validate
   * @returns Promise resolving to void
   * @throws EntityNotFoundError when any specified role ID doesn't exist
   */
  async getManyByIdsOrFail(ids?: UUID[]): Promise<Roles[]> {
    if (ids == undefined || ids.length === 0) {
      throw new BadRequestException('No role IDs provided');
    }

    const query = this.initQuery({
      entity: Roles,
      alias: ROLE_QUERY_ALIAS,
    });

    this.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
      relationAlias: ROLE_QUERY_ALIAS,
    });

    const roles = await query.getMany();

    if (roles.length !== ids.length) {
      const existingIds = roles.map((role) => role.id);
      const missingIds = ids.filter((roleId) => !existingIds.includes(roleId));

      throw new EntityNotFoundError(
        'Roles',
        `Roles with IDs [${missingIds.join(', ')}] not found.`,
      );
    }

    return roles;
  }

  /**
   * Retrieves a permission by its ID.
   *
   * @param ids - UUID of the permission to retrieve
   * @returns Promise resolving to the Permission entity
   * @throws EntityNotFoundError when the permission ID doesn't exist
   */
  async getPermissionById(id: UUID): Promise<Permission> {
    return await this.entityManager
      .createQueryBuilder(Permission, PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.id = :id`, { id })
      .getOneOrFail();
  }

  /**
   * Validates the existence of permissions by their IDs or codes.
   * Throws an EntityNotFoundError if any permission ID or code does not exist.
   *
   * @param ids - Array of permission UUIDs to validate
   * @param codes - Array of permission codes to validate
   * @returns Promise resolving to an array of Permission entities
   * @throws EntityNotFoundError when any specified permission ID or code doesn't exist
   */
  async getPermissionsBy({
    ids,
    codes,
  }: {
    ids?: UUID[] | undefined;
    codes?: string[] | undefined;
  }): Promise<Permission[]> {
    if (ids === undefined && codes === undefined) {
      throw new BadRequestException('No permission ids or codes provided');
    }

    const query = this.entityManager.createQueryBuilder(
      Permission,
      PERMISSION_QUERY_ALIAS,
    );

    if (ids !== undefined && ids.length > 0) {
      query.where(`${PERMISSION_QUERY_ALIAS}.id IN (:...ids)`, { ids });
    }

    if (codes !== undefined && codes.length > 0) {
      query.orWhere(`${PERMISSION_QUERY_ALIAS}.code IN (:...codes)`, { codes });
    }

    const permissions = await query.getMany();

    if (permissions.length === 0) {
      throw new EntityNotFoundError(
        'Permission',
        this.constructPermissionErrorMessage(ids, codes),
      );
    }

    const missingIds = ids
      ? ids.filter(
          (permissionId) =>
            !permissions
              .map((permission) => permission.id)
              .includes(permissionId),
        )
      : [];

    const missingCodes = codes
      ? codes.filter(
          (permissionCode) =>
            !permissions
              .map((permission) => permission.code)
              .includes(permissionCode),
        )
      : [];

    if (missingIds.length > 0 || missingCodes.length > 0) {
      throw new EntityNotFoundError(
        'Permission',
        this.constructPermissionErrorMessage(missingIds, missingCodes),
      );
    }

    return permissions;
  }

  /**
   * Validates that no other permission exists with the same name or code.
   *
   * @param id - UUID of the permission being updated
   * @param permission - UpdatePermissionDto containing the new name and/or code
   * @returns Promise resolving to void
   * @throws ConflictException when a permission with the same name or code already exists
   */
  async findNameOrCodeConflictPermission({
    id,
    updatePermissionDto,
  }: {
    id: UUID;
    updatePermissionDto: UpdatePermissionDto;
  }): Promise<void> {
    const conflictQuery = this.entityManager
      .createQueryBuilder(Permission, PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.id != :id`, { id });

    conflictQuery.andWhere(
      new Brackets((qb) => {
        if (updatePermissionDto.name !== undefined) {
          qb.where(`${PERMISSION_QUERY_ALIAS}.name = :name`, {
            name: updatePermissionDto.name,
          });
        }
        if (updatePermissionDto.code !== undefined) {
          qb.orWhere(`${PERMISSION_QUERY_ALIAS}.code = :code`, {
            code: updatePermissionDto.code,
          });
        }
      }),
    );

    const conflictedRecords = await conflictQuery.getMany();

    if (conflictedRecords.length > 0) {
      throw new ConflictException('Permission name or code already exists');
    }
  }

  private constructPermissionErrorMessage(
    missingIds?: UUID[],
    missingCodes?: string[],
  ): string {
    const errorMessages = [];

    if (missingIds != undefined && missingIds.length > 0) {
      errorMessages.push(`IDs [${missingIds.join(', ')}]`);
    }

    if (missingCodes != undefined && missingCodes.length > 0) {
      errorMessages.push(`codes [${missingCodes.join(', ')}]`);
    }

    return `Permissions with ${errorMessages.join(' or ')} not found.`;
  }
}
