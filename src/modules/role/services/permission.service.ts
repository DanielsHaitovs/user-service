import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { PostgresQueryFailedError } from '@/base/interface/query.error';
import { QueryService } from '@/base/service/query.service';
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
  private readonly batchSize = 100;

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Permission)
    private readonly roleRepository: Repository<Role>,
    private readonly queryService: QueryService,
  ) {}

  /**
   * Creates a new permission in the database.
   * @param role - The permission data to create.
   * @returns The created permission entity.
   */
  async create({
    permissions,
    createdBy,
    hasUserPermission,
  }: {
    permissions: CreatePermissionDto[];
    createdBy: UUID;
    hasUserPermission: boolean;
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

    if (!hasUserPermission) {
      newPermissions.forEach((permission) => {
        permission.createdBy = {} as User;
      });
    }

    return newPermissions;
  }

  /**
   * Retrieves permissions by id from the database.
   * @returns the permission entities.
   */
  async findByIds({
    ids,
    hasRolePermission,
    hasUserPermission,
    pagination,
    select,
    sort,
  }: {
    ids: UUID[];
    hasRolePermission: boolean;
    hasUserPermission: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Permission[]> {
    if (ids.length === 0) {
      throw new BadRequestException('At least one ID must be provided');
    }

    const { page, limit } = pagination;

    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasRolePermission) {
      this.queryService.joinRelation<Permission>(query, ROLE_QUERY_ALIAS);
    }

    if (hasUserPermission) {
      this.queryService.joinRelation<Permission>(
        query,
        CREATEDBY_USER_QUERY_ALIAS,
      );
    }

    this.queryService.whereIn<Permission>(query, 'id', ids, 'AND');

    if (select !== undefined && select.length > 0) {
      query.select(select);
    }

    if (sort?.sortField !== undefined) {
      query.orderBy(sort.sortField, sort.sortOrder);
    }

    const permissions = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
    hasRolePermission,
    hasUserPermission,
    pagination,
    select,
    sort,
  }: {
    codes: string[];
    hasRolePermission: boolean;
    hasUserPermission: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Permission[]> {
    if (codes.length === 0) {
      throw new BadRequestException(
        'At least one permission code must be provided',
      );
    }

    const { page, limit } = pagination;

    const query = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (hasRolePermission) {
      this.queryService.joinRelation<Permission>(query, ROLE_QUERY_ALIAS);
    }

    if (hasUserPermission) {
      this.queryService.joinRelation<Permission>(
        query,
        CREATEDBY_USER_QUERY_ALIAS,
      );
    }

    this.queryService.whereIn<Permission>(query, 'code', codes, 'AND');

    if (select !== undefined && select.length > 0) {
      query.select(select);
    }

    if (sort?.sortField !== undefined) {
      query.orderBy(sort.sortField, sort.sortOrder);
    }

    const permissions = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    if (permissions.length === 0) {
      throw new EntityNotFoundError(
        'Permissions',
        `Permissions not found: ${codes.join(', ')}`,
      );
    }

    return permissions;
  }

  async searchFor({
    value,
    pagination,
    sort,
    select,
    hasRolePermission,
    hasUserPermission,
  }: {
    value: string;
    pagination: PaginationDto;
    sort: SortDto;
    select?: string[];
    hasRolePermission: boolean;
    hasUserPermission: boolean;
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

    if (hasRolePermission) {
      this.queryService.joinRelation<Permission>(query, ROLE_QUERY_ALIAS);
    }

    if (hasUserPermission) {
      this.queryService.joinRelation<Permission>(
        query,
        CREATEDBY_USER_QUERY_ALIAS,
      );
    }

    if (sort.sortField !== '') {
      query.orderBy(sort.sortField, sort.sortOrder);
    }

    if (select !== undefined && select.length > 0) {
      query.select(select);
    }

    const permissions = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
    if (permission.code !== undefined || permission.name !== undefined) {
      throw new BadRequestException(
        'Permission code or name cannot be updated',
      );
    }

    await this.findByIds({
      ids: [id],
      hasRolePermission: false,
      hasUserPermission: false,
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
        `Could not delete permissinos, because IDs [${missingIds.join(', ')}] not found`,
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
