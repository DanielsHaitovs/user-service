import { Permissions } from '@/common/decorators/permission.decorator';
import { CurrentUserId } from '@/common/decorators/user.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { getDepartmentSelectableFields } from '@/department/helper/department-fields.util';
import { COUNTRIES } from '@/lib/const/countries.const';
import {
  EXAMPLE_DEPARTMENT_ID,
  READ_DEPARTMENT,
} from '@/lib/const/department.const';
import { EXAMPLE_ROLE_ID, READ_ROLE } from '@/lib/const/role.const';
import {
  CREATE_USER,
  DELETE_USER,
  EMAIL_EXISTS_MSG,
  EXAMPLE_USER_DATE_OF_BIRTH,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
  EXAMPLE_USER_FIRST_NAME,
  EXAMPLE_USER_ID,
  EXAMPLE_USER_LAST_NAME,
  EXAMPLE_USER_PHONE,
  READ_USER,
  READ_USER_ROLE,
  UPDATE_USER,
  USER_NOT_FOUND_MSG,
} from '@/lib/const/user.const';
import { TraceController } from '@/lib/decorators/trace.decorator';
import { getRoleSelectableFields } from '@/role/helper/role-fields.util';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { UserQueryService } from '@/user/services/query.service';
import { UserService } from '@/user/services/user/user.service';
import { generateUserFriendlyPassword } from '@/utils/token-generator.util';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';

/**
 * REST API controller for comprehensive user management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users')
@TraceController()
@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly queryService: UserQueryService,
  ) {}

  /**
   * Creates a new user account with comprehensive validation and conflict detection.
   *
   * Implements user registration workflow with email uniqueness enforcement.
   * Supports both minimal and full profile creation scenarios through flexible
   * DTO validation. Generates secure passwords and initialization tokens.
   */
  @Post()
  @Permissions(CREATE_USER, READ_USER, READ_DEPARTMENT, READ_ROLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user account with the provided information. Email must be unique.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
    examples: {
      'new-user': {
        summary: 'Create a new user',
        description: 'Example of creating a new user with all required fields',
        value: {
          firstName: EXAMPLE_USER_FIRST_NAME,
          lastName: EXAMPLE_USER_LAST_NAME,
          email: EXAMPLE_USER_EMAIL,
          password: generateUserFriendlyPassword(),
          phone: EXAMPLE_USER_PHONE,
          dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
          departmentIds: [EXAMPLE_DEPARTMENT_ID],
          roleIds: [EXAMPLE_ROLE_ID],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserResponseDto,
    example: {
      id: EXAMPLE_USER_ID,
      firstName: EXAMPLE_USER_FIRST_NAME,
      lastName: EXAMPLE_USER_LAST_NAME,
      email: EXAMPLE_USER_EMAIL,
      phone: EXAMPLE_USER_PHONE,
      dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'firstName should not be empty',
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiConflictResponse({
    description: EMAIL_EXISTS_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: EMAIL_EXISTS_MSG },
        error: { type: 'string', example: ConflictException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'One or more referenced entities not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Department or Role not found' },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: ForbiddenException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: UnauthorizedException.name },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden access',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden' },
        error: { type: 'string', example: ForbiddenException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUserId() createdBy: UUID,
  ): Promise<User> {
    return await this.userService.create(createUserDto, createdBy);
  }

  /**
   * Retrieves user information by unique identifier for profile access and administration.
   *
   * Primary lookup method for user data access. Commonly used in authentication
   * contexts, profile management, and administrative interfaces where the user ID
   * is already known from previous operations or JWT tokens.
   */
  @Get(':id')
  @Permissions(READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a user by their unique identifier (UUID).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'User unique identifier',
    example: EXAMPLE_USER_ID,
  })
  @ApiOkResponse({
    description: 'User found and returned successfully',
    type: UserResponseDto,
    example: {
      id: EXAMPLE_USER_ID,
      firstName: EXAMPLE_USER_FIRST_NAME,
      lastName: EXAMPLE_USER_LAST_NAME,
      email: EXAMPLE_USER_EMAIL,
      phone: EXAMPLE_USER_PHONE,
      dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid UUID format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: USER_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: USER_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async getUserById(@Param('id') id: UUID): Promise<User> {
    return await this.userService.findById(id);
  }

  /**
   * Locates user by email address for authentication and account recovery workflows.
   *
   * Alternative lookup method supporting email-based user identification.
   * Essential for login processes, password recovery, and scenarios where
   * email is the primary user identifier available to the client.
   */
  @Get(':email')
  @Permissions(READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by email',
    description: 'Retrieves a user by their email address.',
  })
  @ApiParam({
    name: 'email',
    type: 'string',
    format: 'email',
    description: 'User email address',
    example: EXAMPLE_USER_EMAIL,
  })
  @ApiOkResponse({
    description: 'User found and returned successfully',
    type: UserResponseDto,
    example: {
      id: EXAMPLE_USER_ID,
      firstName: EXAMPLE_USER_FIRST_NAME,
      lastName: EXAMPLE_USER_LAST_NAME,
      email: EXAMPLE_USER_EMAIL,
      phone: EXAMPLE_USER_PHONE,
      dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid email format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: USER_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: USER_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    return await this.userService.findByEmail(email);
  }

  @Get(':value')
  @Permissions(READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Searches for permissions by firstname, lastname, email or ID',
  })
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for USER (firstname, lastname, email or ID)',
    example: EXAMPLE_USER_FIRST_NAME,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter users by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter users by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: getUserSelectableFields(),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiOkResponse({
    description: 'Users found and returned successfully',
    example: [
      {
        id: EXAMPLE_USER_ID,
        firstname: EXAMPLE_USER_FIRST_NAME,
        lastname: EXAMPLE_USER_LAST_NAME,
        email: EXAMPLE_USER_EMAIL,
      },
    ],
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async searchForUsers(
    @Param('value') value: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<UserListResponseDto> {
    return await this.userService.searchFor({
      value,
      pagination: {
        page,
        limit,
      },
      sort: {
        sortField,
        sortOrder,
      },
    });
  }

  /**
   * Performs partial user profile updates with conflict detection and validation.
   *
   * Implements PATCH semantics for selective field updates without requiring
   * complete profile data. Maintains email uniqueness constraints and supports
   * administrative status changes alongside user profile modifications.
   */
  @Patch(':id')
  @Permissions(UPDATE_USER, READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by ID',
    description:
      'Updates a user by their unique identifier. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'User unique identifier',
    example: EXAMPLE_USER_ID,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data (partial)',
    examples: {
      'update-name': {
        summary: 'Update user name',
        description: 'Example of updating only the user name',
        value: {
          firstName: 'Jonathan',
          lastName: 'Doe',
        },
      },
      'update-email': {
        summary: 'Update user email',
        description: 'Example of updating user email',
        value: {
          email: 'jonathan.doe@example.com',
        },
      },
      'update-status': {
        summary: 'Update user status',
        description: 'Example of updating user active status',
        value: {
          isActive: false,
        },
      },
      'full-update': {
        summary: 'Full profile update',
        description: 'Example of updating multiple fields',
        value: {
          firstName: 'Jonathan',
          lastName: 'Doe',
          email: 'jonathan.doe@newcompany.com',
          phone: '+1987654321',
          isActive: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
    example: {
      id: EXAMPLE_USER_ID,
      firstName: EXAMPLE_USER_FIRST_NAME,
      lastName: EXAMPLE_USER_LAST_NAME,
      email: EXAMPLE_USER_EMAIL,
      phone: EXAMPLE_USER_PHONE,
      dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Invalid UUID format' },
            {
              type: 'array',
              items: { type: 'string' },
              example: [
                'email must be an email',
                'phone must be a valid phone number',
              ],
            },
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: USER_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: USER_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already exists (when updating email)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: EMAIL_EXISTS_MSG,
        },
        error: { type: 'string', example: ConflictException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async updateUserById(
    @Param('id') id: UUID,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.updateById(id, updateUserDto);
  }

  /**
   * Alternative user update method using email as the primary identifier.
   *
   * Provides email-based update capability for scenarios where user ID is not
   * readily available. Particularly useful for self-service profile updates
   * and external system integrations that identify users by email.
   */
  @Patch(':email')
  @Permissions(UPDATE_USER, READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by email',
    description:
      'Updates a user by their email address. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'email',
    type: 'string',
    format: 'email',
    description: 'User email address',
    example: EXAMPLE_USER_EMAIL,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data (partial)',
    examples: {
      'update-name-by-email': {
        summary: 'Update user name by email',
        description: 'Example of updating user name using email lookup',
        value: {
          firstName: 'Jonathan',
          lastName: 'Smith',
        },
      },
      'update-phone-by-email': {
        summary: 'Update phone by email',
        description: 'Example of updating phone number using email lookup',
        value: {
          phone: '+1555123456',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
    example: {
      id: EXAMPLE_USER_ID,
      firstName: EXAMPLE_USER_FIRST_NAME,
      lastName: EXAMPLE_USER_LAST_NAME,
      email: EXAMPLE_USER_EMAIL,
      phone: EXAMPLE_USER_PHONE,
      dateOfBirth: EXAMPLE_USER_DATE_OF_BIRTH,
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format or invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Invalid email format' },
            {
              type: 'array',
              items: { type: 'string' },
              example: [
                'email must be an email',
                'phone must be a valid phone number',
              ],
            },
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: USER_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: USER_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already exists (when updating email)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: EMAIL_EXISTS_MSG,
        },
        error: { type: 'string', example: ConflictException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async updateUserByEmail(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.updateByEmail(email, updateUserDto);
  }

  /**
   * Executes bulk user deletion with atomic validation and detailed reporting.
   *
   * Administrative operation supporting multi-user deletion with fail-fast validation.
   * Ensures all target users exist before proceeding with deletions to maintain
   * data consistency and provide accurate operation feedback.
   */
  @Delete('byIds')
  @Permissions(DELETE_USER, READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete users by IDs',
    description:
      'Deletes multiple users by their unique identifiers. All users must exist or the operation will fail.',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    description: 'Comma-separated list of user IDs to delete',
    example: [EXAMPLE_USER_ID],
    required: true,
  })
  @ApiOkResponse({
    description: 'Users deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of users deleted',
          example: 2,
        },
        message: {
          type: 'string',
          description: 'Success message',
          example: '2 users deleted successfully',
        },
      },
    },
    examples: {
      'single-deletion': {
        summary: 'Single user deleted',
        value: {
          deleted: 1,
          message: '1 user deleted successfully',
        },
      },
      'multiple-deletion': {
        summary: 'Multiple users deleted',
        value: {
          deleted: 5,
          message: '5 users deleted successfully',
        },
      },
    },
  })
  @ApiNoContentResponse({
    description: 'No users to delete (empty IDs list)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format in one or more IDs',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid UUID format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'One or more users not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'One or more users not found' },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async deleteUsersByIds(
    @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
  ): Promise<{ deleted: number; message: string }> {
    const result = await this.userService.deleteByIds(ids);

    const deletedCount = result.deleted.toString();

    // Provide user-friendly response with proper pluralization
    return {
      deleted: result.deleted,
      message: `${deletedCount} ${result.deleted !== 1 ? 'users' : 'user'} deleted successfully`,
    };
  }

  /**
   * Advanced user search and filtering endpoint with pagination and field selection.
   *
   * Provides comprehensive query capabilities supporting multiple filter combinations,
   * flexible sorting options, and selective field retrieval for optimal performance.
   * Designed for administrative interfaces, reporting systems, and complex user
   * management scenarios requiring fine-grained data access control.
   */
  @Get('query/filter')
  @Permissions(READ_USER, READ_DEPARTMENT, READ_ROLE, READ_USER_ROLE)
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by ID',
  })
  @ApiQuery({
    name: 'firstNames',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by first name',
  })
  @ApiQuery({
    name: 'lastNames',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by last name',
  })
  @ApiQuery({
    name: 'emails',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by email',
  })
  @ApiQuery({
    name: 'isActive',
    type: Boolean,
    required: false,
    description: 'Filter users by active status',
  })
  @ApiQuery({
    name: 'isEmailVerified',
    type: Boolean,
    required: false,
    description: 'Filter users by email verification status',
  })
  @ApiQuery({
    name: 'departmentIds',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by departments ID',
  })
  @ApiQuery({
    name: 'departmentCountries',
    type: String,
    enum: COUNTRIES,
    isArray: true,
    required: false,
    description: 'Filter users by departments Countries',
  })
  @ApiQuery({
    name: 'includeDepartment',
    type: Boolean,
    required: false,
    description: 'Add department information to the response',
  })
  @ApiQuery({
    name: 'roleIds',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by roles ID',
  })
  @ApiQuery({
    name: 'includeRoles',
    type: Boolean,
    required: false,
    description: 'Add reoles information to the response',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter users by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter users by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: getUserSelectableFields(),
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'selectUserFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select users fields',
    enum: getUserSelectableFields(),
  })
  @ApiQuery({
    name: 'selectDepartmentFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select users department fields',
    enum: getDepartmentSelectableFields(),
  })
  @ApiQuery({
    name: 'selectRoleFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select users roles fields',
    enum: getRoleSelectableFields(),
  })
  async filterUsers(
    @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
    @Query('firstNames', new ParseArrayPipe({ optional: true }))
    firstNames: string[],
    @Query('lastNames', new ParseArrayPipe({ optional: true }))
    lastNames: string[],
    @Query('emails', new ParseArrayPipe({ optional: true })) emails: string[],
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive: boolean,
    @Query('isEmailVerified', new ParseBoolPipe({ optional: true }))
    isEmailVerified: boolean,
    @Query('departmentIds', new ParseArrayPipe({ optional: true }))
    departmentIds: UUID[],
    @Query('departmentCountries', new ParseArrayPipe({ optional: true }))
    departmentCountries: string[],
    @Query('includeDepartment', new ParseBoolPipe({ optional: true }))
    includeDepartment: boolean,
    @Query('roleIds', new ParseArrayPipe({ optional: true }))
    roleIds: UUID[],
    @Query('includeRoles', new ParseBoolPipe({ optional: true }))
    includeRoles: boolean,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
    @Query('selectUserFields', new ParseArrayPipe({ optional: true }))
    selectUserFields: string[],
    @Query('selectDepartmentFields', new ParseArrayPipe({ optional: true }))
    selectDepartmentFields: string[],
    @Query('selectRoleFields', new ParseArrayPipe({ optional: true }))
    selectRoleFields: string[],
  ): Promise<UserListResponseDto> {
    // Construct comprehensive query object from individual parameters
    return await this.queryService.getUsers({
      query: {
        ids,
        firstNames,
        lastNames,
        emails,
        isActive,
        isEmailVerified,
        departmentIds,
        departmentCountries,
        roleIds,
      },
      includeDepartment,
      includeRoles,
      pagination: {
        page,
        limit,
      },
      sort: {
        sortField,
        sortOrder,
      },
      selectUserFields,
      selectDepartmentFields,
      selectRoleFields,
    });
  }
}
