import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { UserRequestDto, UserSearchRequestDto } from '@/user/dto/query.dto';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListResponseDto,
} from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { HelperService } from '@/user/helper/helper.service';
import { QueryService } from '@/user/services/query.service';
import { UserRoleService } from '@/user/services/roles/user-role.service';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '@/utils/token-generator.util';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';
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
    private readonly userRoleService: UserRoleService,
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
  async create({
    createUserDto,
    createdBy,
  }: {
    createUserDto: CreateUserDto;
    createdBy: UUID;
  }): Promise<User> {
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
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
    control,
  }: {
    ids: string[];
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
    control: UserRequestDto;
  }): Promise<UserListResponseDto> {
    const query = this.userRepository.createQueryBuilder(USER_QUERY_ALIAS);

    this.queryService.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    const {
      page,
      limit,
      sortField,
      sortOrder,
      selectUserFields,
      selectDepartmentFields,
      selectPermissionFields,
      selectRoleFields,
      selectUserRoleFields,
      includeCreatedBy,
      includeDepartments,
      includeRoles,
      includePermissions,
    } = control;

    if (includeCreatedBy) {
      this.queryService.joinRelation({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.filterByDepartments({
      query,
      hasAccessToDepartments: hasAccessToDepartments && includeDepartments,
    });

    this.queryService.filterByRolePermission({
      query,
      hasAccessToRoles: hasAccessToRoles && includeRoles,
      hasAccessToPermissions: hasAccessToPermissions && includePermissions,
    });

    this.queryService.optimize({
      query,
      pagination: { limit, page },
      sort: {
        sortField: sortField ?? `${USER_QUERY_ALIAS}.createdAt`,
        sortOrder,
      },
      select: [
        ...selectUserFields,
        ...selectDepartmentFields,
        ...selectUserRoleFields,
        ...selectRoleFields,
        ...selectPermissionFields,
      ],
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy,
        includeDepartments,
        includeRoles,
        includePermissions,
        hasAccessToCreatedBy: true,
        hasAccessToDepartments,
        hasAccessToRoles,
        hasAccessToPermissions,
      }),
    });

    const response = await this.queryService.paginatedResult({
      query,
      alias: 'users',
    });

    if (response.users.length === 0) {
      throw new EntityNotFoundError(
        'Users',
        `Users with IDs [${ids.join(', ')}] not found`,
      );
    }

    return response;
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
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
    control,
  }: {
    emails: string[];
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
    control: UserRequestDto;
  }): Promise<UserListResponseDto> {
    const query = this.userRepository.createQueryBuilder(USER_QUERY_ALIAS);

    this.queryService.whereIn({
      query,
      field: 'email',
      values: emails,
      condition: 'AND',
      relationAlias: USER_QUERY_ALIAS,
    });

    const {
      page,
      limit,
      sortField,
      sortOrder,
      selectUserFields,
      selectDepartmentFields,
      selectPermissionFields,
      selectRoleFields,
      selectUserRoleFields,
      includeCreatedBy,
      includeDepartments,
      includeRoles,
      includePermissions,
    } = control;

    if (includeCreatedBy) {
      this.queryService.joinRelation({
        query,
        alias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.filterByDepartments({
      query,
      hasAccessToDepartments: hasAccessToDepartments && includeDepartments,
    });

    this.queryService.filterByRolePermission({
      query,
      hasAccessToRoles: hasAccessToRoles && includeRoles,
      hasAccessToPermissions: hasAccessToPermissions && includePermissions,
    });

    this.queryService.optimize({
      query,
      pagination: { limit, page },
      sort: {
        sortField: sortField ?? `${USER_QUERY_ALIAS}.createdAt`,
        sortOrder,
      },
      select: [
        ...selectUserFields,
        ...selectDepartmentFields,
        ...selectUserRoleFields,
        ...selectRoleFields,
        ...selectPermissionFields,
      ],
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy,
        includeDepartments,
        includeRoles,
        includePermissions,
        hasAccessToCreatedBy: true,
        hasAccessToDepartments,
        hasAccessToRoles,
        hasAccessToPermissions,
      }),
    });

    const response = await this.queryService.paginatedResult({
      query,
      alias: 'users',
    });

    if (response.users.length === 0) {
      throw new EntityNotFoundError(
        'Users',
        `Users with emails [${emails.join(', ')}] not found`,
      );
    }

    return response;
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
    control,
  }: {
    value?: string;
    control: UserSearchRequestDto;
  }): Promise<UserListResponseDto> {
    if (value === undefined || value.trim() === '') {
      return {
        users: [],
        total: 0,
        page: 1,
        limit: control.limit,
        totalPages: 0,
      };
    }

    const { limit, page, sortField, sortOrder, selectUserFields } = control;

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
      pagination: { limit, page },
      sort: {
        sortField: sortField ?? `${USER_QUERY_ALIAS}.createdAt`,
        sortOrder,
      },
      select: selectUserFields,
      criteria: this.queryService.userQueryCriteria({
        includeCreatedBy: false,
        includeDepartments: false,
        includeRoles: false,
        includePermissions: false,
        hasAccessToCreatedBy: false,
        hasAccessToDepartments: false,
        hasAccessToRoles: false,
        hasAccessToPermissions: false,
      }),
    });

    return await this.queryService.paginatedResult({
      query,
      alias: 'users',
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
  async updateById({
    id,
    updateUserDto,
  }: {
    id: UUID;
    updateUserDto: UpdateUserDto;
  }): Promise<User> {
    await this.helperService.findByIdOrFail({ id });

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

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(updateUserDto)
      .where('id = :id', { id })
      .execute();

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
  async updateByEmail({
    email,
    updateUserDto,
  }: {
    email: string;
    updateUserDto: UpdateUserDto;
  }): Promise<User> {
    const user = await this.helperService.findByEmailOrFail(email);

    if (updateUserDto.email !== undefined) {
      await this.helperService.findEmailConflicts({
        email: updateUserDto.email,
        id: user.id,
      });
    }

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
   */
  async deleteByIds({
    ids,
    currentUserId,
  }: {
    ids: UUID[];
    currentUserId: UUID;
  }): Promise<{ deleted: number; message: string }> {
    if (ids.length === 0) {
      return { deleted: 0, message: 'No users deleted' };
    }

    const { users: existingUsers } = await this.findByIds({
      ids,
      hasAccessToRoles: true,
      hasAccessToDepartments: false,
      hasAccessToPermissions: false,
      control: {
        includeRoles: true,
        includeDepartments: false,
        includePermissions: false,
        includeCreatedBy: false,
        limit: ids.length,
        page: 1,
        sortField: undefined,
        sortOrder: 'ASC',
        selectUserFields: ['id'],
        selectRoleFields: ['id'],
        selectUserRoleFields: ['id'],
        selectDepartmentFields: [],
        selectPermissionFields: [],
      },
    });

    if (existingUsers.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingUsers.find((user) => user.id === id),
      );

      throw new EntityNotFoundError(
        'User',
        `Could not delete users with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    const roleIds = existingUsers.flatMap((user) => {
      if (user.userRoles != undefined) {
        return user.userRoles.map((userRole) => userRole.role.id);
      }

      return [];
    });

    await this.userRoleService.unassignRolesFromUsers({
      userIds: ids,
      roleIds,
      assignedBy: currentUserId,
    });

    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...ids)', { ids })
      .execute();

    return {
      deleted: result.affected ?? 0,
      message: `${(result.affected ?? 0).toString()} ${result.affected !== 1 ? 'users' : 'user'} deleted successfully`,
    };
  }
}
