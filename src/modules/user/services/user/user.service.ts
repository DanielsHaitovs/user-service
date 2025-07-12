import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { DepartmentService } from '@/department/services/department.service';
import { USER_QUERY_ALIAS } from '@/lib/const/user.const';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListResponseDto,
} from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { UserRoleService } from '@/user/services/roles/userRole.service';
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
 * Core service for user management operations with comprehensive validation and error handling.
 *
 * Implements business rules including email uniqueness constraints, atomic operations,
 * and consistent query patterns using TypeORM QueryBuilder for optimal performance
 * and SQL injection prevention.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly departmentService: DepartmentService,
    private readonly roleService: UserRoleService,
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
  async create(createUserDto: CreateUserDto, createdBy?: UUID): Promise<User> {
    const { departmentIds, roleIds } = createUserDto;
    const department = await this.departmentService.findByIds(departmentIds);

    if (department.length === 0) {
      throw new EntityNotFoundError(
        'User Department',
        `Can not create user because provided department not found: ${departmentIds.join(', ')}`,
      );
    }

    const existingUserEmail = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: createUserDto.email })
      .select(['user.email'])
      .getOne();

    if (existingUserEmail != undefined) {
      throw new ConflictException('User with this email already exists');
    }

    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      ...createUserDto,
      emailVerificationToken: generateEmailVerificationToken(),
      passwordResetToken: generatePasswordResetToken(),
    });

    user.departments = department;

    const newUser = await this.userRepository.save(user);

    try {
      if (roleIds.length > 0) {
        const userRoles = await this.roleService.create({
          userId: newUser.id,
          roleIds,
          assignedById: createdBy ?? newUser.id,
        });

        newUser.userRoles = userRoles;

        return newUser;
      }
    } catch (error) {
      await this.userRepository.remove(newUser);
      throw error;
    }

    return newUser;
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
  async findById(id: UUID): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOneOrFail();
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
  async findByEmail(email: string): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOneOrFail();
  }

  async searchFor({
    value,
    pagination,
    sort,
  }: {
    value: string;
    pagination: PaginationDto;
    sort: SortDto;
  }): Promise<UserListResponseDto> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new ConflictException(
        'Pagination parameters must be greater than 0',
      );
    }

    const { page, limit } = pagination;

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

    if (sort.sortField) {
      query.orderBy(`${USER_QUERY_ALIAS}.${sort.sortField}`, sort.sortOrder);
    }

    const users = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalCount = users[1];

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      users: users[0],
    };
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
    await this.findById(id);

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
    return this.findById(id);
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
    const user = await this.findByEmail(email);

    // Email uniqueness validation with current user exclusion
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email.trim() !== ''
    ) {
      const emailExists = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :newEmail AND user.id != :id', {
          newEmail: updateUserDto.email,
          id: user.id,
        })
        .getOne();

      if (emailExists) {
        throw new ConflictException('Email is already in use by another user');
      }
    }

    // Perform update using original email as identifier
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(updateUserDto)
      .where('email = :email', { email })
      .execute();

    return this.findById(user.id);
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
   * console.log(`Deleted ${result.deleted} users`);
   * ```
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    // Early return for empty input to avoid unnecessary database queries
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    // Comprehensive existence validation before any deletion
    const existingUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('user.id IN (:...ids)', { ids })
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

    const roleIds = existingUsers.flatMap((user) =>
      user.userRoles.map((userRole) => userRole.role.id),
    );

    await this.roleService.unassignRoleFromUser(ids, roleIds);

    // Atomic bulk deletion with affected row tracking
    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
