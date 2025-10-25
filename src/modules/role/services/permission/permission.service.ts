import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { PostgresQueryFailedError } from '@/base/interface/query.error';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { PermissionQueryService } from '@/role/services/permission/query.service';
import { User } from '@/user/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Brackets, EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly queryService: PermissionQueryService,
  ) {}

  /**
   * Creates new permissions with associated roles.
   * Validates that all specified roles exist before creation.
   *
   * @param permissions - Array of permission data to create
   * @param createdBy - UUID of the user creating the permissions
   * @param hasAccessToUser - Whether the requesting user has permission to view user details
   * @returns Array of created permission entities
   * @throws NotFoundException if any specified role ID does not exist
   * @throws ConflictException if a permission name or code already exists
   */
  async create({
    permissions,
    createdBy,
    hasAccessToUser,
  }: {
    permissions: CreatePermissionDto[];
    createdBy: UUID;
    hasAccessToUser: boolean;
  }): Promise<Permission[]> {
    const rolesIds = Array.from(
      new Set(permissions.flatMap((permission) => permission.roleIds)),
    );

    if (rolesIds.length === 0) {
      throw new BadRequestException(
        'No roles provivided for permissions, roles are required in order to create permissions',
      );
    }

    await this.validateRolesExist(rolesIds);

    const permissionsToSave = permissions.map((permission) => {
      return this.permissionRepository.create({
        code: permission.code,
        name: permission.name,
        roles: permission.roleIds.map((roleId) => ({ id: roleId }) as Role),
        createdBy: { id: createdBy } as User,
      });
    });

    const newPermissions = await this.permissionRepository
      .save(permissionsToSave)
      .catch((e: unknown) => {
        const error = e as PostgresQueryFailedError;
        if (error.code === '23505') {
          throw new ConflictException('Permission name or code already exists');
        }

        throw e;
      });

    if (!hasAccessToUser) {
      newPermissions.forEach((permission) => {
        permission.createdBy = {} as User;
      });
    }

    return newPermissions;
  }

  /**
   * Retrieves permissions by their IDs.
   * @param ids - The permission IDs to search for.
   * @returns The permission entities matching the provided IDs.
   * @throws NotFoundException if no permissions are found with the given IDs.
   */
  async findByIds({
    ids,
    hasAccessToRole,
    hasAccessToUser,
    pagination,
    select,
    order,
  }: {
    ids: UUID[];
    hasAccessToRole: boolean;
    hasAccessToUser: boolean;
    pagination: PaginationDto;
    select?: string[];
    order?: SortDto;
  }): Promise<Permission[]> {
    if (ids.length === 0) {
      throw new BadRequestException(
        'At least one permission ID must be provided',
      );
    }

    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasAccessToRole) {
      this.queryService.joinRelation<Permission>({
        query,
        relationAlias: ROLE_QUERY_ALIAS,
      });
    }

    if (hasAccessToUser) {
      this.queryService.joinRelation<Permission>({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.whereIn<Permission>({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser,
      hasAccessToRole,
      includeCreatedBy: true,
      includeRole: true,
      select,
      order,
    });

    const permissions = await query.getMany();

    if (permissions.length === 0) {
      throw new EntityNotFoundError(
        'Permissions',
        `Permissions not found: ${ids.join(', ')}`,
      );
    }

    return permissions;
  }

  /**
   * Retrieves permissions by their codes.
   * @param codes - The permission codes to search for.
   * @returns The permission entities matching the provided codes.
   * @throws NotFoundException if no permissions are found with the given codes.
   */
  async findByCodes({
    codes,
    hasAccessToRole,
    hasAccessToUser,
    pagination,
    select,
    order,
  }: {
    codes: string[];
    hasAccessToRole: boolean;
    hasAccessToUser: boolean;
    pagination: PaginationDto;
    select?: string[];
    order?: SortDto;
  }): Promise<Permission[]> {
    if (codes.length === 0) {
      throw new BadRequestException(
        'At least one permission code must be provided',
      );
    }

    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasAccessToRole) {
      this.queryService.joinRelation<Permission>({
        query,
        relationAlias: ROLE_QUERY_ALIAS,
      });
    }

    if (hasAccessToUser) {
      this.queryService.joinRelation<Permission>({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.whereIn<Permission>({
      query,
      field: 'code',
      values: codes,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser,
      hasAccessToRole,
      includeCreatedBy: true,
      includeRole: true,
      select,
      order,
    });

    const permissions = await query.getMany();

    if (permissions.length === 0) {
      throw new EntityNotFoundError(
        'Permissions',
        `Permissions not found: ${codes.join(', ')}`,
      );
    }

    return permissions;
  }

  /**
   * Searches for permissions matching a given value in their name, code, or ID.
   * Supports pagination, sorting, and conditional inclusion of related entities.
   *
   * @param value - The search term to match against permission name, code, or ID
   * @param pagination - Pagination parameters (page number and limit)
   * @param order - Sorting parameters
   * @param select - Optional list of fields to select
   * @param hasAccessToRole - Whether to include role details in the results
   * @param hasAccessToUser - Whether to include createdBy user details in the results
   * @returns A paginated response containing matching permissions and metadata
   * @throws BadRequestException if pagination parameters are invalid
   */
  async searchFor({
    value,
    pagination,
    order,
    select,
  }: {
    value: string;
    pagination: PaginationDto;
    order: SortDto;
    select?: string[];
  }): Promise<PermissionListResponseDto> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }

    const { page, limit } = pagination;

    const query = this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.name ILIKE :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${PERMISSION_QUERY_ALIAS}.code ILIKE :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${PERMISSION_QUERY_ALIAS}.id::text ILIKE :value`, {
        value: `%${value}%`,
      });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser: false,
      hasAccessToRole: false,
      includeCreatedBy: false,
      includeRole: false,
      select,
      order,
    });

    const permissions = await query.getManyAndCount();

    const totalCount = permissions[1];

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      permissions: permissions[0],
    };
  }

  /**
   * Updates a permission by its ID.
   * Validates that the permission exists and checks for conflicts with existing names or codes.
   *
   * @param id - The UUID of the permission to update
   * @param permission - The updated permission data
   * @returns The updated permission entity
   * @throws NotFoundException if the permission with the given ID does not exist
   * @throws ConflictException if the new name or code conflicts with existing permissions
   */
  async update(id: UUID, permission: UpdatePermissionDto): Promise<Permission> {
    if (permission.code == undefined && permission.name == undefined) {
      throw new BadRequestException(
        'Permission code or name cannot be updated',
      );
    }

    await this.findByIds({
      ids: [id],
      hasAccessToRole: false,
      hasAccessToUser: false,
      pagination: { page: 1, limit: 1 },
    });

    const conflictQuery = this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.id != :id`, { id });

    conflictQuery.andWhere(
      new Brackets((qb) => {
        if (permission.name !== undefined) {
          qb.where(`${PERMISSION_QUERY_ALIAS}.name = :name`, {
            name: permission.name,
          });
        }
        if (permission.code !== undefined) {
          qb.orWhere(`${PERMISSION_QUERY_ALIAS}.code = :code`, {
            code: permission.code,
          });
        }
      }),
    );

    const conflictedRecords = await conflictQuery.getMany();

    if (conflictedRecords.length > 0) {
      throw new ConflictException('Permission name or code already exists');
    }

    await this.permissionRepository
      .createQueryBuilder()
      .update(Permission)
      .set(permission)
      .where('id = :id', { id })
      .execute();

    return this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.id = :id`, { id })
      .getOneOrFail();
  }

  /**
   * Deletes permissions by their IDs.
   * Validates existence of all specified permissions before deletion.
   * Throws NotFoundException if any permission ID does not exist.
   *
   * @param ids - Array of permission UUIDs to delete
   * @returns Promise resolving to void
   * @throws NotFoundException when any specified permission ID doesn't exist
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    const existingPermissions = await this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.id IN (:...ids)`, { ids })
      .getMany();

    if (existingPermissions.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingPermissions.find((perm) => perm.id === id),
      );
      throw new EntityNotFoundError(
        'Permissions',
        `Could not delete permissions, because IDs [${missingIds.join(', ')}] not found`,
      );
    }

    existingPermissions.forEach((permission) => {
      permission.roles = [];
    });

    await this.permissionRepository.save(existingPermissions);

    const result = await this.permissionRepository
      .createQueryBuilder()
      .delete()
      .from(Permission)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }

  /**
   * Validates the existence of roles by their IDs.
   * Throws an EntityNotFoundError if any role ID does not exist.
   *
   * @param roleIds - Array of role UUIDs to validate
   * @returns Promise resolving to void
   * @throws EntityNotFoundError when any specified role ID doesn't exist
   */
  private async validateRolesExist(roleIds: UUID[]): Promise<void> {
    const existingRoles = await this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`, { roleIds })
      .getMany();

    if (existingRoles.length !== roleIds.length) {
      const existingRoleIds = existingRoles.map((role) => role.id);
      const missingRoleIds = roleIds.filter(
        (roleId) => !existingRoleIds.includes(roleId),
      );
      throw new EntityNotFoundError(
        'Roles',
        `Roles with IDs [${missingRoleIds.join(', ')}] not found. Cannot create permissions with non-existing roles.`,
      );
    }
  }
}
