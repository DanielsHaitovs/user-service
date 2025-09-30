import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { PermissionService } from '@/role/services/permission.service';
import { User } from '@/user/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

import { CREATEDBY_USER_QUERY_ALIAS } from '../../../lib/const/user.const';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly permissionService: PermissionService,
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
  }: {
    roleDto: CreateRoleDto;
    createdBy: UUID;
  }): Promise<Role> {
    if (createdBy.length === 0) {
      throw new BadRequestException('Creator user ID is required');
    }

    if (!roleDto.name) {
      throw new BadRequestException('Role name is required');
    }

    const { permissions, ...roleData } = roleDto;
    const permissionsBuffer = new Array<Permission>();

    // Check for existing role with the same name
    const existingRole = await this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name = :name`, { name: roleData.name })
      .getOne();

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

    if (permissions != undefined && permissions.length > 0) {
      const permissionsToAssign = await this.permissionService.findByCodes(
        permissions.flatMap((code) => code),
      );

      if (permissionsToAssign.length !== permissions.length) {
        throw new EntityNotFoundError(
          'Role',
          `Role can not be create because could not find every specified permissions with codes: ${permissions.join(', ')}`,
        );
      }

      permissionsBuffer.push(...permissionsToAssign);
    }

    const newRole = await this.roleRepository.save(role);

    if (permissionsBuffer.length > 0) {
      await this.addPermissionsToRole({
        permissionIds: permissionsBuffer.flatMap((p) => p.id),
        roleId: newRole.id,
      });

      newRole.permissions = permissionsBuffer;
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
    roleId,
  }: {
    permissionIds: UUID[];
    roleId: UUID;
  }): Promise<Role> {
    const role = await this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.id = :roleId`, { roleId })
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      )
      .getOneOrFail();

    const permissions = await this.permissionService.findByIds(permissionIds);

    if (permissions.length === 0) {
      throw new EntityNotFoundError(
        'Role',
        `No permissions found for the given IDs: ${permissionIds.join(', ')}`,
      );
    }

    // Associate permissions with the role
    if (role.permissions.length === 0) {
      role.permissions = permissions;
    } else {
      role.permissions.push(...permissions);
    }

    // Save the updated role with new permissions
    return this.roleRepository.save(role);
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
    pagination,
    sort,
  }: {
    ids: UUID[];
    pagination: PaginationDto;
    sort?: SortDto;
  }): Promise<Role[]> {
    const { page, limit } = pagination;

    if (ids.length === 0) {
      throw new BadRequestException('No role IDs provided');
    }

    if (page < 1 || limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }
    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${CREATEDBY_USER_QUERY_ALIAS}`,
        CREATEDBY_USER_QUERY_ALIAS,
      )
      .where(`${ROLE_QUERY_ALIAS}.id IN (:...ids)`, { ids });

    if (sort != undefined) {
      query.orderBy(`${ROLE_QUERY_ALIAS}.${sort.sortField}`, sort.sortOrder);
    }

    const roles = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
    pagination,
    sort,
  }: {
    createdByUserIds: UUID[];
    pagination: PaginationDto;
    sort?: SortDto;
  }): Promise<Role[]> {
    const { page, limit } = pagination;

    if (createdByUserIds.length === 0) {
      throw new BadRequestException('No role IDs provided');
    }

    if (page < 1 || limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }

    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${CREATEDBY_USER_QUERY_ALIAS}`,
        CREATEDBY_USER_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      )
      .where(
        `${ROLE_QUERY_ALIAS}.${CREATEDBY_USER_QUERY_ALIAS} IN (:...createdByUserIds)`,
        {
          createdByUserIds,
        },
      );

    if (sort != undefined) {
      query.orderBy(`${ROLE_QUERY_ALIAS}.${sort.sortField}`, sort.sortOrder);
    }

    const roles = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
    sort,
  }: {
    value: string;
    pagination: PaginationDto;
    sort?: SortDto;
  }): Promise<RoleListResponseDto> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }

    const { page, limit } = pagination;

    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name like :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${ROLE_QUERY_ALIAS}.id::text ILIKE :value`, {
        value: `%${value}%`,
      });

    if (sort != undefined) {
      query.orderBy(`${ROLE_QUERY_ALIAS}.${sort.sortField}`, sort.sortOrder);
    }

    const roles = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalCount = roles[1];

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
    await this.findByIds({ ids: [id], pagination: { page: 1, limit: 1 } });

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
}
