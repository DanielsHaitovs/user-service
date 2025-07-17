import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { PermissionService } from '@/role/services/permission.service';
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
  ) {}

  /**
   * Creates a new role in the database.
   * @param role - The role data to create.
   * If permissions are provided, they will be associated with the role.
   * @returns The created role entity.
   */
  async create(roleDto: CreateRoleDto): Promise<Role> {
    const { permissions, ...roleData } = roleDto;
    const permissionsBuffer = new Array<Permission>();

    // Create a new role entity
    const role = this.roleRepository.create(roleData);

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
      await this.addPermissionsToRole(
        permissionsBuffer.flatMap((p) => p.id),
        newRole.id,
      );

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
  async addPermissionsToRole(
    permissionIds: UUID[],
    roleId: UUID,
  ): Promise<Role> {
    const role = await this.roleRepository
      .createQueryBuilder('role')
      .where('role.id = :roleId', { roleId })
      .leftJoinAndSelect('role.permissions', 'permissions')
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
   * Retrieves roles by id from the database.
   * @returns the role entities.
   */
  async findByIds(ids: UUID[]): Promise<Role[]> {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .whereInIds(ids)
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
    sort: SortDto;
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

    if (sort.sortField) {
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
  async update(id: UUID, role: UpdateRoleDto): Promise<Role> {
    await this.findByIds([id]);

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
