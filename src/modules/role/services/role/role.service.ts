import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { PERMISSION_QUERY_ALIAS } from '@/lib/const/permission.const';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/modules/role/dto/role/role.dto';
import { Roles } from '@/role/entities/role.entity';
import { RoleHelperService } from '@/role/helper/helper.service';
import { QueryService } from '@/role/services/role/query.service';
import { User } from '@/user/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly queryService: QueryService,
    private readonly helperService: RoleHelperService,
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
    hasAccessToCreatedBy,
    hasAccessToPermissions,
  }: {
    roleDto: CreateRoleDto;
    createdBy: UUID;
    hasAccessToCreatedBy: boolean;
    hasAccessToPermissions: boolean;
  }): Promise<Roles> {
    const { permissions, ...roleData } = roleDto;

    await this.helperService.findNameConflicts({
      name: roleData.name,
    });

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
        hasAccessToCreatedBy,
      });
    }

    if (!hasAccessToCreatedBy) {
      newRole.createdBy = {} as User;
    }

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
    hasAccessToCreatedBy,
  }: {
    permissionIds?: UUID[];
    permissionCodes?: string[];
    roleId: UUID;
    hasAccessToCreatedBy: boolean;
  }): Promise<Roles> {
    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id = :roleId`, { roleId });

    this.queryService.joinRelation<Roles>({
      query,
      alias: PERMISSION_QUERY_ALIAS,
    });

    if (hasAccessToCreatedBy) {
      this.queryService.joinRelation<Roles>({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    const role = await query.getOneOrFail();

    const permissionsBuffer = await this.helperService.getPermissionsBy({
      ids: permissionIds,
      codes: permissionCodes,
    });

    if (permissionsBuffer.length === 0) {
      throw new EntityNotFoundError(
        'Roles',
        `No permissions found to add to the role with ID ${roleId}`,
      );
    }

    const permissions = permissionsBuffer.filter(
      (obj, index, self) => index === self.findIndex((o) => o.id === obj.id),
    );

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
    hasAccessToCreatedBy,
    pagination,
    select,
    sort,
  }: {
    ids: UUID[];
    hasAccessToPermissions: boolean;
    hasAccessToCreatedBy: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Roles[]> {
    const query = this.roleRepository.createQueryBuilder(ROLE_QUERY_ALIAS);

    if (hasAccessToPermissions) {
      this.queryService.joinRelation<Roles>({
        query,
        alias: PERMISSION_QUERY_ALIAS,
      });
    }

    if (hasAccessToCreatedBy) {
      this.queryService.joinRelation<Roles>({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.whereIn<Roles>({
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
      criteria: this.queryService.roleQueryCriteria({
        includeCreatedBy: true,
        includePermissions: true,
        hasAccessToCreatedBy,
        hasAccessToPermissions,
      }),
    });

    const { roles } = await this.queryService.paginatedResult({
      query,
      alias: 'roles',
    });

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'Roles',
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
    sort,
  }: {
    createdByUserIds: UUID[];
    hasAccessToPermissions: boolean;
    pagination: PaginationDto;
    select?: string[];
    sort?: SortDto;
  }): Promise<Roles[]> {
    const query = this.roleRepository.createQueryBuilder(ROLE_QUERY_ALIAS);

    if (hasAccessToPermissions) {
      this.queryService.joinRelation<Roles>({
        query,
        alias: PERMISSION_QUERY_ALIAS,
      });
    }

    this.queryService.joinRelation<Roles>({
      query,
      alias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.queryService.whereIn<Roles>({
      query,
      field: CREATEDBY_USER_QUERY_ALIAS,
      values: createdByUserIds,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination,
      select,
      sort,
      criteria: this.queryService.roleQueryCriteria({
        includeCreatedBy: true,
        includePermissions: true,
        hasAccessToCreatedBy: true,
        hasAccessToPermissions,
      }),
    });

    const { roles } = await this.queryService.paginatedResult({
      query,
      alias: 'roles',
    });

    if (roles.length === 0) {
      throw new EntityNotFoundError(
        'Roles',
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
    sort,
    select,
  }: {
    value: string;
    pagination: PaginationDto;
    sort: SortDto;
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
      select,
      sort,
      criteria: this.queryService.roleQueryCriteria({
        includeCreatedBy: false,
        includePermissions: false,
        hasAccessToCreatedBy: false,
        hasAccessToPermissions: false,
      }),
    });

    return await this.queryService.paginatedResult({
      query,
      alias: 'roles',
    });
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
  async update({
    id,
    roleToUpdate,
  }: {
    id: UUID;
    roleToUpdate: UpdateRoleDto;
  }): Promise<Roles> {
    const role = await this.helperService.getByIdOrFail(id);

    if (roleToUpdate.name === undefined) {
      throw new BadRequestException(
        'Roles name is required for update. Please provide a valid name.',
      );
    }

    await this.helperService.findNameConflicts({
      id,
      name: roleToUpdate.name,
    });

    await this.roleRepository
      .createQueryBuilder()
      .update(Roles)
      .set({ name: role.name })
      .where('id = :id', { id })
      .execute();

    role.name = roleToUpdate.name;

    return role;
  }

  /**
   * Deletes roles by their ids.
   * @param ids - The UUIDs of the roles to delete.
   * @returns The number of deleted roles.
   * @throws EntityNotFoundError if no roles with the given ids exist.
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    await this.helperService.getManyByIdsOrFail(ids);

    const result = await this.roleRepository
      .createQueryBuilder()
      .delete()
      .from(Roles)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
