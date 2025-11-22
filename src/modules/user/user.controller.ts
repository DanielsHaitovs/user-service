import { JWTPayload } from '@/auth/interfaces/req.interface';
import { BaseController } from '@/base/base.controller';
import { ApiOkList } from '@/common/decorators/api.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/common/decorators/user.decorator';
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
  UPDATE_USER,
  USER_API_OK_RESPONSE_MSG,
  USER_FULL_BAD_REQUEST_MSG,
  USER_GENERIC_BAD_REQUEST_MSG,
  USER_MIN_OPERATION_BAD_REQUEST_MSG,
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
  ParseArrayPipe,
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
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto
> {
  constructor(
    private readonly userService: UserService,
    private readonly queryService: QueryService,
  ) {
    super();
  }

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
  override async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() createdByUser: JWTPayload,
  ): Promise<UserResponseDto> {
    const { id: createdBy } = createdByUser;
    return await this.userService.create({
      createUserDto,
      createdBy,
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
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: USER_API_OK_RESPONSE_MSG,
      type: UserListResponseDto,
      isArray: false,
    },
  })
  override async findByIds(
    @Query() query: GetUsersByIdsRequestDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

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
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
    operation: {
      summary: 'Searches for users by Eails',
      description: 'Searches for users by their unique email addresses',
    },
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: USER_API_OK_RESPONSE_MSG,
      type: UserListResponseDto,
      isArray: false,
    },
  })
  override async findBy(
    @Query() query: GetUsersByEmailsRequestDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    const { emails, ...control } = query;
    return await this.userService.findByEmails({
      emails,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      control,
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
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: USER_API_OK_RESPONSE_MSG,
      type: UserListResponseDto,
      isArray: false,
    },
  })
  override async search(
    @Param('value') value: string,
    @Query() control: UserSearchRequestDto,
  ): Promise<UserListResponseDto> {
    return await this.userService.searchFor({
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
    permissions: [UPDATE_USER, READ_USER],
    operation: {
      summary: 'Update user by ID',
      description:
        'Updates a user by their unique identifier. Only provided fields will be updated.',
    },
    body: {
      type: UpdateUserDto,
      description: 'User update data (partial)',
    },
    badRequestMessages: {
      examples: USER_GENERIC_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: 'User updated successfully',
      type: UserResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: 'Email already exists (when updating email)',
    },
  })
  override async updateById(
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
    permissions: [UPDATE_USER, READ_USER],
    operation: {
      summary: 'Update user by email',
      description:
        'Updates a user by their email address. Only provided fields will be updated.',
    },
    body: {
      type: UpdateUserDto,
      description: 'User update data (partial)',
    },
    badRequestMessages: {
      examples: USER_GENERIC_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: 'User updated successfully',
      type: UserResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: 'Email already exists (when updating email)',
    },
  })
  override async updateBy(
    @Param('email') email: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateByEmail({
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
    body: {
      type: UpdateUserDto,
      description: 'User update data (partial)',
    },
    badRequestMessages: {
      examples: USER_GENERIC_BAD_REQUEST_MSG,
    },
    okOperartion: {
      description: 'User updated successfully',
      type: UserResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: 'Email already exists (when updating email)',
    },
    noContent: {
      description: 'No users to delete (empty IDs list)',
    },
  })
  override async delete(
    @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
    @CurrentUserId() requestedByUserId: UUID,
  ): Promise<{ deleted: number; message: string }> {
    return await this.userService.deleteByIds({
      ids,
      currentUserId: requestedByUserId,
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
    okOperartion: {
      description: USER_API_OK_RESPONSE_MSG,
      type: UserListResponseDto,
      isArray: false,
    },
  })
  override async filter(
    @Query() filters: FilterUsersQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return this.queryService.getUsers({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      userId: requestedByUser.id,
    });
  }
}
