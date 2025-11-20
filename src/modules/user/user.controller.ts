import { hasPermissions } from '@/auth/helper/permission.helper';
import { Permissions } from '@/common/decorators/permission.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import {
  CurrentUserId,
  CurrentUserPermissions,
} from '@/common/decorators/user.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { COUNTRIES } from '@/lib/const/countries.const';
import { READ_DEPARTMENT } from '@/lib/const/department.const';
import { READ_PERMISSION, READ_ROLE } from '@/lib/const/role.const';
import {
  BAD_REQUEST_DESCRIPTION,
  DELETE_BAD_REQUEST_MSG,
  INTERNAL_SERVER_ERROR_DOCUMENTATION,
} from '@/lib/const/system.const';
import {
  CREATE_USER,
  CREATE_USER_ROLE,
  DELETE_USER,
  EMAIL_EXISTS_MSG,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
  EXAMPLE_USER_ID,
  EXAMPLE_USER_PASSWORD_RESET_TOKEN,
  READ_USER,
  READ_USER_ROLE,
  UPDATE_USER,
  USER_API_OK_RESPONSE_MSG,
  USER_CONFLICT_DOCUMENTATION,
  USER_FULL_BAD_REQUEST_MSG,
  USER_MIN_BAD_REQUEST_MSG,
  USER_NOT_FOUND_DOCUMENTATION,
} from '@/lib/const/user.const';
import {
  FilterUsersQueryDto,
  GetUsersByEmailsRequestDto,
  GetUsersByIdsRequestDto,
  UserSearchRequestDto,
} from '@/user/dto/query.dto';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { QueryService } from '@/user/services/query.service';
import { UserService } from '@/user/services/user.service';
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
  Param,
  ParseArrayPipe,
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
@Controller('user')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly queryService: QueryService,
  ) {}

  /**
   * Creates a new user account with comprehensive validation and conflict detection.
   *
   * Implements user registration workflow with email uniqueness enforcement.
   * Supports both minimal and full profile creation scenarios through flexible
   * DTO validation. Generates secure passwords and initialization tokens.
   */
  @Post()
  @Permissions(
    CREATE_USER,
    READ_USER,
    READ_DEPARTMENT,
    READ_ROLE,
    CREATE_USER_ROLE,
    READ_USER_ROLE,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user account with the provided information. Email must be unique.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: BAD_REQUEST_DESCRIPTION,
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

  @Get('attribute/ids')
  @Permissions(READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Searches for users by ID',
    description: 'Searches for users by their unique identifiers',
  })
  @ApiOkResponse({
    description: USER_API_OK_RESPONSE_MSG,
    type: UserListResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: BAD_REQUEST_DESCRIPTION,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: USER_MIN_BAD_REQUEST_MSG,
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async getUsersByIds(
    @Query() query: GetUsersByIdsRequestDto,
    @CurrentUserPermissions() userPermissions: string[],
  ): Promise<UserListResponseDto> {
    const hasAccessToRoles = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_ROLE],
    });

    const hasAccessToPermissions = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_PERMISSION],
    });

    const hasAccessToDepartments = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_DEPARTMENT],
    });

    const { ids, ...control } = query;
    return await this.userService.findByIds({
      ids,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      control,
    });
  }

  @Get('attribute/emails')
  @Permissions(READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Searches for users email',
  })
  @ApiOkResponse({
    description: USER_API_OK_RESPONSE_MSG,
    type: UserListResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: BAD_REQUEST_DESCRIPTION,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: USER_MIN_BAD_REQUEST_MSG,
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async getUsersByEmails(
    @Query() query: GetUsersByEmailsRequestDto,
    @CurrentUserPermissions() userPermissions: string[],
  ): Promise<UserListResponseDto> {
    const hasAccessToRoles = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_ROLE],
    });

    const hasAccessToPermissions = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_PERMISSION],
    });

    const hasAccessToDepartments = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_DEPARTMENT],
    });

    const { emails, ...control } = query;

    return await this.userService.findByEmails({
      emails,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      control,
    });
  }

  @Get('search')
  @Permissions(READ_USER)
  @ApiParam({
    name: 'value',
    type: String,
    description: 'Search value for users by firstname, lastname, email or ID',
    example: EXAMPLE_USER_EMAIL.slice(0, 7),
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search for users',
    description: 'Searches for users by firstname, lastname, email or ID',
  })
  @ApiOkResponse({
    description: USER_API_OK_RESPONSE_MSG,
    type: UserListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BAD_REQUEST_DESCRIPTION,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: USER_MIN_BAD_REQUEST_MSG,
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async searchForUsers(
    @Param('value') value: string,
    @Query() control: UserSearchRequestDto,
  ): Promise<UserListResponseDto> {
    return await this.userService.searchFor({
      value,
      control,
    });
  }

  /**
   * Performs partial user profile updates with conflict detection and validation.
   *
   * Implements PATCH semantics for selective field updates without requiring
   * complete profile data. Maintains email uniqueness constraints and supports
   * administrative status changes alongside user profile modifications.
   */
  @Patch('id/:id')
  @Permissions(UPDATE_USER, READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by ID',
    description:
      'Updates a user by their unique identifier. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    type: String,
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
          country: COUNTRIES.AE,
          firstName: 'Jonathan',
          lastName: 'Doe',
          email: 'jonathan.doe@example.com',
          password: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
          phone: '+1987654321',
          dateOfBirth: new Date('1990-01-01'),
          isActive: true,
          isEmailVerified: true,
          passwordResetExpires: new Date('1990-01-01'),
          emailVerificationToken: EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
          passwordResetToken: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
          createdAt: new Date('2023-01-01T12:00:00.000Z'),
          updatedAt: new Date('2023-01-02T12:00:00.000Z'),
          isTwoFactorEnabled: true,
          twoFactorSecret: 'string',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
              example: [
                'country must be a valid ISO country code',
                'firstName should not be empty',
                'lastName should not be empty',
                'email must be an email',
                'password must be a string',
                'phone must be a valid phone number',
                'dateOfBirth must be a valid ISO 8601 date string',
                'isActive must be a boolean value',
                'isEmailVerified must be a boolean value',
                'passwordResetExpires must be a valid ISO 8601 date string',
                'emailVerificationToken must be a string',
                'passwordResetToken must be a string',
                'createdAt must be a valid ISO 8601 date string',
                'updatedAt must be a valid ISO 8601 date string',
                'isTwoFactorEnabled must be a boolean value',
                'twoFactorSecret must be a string',
              ],
            },
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse(USER_NOT_FOUND_DOCUMENTATION)
  @ApiConflictResponse(USER_CONFLICT_DOCUMENTATION)
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async updateUserById(
    @Param('id') id: UUID,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.updateById({ id, updateUserDto });
  }

  /**
   * Alternative user update method using email as the primary identifier.
   *
   * Provides email-based update capability for scenarios where user ID is not
   * readily available. Particularly useful for self-service profile updates
   * and external system integrations that identify users by email.
   */
  @Patch('email/:email')
  @Permissions(UPDATE_USER, READ_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by email',
    description:
      'Updates a user by their email address. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'email',
    type: String,
    format: 'email',
    description: 'User email address',
    example: EXAMPLE_USER_EMAIL,
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
          country: COUNTRIES.AE,
          firstName: 'Jonathan',
          lastName: 'Doe',
          email: 'jonathan.doe@example.com',
          password: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
          phone: '+1987654321',
          dateOfBirth: new Date('1990-01-01'),
          isActive: true,
          isEmailVerified: true,
          passwordResetExpires: new Date('1990-01-01'),
          emailVerificationToken: EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
          passwordResetToken: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
          createdAt: new Date('2023-01-01T12:00:00.000Z'),
          updatedAt: new Date('2023-01-02T12:00:00.000Z'),
          isTwoFactorEnabled: true,
          twoFactorSecret: 'string',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
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
  @ApiNotFoundResponse(USER_NOT_FOUND_DOCUMENTATION)
  @ApiConflictResponse(USER_CONFLICT_DOCUMENTATION)
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async updateUserByEmail(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.updateByEmail({ email, updateUserDto });
  }

  /**
   * Executes bulk user deletion with atomic validation and detailed reporting.
   *
   * Administrative operation supporting multi-user deletion with fail-fast validation.
   * Ensures all target users exist before proceeding with deletions to maintain
   * data consistency and provide accurate operation feedback.
   */
  @Delete()
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
    example: {
      deleted: 3,
      message: '3 users have been deleted successfully',
    },
  })
  @ApiNoContentResponse({
    description: 'No users to delete (empty IDs list)',
  })
  @ApiBadRequestResponse(DELETE_BAD_REQUEST_MSG)
  @ApiNotFoundResponse({
    description: 'Users not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          oneOf: [
            { type: 'string', example: 'Users with Ids ... not found' },
            { type: 'string', example: 'Roles with Ids ... not found' },
          ],
        },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async deleteUsersByIds(
    @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
    @CurrentUserId() currentUserId: UUID,
  ): Promise<{ deleted: number; message: string }> {
    return await this.userService.deleteByIds({ ids, currentUserId });
  }

  /**
   * Advanced user search and filtering endpoint with pagination and field selection.
   *
   * Provides comprehensive query capabilities supporting multiple filter combinations,
   * flexible sorting options, and selective field retrieval for optimal performance.
   * Designed for administrative interfaces, reporting systems, and complex user
   * management scenarios requiring fine-grained data access control.
   */
  @Get('query')
  @Permissions(READ_USER)
  @ApiOperation({
    summary: 'Filter and retrieve users',
    description:
      'Filters users based on various criteria and returns a paginated list of users.',
  })
  @ApiOkResponse({
    description: USER_API_OK_RESPONSE_MSG,
    type: UserListResponseDto,
  })
  @ApiBadRequestResponse({
    description: BAD_REQUEST_DESCRIPTION,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: USER_FULL_BAD_REQUEST_MSG,
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse(USER_NOT_FOUND_DOCUMENTATION)
  @ApiInternalServerErrorResponse(INTERNAL_SERVER_ERROR_DOCUMENTATION)
  async filterUsers(
    @Query() filters: FilterUsersQueryDto,
    @CurrentUserPermissions() userPermissions: string[],
  ): Promise<UserListResponseDto> {
    const hasAccessToRoles = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_ROLE],
    });

    const hasAccessToPermissions = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_PERMISSION],
    });

    const hasAccessToDepartments = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_DEPARTMENT],
    });

    return this.queryService.getUsers({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    });
  }
}
