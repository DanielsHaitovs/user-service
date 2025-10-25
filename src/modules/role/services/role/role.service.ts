import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { PermissionService } from '@/role/services/permission/permission.service';
import { RoleQueryService } from '@/role/services/role/query.service';
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
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly permissionService: PermissionService,
    private readonly queryService: RoleQueryService,
  ) {}

  /**
   * Creates a new role in the database.
   * @param role - The role data to create.
   * If permissions are provided, they will be associated with the role.
   * @returns The created role entity.
   */
  async create({
    roleDto,
    createdBy,
    hasAccessToUser,
    hasAccessToPermissions,
  }: {
    roleDto: CreateRoleDto;
    createdBy: UUID;
    hasAccessToUser: boolean;
    hasAccessToPermissions: boolean;
  }): Promise<Role> {
    if (createdBy.length === 0) {
      throw new BadRequestException('Creator user ID is required');
    }

    if (!roleDto.name) {
      throw new BadRequestException('Role name is required');
    }

    const { permissions, ...roleData } = roleDto;

    // Check for existing role with the same name
    const existingRole = await this.getRoleByName(roleData.name);

    if (existingRole) {
      throw new ConflictException(
        `Role with name "${roleData.name}" already exists. Please choose a different name.`,
      );
    }

    // Create a new role entity
    const role = this.roleRepository.create({
      ...roleData,
      createdBy: { id: createdBy } as User,
    });

    const newRole = await this.roleRepository.save(role);

    if (
      hasAccessToPermissions &&
      permissions != undefined &&
      permissions.length > 0
    ) {
      return await this.addPermissionsToRole({
        permissionCodes: permissions.flatMap((code) => code),
        roleId: newRole.id,
        hasAccessToUser,
      });
    }

    if (!hasAccessToUser) {
      newRole.createdBy = {} as User;
    }

    // Save the new role to the database
    return newRole;
  }

  /**
   * Adds permissions to an existing role.
   * @param permissionIds - The IDs of the permissions to add.
   * @param roleId - The ID of the role to which permissions will be added.
   * @returns The updated role entity with new permissions.
   * @throws EntityNotFoundError if the role or any of the permissions do not exist.
   */
  async addPermissionsToRole({
    permissionIds,
    permissionCodes,
    roleId,
    hasAccessToUser,
  }: {
    permissionIds?: UUID[];
    permissionCodes?: string[];
    roleId: UUID;
    hasAccessToUser: boolean;
  }): Promise<Role> {
    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id = :roleId`, { roleId });

    this.queryService.joinRelation<Role>({
      query,
      relationAlias: PERMISSION_QUERY_ALIAS,
    });

    if (hasAccessToUser) {
      this.queryService.joinRelation<Role>({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    const role = await query.getOneOrFail();

    const permissionsBuffer = new Array<Permission>();

    if (permissionIds !== undefined) {
      permissionsBuffer.push(
        ...(await this.permissionService.findByIds({
          ids: permissionIds,
          pagination: { page: 1, limit: permissionIds.length },
          hasAccessToRole: false,
          hasAccessToUser: false,
        })),
      );
    }

    if (permissionCodes !== undefined) {
      permissionsBuffer.push(
        ...(await this.permissionService.findByCodes({
          codes: permissionCodes,
          pagination: { page: 1, limit: permissionCodes.length },
          hasAccessToRole: false,
          hasAccessToUser: false,
        })),
      );
    }

    if (permissionsBuffer.length === 0) {
      const errorMessage = new Array<string>();
      if (permissionIds !== undefined) {
        errorMessage.push(
          `Permissions not found with IDs: ${permissionIds.join(', ')}`,
        );
      }
      if (permissionCodes !== undefined) {
        errorMessage.push(
          `Permissions not found with codes: ${permissionCodes.join(', ')}`,
        );
      }

      throw new EntityNotFoundError('Role', errorMessage);
    }

    const permissions = permissionsBuffer.filter(
      (obj, index, self) => index === self.findIndex((o) => o.id === obj.id),
    );

    // Associate permissions with the role
    if (role.permissions.length === 0) {
      role.permissions = permissions;
    } else {
      role.permissions.push(...permissions);
    }

    return await this.roleRepository.save(role);
  }

  /**
   * Finds roles by their IDs with pagination.
   * @param ids - The UUIDs of the roles to find.
   * @param pagination - Pagination parameters to control result set size.
   * @returns Promise resolving to an array of role entities.
   * @throws EntityNotFoundError if no roles with the given IDs exist.
   * @throws BadRequestException if pagination parameters are invalid or no IDs are provided.
   */
  async findByIds({
    ids,
    hasAccessToPermissions,
    hasAccessToUser,
    pagination,
    select,
    order,
  }: {
    ids: UUID[];
    hasAccessToPermissions: boolean;
    hasAccessToUser: boolean;
    pagination: PaginationDto;
    select?: string[];
    order?: SortDto;
  }): Promise<Role[]> {
    if (ids.length === 0) {
      throw new BadRequestException('At least one role ID must be provided');
    }

    const query = this.roleRepository.createQueryBuilder(ROLE_QUERY_ALIAS);

    if (hasAccessToPermissions) {
      this.queryService.joinRelation<Role>({
        query,
        relationAlias: PERMISSION_QUERY_ALIAS,
      });
    }

    if (hasAccessToUser) {
      this.queryService.joinRelation<Role>({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.whereIn<Role>({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser,
      hasAccessToPermissions,
      includeCreatedBy: true,
      includePermissions: true,
      select,
      order,
    });

    const roles = await query.getMany();

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'Role',
        `Roles not found: ${ids.join(', ')}`,
      );
    }

    return roles;
  }

  /**
   * Finds roles created by specific users with pagination.
   * @param createdByUserIds - The UUIDs of the users who created the roles.
   * @param pagination - Pagination parameters to control result set size.
   * @returns Promise resolving to an array of role entities.
   * @throws EntityNotFoundError if no roles created by the given users exist.
   * @throws BadRequestException if pagination parameters are invalid or no user IDs are provided.
   */
  async findCreatedByUserWithId({
    createdByUserIds,
    hasAccessToPermissions,
    pagination,
    select,
    order,
  }: {
    createdByUserIds: UUID[];
    hasAccessToPermissions: boolean;
    pagination: PaginationDto;
    select?: string[];
    order?: SortDto;
  }): Promise<Role[]> {
    if (createdByUserIds.length === 0) {
      throw new BadRequestException(
        'At least one createdBy user ID must be provided',
      );
    }

    const query = this.roleRepository.createQueryBuilder(ROLE_QUERY_ALIAS);

    if (hasAccessToPermissions) {
      this.queryService.joinRelation<Role>({
        query,
        relationAlias: PERMISSION_QUERY_ALIAS,
      });
    }

    this.queryService.joinRelation<Role>({
      query,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.queryService.whereIn<Role>({
      query,
      field: CREATEDBY_USER_QUERY_ALIAS,
      values: createdByUserIds,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser: true,
      hasAccessToPermissions,
      includeCreatedBy: true,
      includePermissions: true,
      select,
      order,
    });

    const roles = await query.getMany();

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'Role',
        `Roles not found: ${createdByUserIds.join(', ')}`,
      );
    }

    return roles;
  }

  /**
   * Searches for roles by name with pagination and sorting.
   * @param value - The search term to match against role names.
   * @param pagination - Pagination parameters to control result set size.
   * @param sort - Sorting parameters to order results by specified field.
   * @returns Promise resolving to an array of matching role entities.
   * @throws ConflictException if pagination parameters are invalid.
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
  }): Promise<RoleListResponseDto> {
    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name like :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${ROLE_QUERY_ALIAS}.id::text ILIKE :value`, {
        value: `%${value}%`,
      });

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser: false,
      hasAccessToPermissions: false,
      includeCreatedBy: false,
      includePermissions: false,
      select,
      order,
    });

    const roles = await query.getManyAndCount();

    const totalCount = roles[1];

    const { page, limit } = pagination;

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      roles: roles[0],
    };
  }

  /**
   * Updates a role by its ID.
   * Validates that the role exists and checks for conflicts with existing names.
   *
   * @param id - The UUID of the role to update
   * @param role - The updated role data
   * @returns The updated role entity
   * @throws EntityNotFoundError if the role with the given ID does not exist
   * @throws BadRequestException if the name is not provided
   * @throws ConflictException if the new name conflicts with existing roles
   */
  async update({ id, role }: { id: UUID; role: UpdateRoleDto }): Promise<Role> {
    await this.findByIds({
      ids: [id],
      hasAccessToPermissions: false,
      hasAccessToUser: false,
      pagination: { page: 1, limit: 1 },
    });

    if (role.name === undefined) {
      throw new BadRequestException(
        'Role name is required for update. Please provide a valid name.',
      );
    }

    const conflictName = await this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name = :name`, { name: role.name })
      .andWhere(`${ROLE_QUERY_ALIAS}.id != :id`, { id })
      .getOne();

    if (conflictName) {
      throw new ConflictException(
        `Role with name "${role.name}" already exists. Please choose a different name.`,
      );
    }

    await this.roleRepository
      .createQueryBuilder()
      .update(Role)
      .set({ name: role.name })
      .where('id = :id', { id })
      .execute();

    return this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id = :id`, { id })
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${CREATEDBY_USER_QUERY_ALIAS}`,
        CREATEDBY_USER_QUERY_ALIAS,
      )
      .getOneOrFail();
  }

  /**
   * Deletes roles by their ids.
   * @param ids - The UUIDs of the roles to delete.
   * @returns The number of deleted roles.
   * @throws EntityNotFoundError if no roles with the given ids exist.
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    // Early return for empty input to avoid unnecessary database queries
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    // Comprehensive existence validation before any deletion
    const existingRoles = await this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id IN (:...ids)`, { ids })
      .getMany();

    // Fail-fast validation with detailed error reporting
    if (existingRoles.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingRoles.find((role) => role.id === id),
      );

      throw new EntityNotFoundError(
        'Role',
        `Roles with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    // Atomic bulk deletion with affected row tracking
    const result = await this.roleRepository
      .createQueryBuilder()
      .delete()
      .from(Role)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }

  private async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name = :name`, { name })
      .getOne();
  }
}
