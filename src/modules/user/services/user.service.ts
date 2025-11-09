import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListResponseDto,
} from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { HelperService } from '@/user/helper/helper.service';
import { QueryService } from '@/user/services/query.service';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '@/utils/token-generator.util';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

import { ROLE_QUERY_ALIAS } from '../../../lib/const/role.const';
/**
 * Service for managing user entities, including creation, retrieval,
 * updating, and deletion with comprehensive validation and error handling.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queryService: QueryService,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Creates a new user with email uniqueness validation.
   *
   * Performs upfront email conflict detection to prevent duplicate accounts
   * and maintain data integrity. Uses selective field querying for optimal
   * performance during validation checks.
   *
   * @param createUserDto - User registration data with validated fields
   * @returns Promise resolving to the created user entity
   * @throws ConflictException when email address is already registered
   */
  async create(createUserDto: CreateUserDto, createdBy: UUID): Promise<User> {
    await this.helperService.findEmailConflicts({
      email: createUserDto.email,
    });

    const { departmentIds, roleIds } = createUserDto;

    const user = this.userRepository.create({
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
      isEmailVerified: false,
      emailVerificationToken: generateEmailVerificationToken(),
      passwordResetToken: generatePasswordResetToken(),
    });

    return await this.helperService.createUser({
      user,
      departmentIds,
      roleIds,
      createdById: createdBy,
    });
  }

  /**
   * Retrieves a user by their unique identifier.
   *
   * Uses parameterized queries for security and throws descriptive errors
   * for missing records to support proper error handling in controllers.
   *
   * @param id - UUID string identifier for the user
   * @returns Promise resolving to the user entity
   * @throws EntityNotFoundError when user ID doesn't exist
   */
  async findByIds({
    ids,
    pagination,
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
    select,
    sort,
  }: {
    ids: UUID[];
    pagination: PaginationDto;
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
    select?: string[];
    sort?: SortDto;
  }): Promise<User[]> {
    if (ids.length === 0) {
      throw new BadRequestException('At least one ID must be provided');
    }

    const query = this.userRepository.createQueryBuilder(USER_QUERY_ALIAS);

    this.queryService.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.queryService.joinRelation({
      query,
      alias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.queryService.filterByDepartments({
      query,
      hasAccessToDepartments,
    });

    this.queryService.filterByRolePermission({
      query,
      hasAccessToRoles,
      hasAccessToPermissions,
    });

    this.queryService.optimize({
      query,
      pagination,
      select,
      sort,
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy: true,
        includeDepartments: true,
        includeRoles: true,
        includePermissions: true,
        hasAccessToCreatedBy: true,
        hasAccessToDepartments,
        hasAccessToRoles,
        hasAccessToPermissions,
      }),
    });

    const { users } = await this.queryService.paginatedResult({
      query,
      alias: 'users',
      pagination,
    });

    if (users.length === 0) {
      throw new EntityNotFoundError(
        'Users',
        `Users with IDs [${ids.join(', ')}] not found`,
      );
    }

    return users;
  }

  /**
   * Locates a user by their email address for authentication and recovery workflows.
   *
   * Critical for login processes, password resets, and account verification.
   * Uses case-sensitive matching as per email validation standards.
   *
   * @param email - User's email address
   * @returns Promise resolving to the user entity
   * @throws EntityNotFoundError when email is not registered
   */
  async findByEmails({
    emails,
    pagination,
    hasAccessToCreatedBy,
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
    select,
    sort,
  }: {
    emails: string[];
    pagination: PaginationDto;
    hasAccessToCreatedBy: boolean;
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
    select?: string[];
    sort?: SortDto;
  }): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder(USER_QUERY_ALIAS);

    this.queryService.whereIn({
      query,
      field: 'email',
      values: emails,
      condition: 'AND',
      relationAlias: USER_QUERY_ALIAS,
    });

    if (hasAccessToCreatedBy) {
      this.queryService.joinRelation({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.filterByDepartments({
      query,
      hasAccessToDepartments,
    });

    this.queryService.filterByRolePermission({
      query,
      hasAccessToRoles,
      hasAccessToPermissions,
    });

    this.queryService.optimize({
      query,
      pagination,
      select,
      sort,
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy: true,
        includeDepartments: true,
        includeRoles: true,
        includePermissions: true,
        hasAccessToCreatedBy: true,
        hasAccessToDepartments,
        hasAccessToRoles,
        hasAccessToPermissions,
      }),
    });

    const { users } = await this.queryService.paginatedResult({
      query,
      alias: 'users',
      pagination,
    });

    if (users.length === 0) {
      throw new EntityNotFoundError(
        'Users',
        `Users with emails [${emails.join(', ')}] not found`,
      );
    }

    return users;
  }

  /**
   * Searches users by partial matches on name, email, or ID.
   *
   * Supports flexible user lookup for administrative interfaces and
   * autocomplete features. Utilizes ILIKE for case-insensitive matching
   * across multiple key fields.
   *
   * @param value - Partial search string for matching
   * @param pagination - Pagination parameters for result set
   * @param sort - Sorting parameters for result set
   * @param select - Optional fields to select in the result
   * @returns Promise resolving to paginated list of matching users
   * @throws ConflictException when pagination parameters are invalid
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
  }): Promise<UserListResponseDto> {
    const query = this.userRepository
      .createQueryBuilder(USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.firstName ILIKE :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${USER_QUERY_ALIAS}.lastName ILIKE :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${USER_QUERY_ALIAS}.email ILIKE :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${USER_QUERY_ALIAS}.id::text ILIKE :value`, {
        value: `%${value}%`,
      });

    this.queryService.optimize({
      query,
      pagination,
      select,
      sort,
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy: false,
        includeDepartments: false,
        includeRoles: false,
        hasAccessToCreatedBy: false,
        hasAccessToDepartments: false,
        hasAccessToRoles: false,
        hasAccessToPermissions: false,
        includePermissions: false,
      }),
    });

    return await this.queryService.paginatedResult({
      query,
      alias: 'users',
      pagination,
    });
  }

  /**
   * Updates user information by ID with comprehensive validation.
   *
   * Implements atomic update pattern: validates existence and uniqueness constraints
   * before applying changes. Prevents email conflicts across the user base while
   * allowing users to keep their existing email unchanged.
   *
   * @param id - Target user's UUID identifier
   * @param updateUserDto - Partial user data for updates
   * @returns Promise resolving to the updated user entity
   * @throws NotFoundException when user ID doesn't exist
   * @throws ConflictException when email is already used by another user
   */
  async updateById(id: UUID, updateUserDto: UpdateUserDto): Promise<User> {
    // Verify user existence before proceeding with update
    await this.helperService.findByIdOrFail({ id });

    // Email uniqueness validation - only check if email is being changed
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email.trim() !== ''
    ) {
      const emailExists = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email: updateUserDto.email })
        .andWhere('user.id != :id', { id })
        .getOne();

      if (emailExists) {
        throw new ConflictException('Email is already in use by another user');
      }
    }

    // Atomic update operation with parameterized query
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(updateUserDto)
      .where('id = :id', { id })
      .execute();

    // Return fresh entity state after update
    return await this.helperService.findByIdOrFail({ id });
  }

  /**
   * Updates user information by email address with cross-user validation.
   *
   * Alternative update method for scenarios where email is the primary identifier
   * (e.g., profile updates from authentication contexts). Maintains same
   * validation patterns as ID-based updates.
   *
   * @param email - Current email address of the user to update
   * @param updateUserDto - Partial user data for updates
   * @returns Promise resolving to the updated user entity
   * @throws EntityNotFoundError when email doesn't match any user
   * @throws ConflictException when new email conflicts with existing users
   */
  async updateByEmail(
    email: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // Resolve email to user entity for ID extraction
    const user = await this.helperService.findByEmailOrFail(email);

    // Email uniqueness validation with current user exclusion
    if (updateUserDto.email !== undefined) {
      await this.helperService.findEmailConflicts({
        email: updateUserDto.email,
        id: user.id,
      });
    }

    // Perform update using original email as identifier
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(updateUserDto)
      .where('email = :email', { email })
      .execute();

    return await this.userRepository.findOneOrFail({ where: { id: user.id } });
  }

  /**
   * Performs bulk user deletion with comprehensive existence validation.
   *
   * Implements fail-fast validation to ensure all target users exist before
   * executing any deletions, preventing partial operations and maintaining
   * data consistency. Optimized for administrative bulk operations.
   *
   * @param ids - Array of user UUID identifiers to delete
   * @returns Promise resolving to deletion count summary
   * @throws NotFoundException when any specified user ID doesn't exist
   *
   * @example
   * ```typescript
   * const result = await userService.deleteByIds(['uuid1', 'uuid2']);
   * ```
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    // Early return for empty input to avoid unnecessary database queries
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    // Comprehensive existence validation before any deletion
    const existingUsers = await this.userRepository
      .createQueryBuilder(USER_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${USER_QUERY_ALIAS}.${USER_ROLE_QUERY_ALIAS}`,
        USER_ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.role`, ROLE_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id IN (:...ids)`, { ids })
      .getMany();

    // Fail-fast validation with detailed error reporting
    if (existingUsers.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingUsers.find((user) => user.id === id),
      );

      throw new EntityNotFoundError(
        'User',
        `Could not delete users with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    // const roleIds = existingUsers.flatMap((user) =>
    //   user.userRoles.map((userRole) => userRole.roles.id),
    // );

    // await this.roleService.unassignRolesFromUsers({ userIds: ids, roleIds });

    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
