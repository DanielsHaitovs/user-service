import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { PERMISSION_QUERY_ALIAS } from '@/lib/const/role.const';
import {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

import { Role } from '../entities/role.entity';

@Injectable()
export class PermissionService {
  private readonly batchSize = 100;

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Creates a new permission in the database.
   * @param role - The permission data to create.
   * @returns The created permission entity.
   */
  async create(permissions: CreatePermissionDto[]): Promise<Permission[]> {
    const conflictNameOrCode = await this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.name IN (:...names)`, {
        names: permissions.flatMap((p) => p.name),
      })
      .orWhere(`${PERMISSION_QUERY_ALIAS}.code in (:...codes)`, {
        codes: permissions.flatMap((p) => p.code),
      })
      .getMany();

    if (conflictNameOrCode.length > 0) {
      throw new ConflictException(
        `One or many names or codes alraedy exists ${conflictNameOrCode.map((p) => p.name).join(', ')}`,
      );
    }

    const permissionsToSave = permissions.map((permission) => {
      return this.permissionRepository.create({
        code: permission.code,
        name: permission.name,
        roles: permission.roleIds.map((roleId) => ({ id: roleId }) as Role),
      });
    });

    return this.permissionRepository.save(permissionsToSave);
  }

  /**
   * Retrieves permissions by id from the database.
   * @returns the permission entities.
   */
  async findByIds(ids: UUID[]): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .leftJoinAndSelect(`${PERMISSION_QUERY_ALIAS}.roles`, 'roles')
      .where(`${PERMISSION_QUERY_ALIAS}.id IN (:...ids)`, { ids })
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
  async findByCodes(codes: string[]): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder(PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.code IN (:...codes)`, { codes })
      .leftJoinAndSelect(`${PERMISSION_QUERY_ALIAS}.roles`, 'roles')
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
  }: {
    value: string;
    pagination: PaginationDto;
    sort: SortDto;
  }): Promise<PermissionListResponseDto> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new ConflictException(
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

    if (sort.sortField) {
      query.orderBy(
        `${PERMISSION_QUERY_ALIAS}.${sort.sortField}`,
        sort.sortOrder,
      );
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
    await this.findByIds([id]);

    const conflictNameOrCode = this.permissionRepository.createQueryBuilder(
      PERMISSION_QUERY_ALIAS,
    );

    if (permission.name !== undefined) {
      conflictNameOrCode.where(`${PERMISSION_QUERY_ALIAS}.name = :name`, {
        name: permission.name,
      });
    }

    if (permission.code !== undefined) {
      conflictNameOrCode.where(`${PERMISSION_QUERY_ALIAS}.code = :code`, {
        code: permission.code,
      });
    }

    if (permission.code !== undefined || permission.name !== undefined) {
      const conflictedRecords = await conflictNameOrCode.getMany();

      if (conflictedRecords.length > 0) {
        throw new ConflictException('Permission name or code already exists');
      }
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
}
