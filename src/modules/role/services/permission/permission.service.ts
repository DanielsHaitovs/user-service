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
import { Roles } from '@/role/entities/role.entity';
import { HelperService } from '@/role/helper/helper.service';
import { QueryService } from '@/role/services/permission/query.service';
import { User } from '@/user/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly queryService: QueryService,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Creates new permissions with associated roles.
   * Validates that all specified roles exist before creation.
   *
   * @param permissions - Array of permission data to create
   * @param createdBy - UUID of the user creating the permissions
   * @param hasAccessToCreatedBy - Whether the requesting user has permission to view user details
   * @returns Array of created permission entities
   * @throws NotFoundException if any specified role ID does not exist
   * @throws ConflictException if a permission name or code already exists
   */
  async create({
    permissions,
    createdBy,
    hasAccessToCreatedBy,
  }: {
    permissions: CreatePermissionDto[];
    createdBy: UUID;
    hasAccessToCreatedBy: boolean;
  }): Promise<Permission[]> {
    const rolesIds = Array.from(
      new Set(permissions.flatMap((permission) => permission.roleIds)),
    );

    if (rolesIds.length === 0) {
      throw new BadRequestException(
        'No roles provided for permissions, roles are required in order to create permissions',
      );
    }

    await this.helperService.getManyByIdsOrFail(rolesIds);

    const permissionsToSave = permissions.map((permission) => {
      return this.permissionRepository.create({
        code: permission.code,
        name: permission.name,
        roles: permission.roleIds.map((roleId) => ({ id: roleId }) as Roles),
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

    if (!hasAccessToCreatedBy) {
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
    hasAccessToCreatedBy,
    pagination,
    select,
    sort,
  }: {
    ids: UUID[];
    hasAccessToRole: boolean;
    hasAccessToCreatedBy: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Permission[]> {
    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasAccessToRole) {
      this.queryService.joinRelation<Permission>({
        query,
        alias: ROLE_QUERY_ALIAS,
      });
    }

    if (hasAccessToCreatedBy) {
      this.queryService.joinRelation<Permission>({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
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
      select,
      sort,
      criteria: this.queryService.permissionQueryCriteria({
        hasAccessToCreatedBy,
        includeCreatedBy: true,
        hasAccessToRole,
        includeRoles: true,
      }),
    });

    const { permissions } = await this.queryService.paginatedResult({
      query,
      alias: 'permissions',
      pagination,
    });

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
    hasAccessToCreatedBy,
    pagination,
    select,
    sort,
  }: {
    codes: string[];
    hasAccessToRole: boolean;
    hasAccessToCreatedBy: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Permission[]> {
    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasAccessToRole) {
      this.queryService.joinRelation<Permission>({
        query,
        alias: ROLE_QUERY_ALIAS,
      });
    }

    if (hasAccessToCreatedBy) {
      this.queryService.joinRelation<Permission>({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
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
      select,
      sort,
      criteria: this.queryService.permissionQueryCriteria({
        hasAccessToCreatedBy,
        includeCreatedBy: true,
        hasAccessToRole,
        includeRoles: true,
      }),
    });

    const { permissions } = await this.queryService.paginatedResult({
      query,
      alias: 'permissions',
      pagination,
    });

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
   * @param sort - Sorting parameters
   * @param select - Optional list of fields to select
   * @param hasAccessToRole - Whether to include role details in the results
   * @param hasAccessToCreatedBy - Whether to include createdBy user details in the results
   * @returns A paginated response containing matching permissions and metadata
   * @throws BadRequestException if pagination parameters are invalid
   */
  async searchFor({
    value,
    pagination,
    sort,
    select,
  }: {
    value: string;
    pagination: PaginationDto;
    sort: SortDto;
    select?: string[];
  }): Promise<PermissionListResponseDto> {
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
      select,
      sort,
      criteria: this.queryService.permissionQueryCriteria({
        hasAccessToCreatedBy: false,
        includeCreatedBy: false,
        hasAccessToRole: false,
        includeRoles: false,
      }),
    });

    return await this.queryService.paginatedResult({
      query,
      alias: 'permissions',
      pagination,
    });
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
  async update({
    id,
    updatePermissionDto,
  }: {
    id: UUID;
    updatePermissionDto: UpdatePermissionDto;
  }): Promise<Permission> {
    if (
      updatePermissionDto.code == undefined &&
      updatePermissionDto.name == undefined
    ) {
      throw new BadRequestException(
        'No value provided to update for permission',
      );
    }

    const permission = await this.helperService.getPermissionById(id);

    await this.helperService.findNameOrCodeConflictPermission({
      id,
      updatePermissionDto,
    });

    await this.permissionRepository
      .createQueryBuilder()
      .update(Permission)
      .set(permission)
      .where('id = :id', { id })
      .execute();

    if (updatePermissionDto.name != undefined) {
      permission.name = updatePermissionDto.name;
    }

    if (updatePermissionDto.code != undefined) {
      permission.code = updatePermissionDto.code;
    }

    return permission;
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

    const existingPermissions = await this.helperService.getPermissionsBy({
      ids,
    });

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
}
