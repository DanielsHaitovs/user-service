import { JWTPayload } from '@/auth/interfaces/req.interface';
import { BaseController } from '@/base/base.controller';
import { DeleteResponseDto } from '@/base/dto/response.dto';
import { ApiOkList } from '@/common/decorators/api.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/common/decorators/user.decorator';
import { ParseUUIDArrayPipe } from '@/common/pipes/uuidArray.pipe';
import { READ_DEPARTMENT } from '@/lib/const/department.const';
import { READ_ROLE } from '@/lib/const/role.const';
import {
  CREATE_USER,
  CREATE_USER_ROLE,
  DELETE_USER,
  EMAIL_EXISTS_MSG,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_ID,
  READ_USER,
  READ_USER_ROLE,
  USER_API_OK_RESPONSE_MSG,
  USER_FULL_BAD_REQUEST_MSG,
  USER_GENERIC_BAD_REQUEST_MSG,
  USER_MIN_API_OK_LIST,
  USER_UPDATE_API_OK_LIST,
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
import { QueryService } from '@/user/services/query.service';
import { UserService } from '@/user/services/user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

/**
 * REST API controller for comprehensive user management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users')
@Controller('user')
@TraceController()
export class UserController extends BaseController<
  CreateUserDto,
  GetUsersByIdsRequestDto,
  UserSearchRequestDto,
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto
> {
  constructor(
    protected readonly userService: UserService,
    protected readonly queryService: QueryService,
  ) {
    super();
  }

  /**
   * Creates a new user account.
   *
   * Validates input data, checks for email uniqueness, and associates
   * the creator's information. Returns the created user entity.
   * @param createDto - Data for the new user
   * @param createdByUser - JWT payload of the user creating the account
   * @returns The created user entity
   * @throws ConflictException if the email already exists
   * @throws BadRequestException for validation errors
   * @throws EntityNotFoundError if the creator user does not exist
   * @throws EntityNotFoundError if the provided department or role IDs do not exist
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [
      CREATE_USER,
      READ_USER,
      READ_DEPARTMENT,
      READ_ROLE,
      CREATE_USER_ROLE,
      READ_USER_ROLE,
    ],
    operation: {
      summary: 'Create a new user',
      description:
        'Creates a new user account with the provided information. Email must be unique.',
    },
    body: {
      type: CreateUserDto,
      description: 'User creation data',
    },
    createdResponse: {
      description: 'User successfully created',
      type: UserResponseDto,
    },
    conflictMessage: {
      description: EMAIL_EXISTS_MSG,
    },
    badRequestMessages: {
      examples: [
        'firstName should not be empty',
        'email must be an email',
        'password must be longer than or equal to 8 characters',
      ],
    },
  })
  async create(
    @Body() createDto: CreateUserDto,
    @CurrentUser() createdByUser: JWTPayload,
  ): Promise<UserResponseDto> {
    return await this.userService.create({
      createDto,
      createdBy: createdByUser.id,
    });
  }

  @Get('attribute/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
    operation: {
      summary: 'Searches for users by ID',
      description: 'Searches for users by their unique identifiers',
    },
    ...USER_MIN_API_OK_LIST,
  })
  async findByIds(
    @Query() filters: GetUsersByIdsRequestDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return await this.userService.findByIds({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    });
  }

  @Get('attribute/emails')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
    operation: {
      summary: 'Searches for users by Eails',
      description: 'Searches for users by their unique email addresses',
    },
    ...USER_MIN_API_OK_LIST,
  })
  async findBy(
    @Query() filters: GetUsersByEmailsRequestDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return await this.userService.findByEmails({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    });
  }

  @Get('search/:value')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'value',
    type: String,
    description: 'Search value for users by firstname, lastname, email or ID',
    example: EXAMPLE_USER_EMAIL.slice(0, 7),
  })
  @ApiOkList({
    permissions: [READ_USER],
    operation: {
      summary: 'Search for users',
      description:
        'Will search by match key fields between first name, last name, email or ID',
    },
    ...USER_MIN_API_OK_LIST,
  })
  async search(
    @Param('value') value: string,
    @Query() control: UserSearchRequestDto,
  ): Promise<UserListResponseDto> {
    return await this.userService.search({
      value,
      control,
    });
  }

  @Patch('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User unique identifier',
    example: EXAMPLE_USER_ID,
  })
  @ApiOkList({
    operation: {
      summary: 'Update user by ID',
      description:
        'Updates a user by their unique identifier. Only provided fields will be updated.',
    },
    ...USER_UPDATE_API_OK_LIST,
  })
  async updateById(
    @Param('id') id: UUID,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateById({ id, updateUserDto: updateDto });
  }

  @Patch('email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'email',
    type: String,
    format: 'email',
    description: 'User email address',
    example: EXAMPLE_USER_EMAIL,
  })
  @ApiOkList({
    operation: {
      summary: 'Update user by email',
      description:
        'Updates a user by their email address. Only provided fields will be updated.',
    },
    ...USER_UPDATE_API_OK_LIST,
  })
  async updateBy(
    @Param('email') email: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateBy({
      email,
      updateUserDto: updateDto,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    description: 'Comma-separated list of user IDs to delete',
    example: [EXAMPLE_USER_ID],
    required: true,
  })
  @ApiOkList({
    permissions: [DELETE_USER, READ_USER],
    operation: {
      summary: 'Delete users by IDs',
      description:
        'Deletes multiple users by their unique identifiers. All users must exist or the operation will fail.',
    },
    badRequestMessages: {
      examples: USER_GENERIC_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Users deleted successfully',
      type: DeleteResponseDto,
      isArray: false,
    },
    noContent: {
      description: 'No users to delete (empty IDs list)',
    },
  })
  async delete(
    @Query('ids', ParseUUIDArrayPipe) ids: UUID[],
    @CurrentUserId() requestedByUserId: UUID,
  ): Promise<DeleteResponseDto> {
    return await this.userService.delete({
      ids,
      requestedByUserId,
    });
  }

  @Get('query')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
    operation: {
      summary: 'Filter and retrieve users',
      description:
        'Filters users based on various criteria and returns a paginated list of users.',
    },
    badRequestMessages: {
      examples: USER_FULL_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: USER_API_OK_RESPONSE_MSG,
      type: UserListResponseDto,
      isArray: false,
    },
  })
  async filter(
    @Query() filters: FilterUsersQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const {
      id,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    } = this.extractAccess(requestedByUser);

    return this.queryService.getUsers({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      requestedByUserId: id,
    });
  }
}
