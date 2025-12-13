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

    filters.ids = [
      '0155036c-184e-426b-9661-57cdd0bbb6c2',
      '4dec742f-cf6a-4567-87b5-7065ecb21ccf',
      'a4f8b27f-f5ce-4773-bf43-117239a2ffa4',
      '82326b89-fb30-43ea-8d97-056d66b02844',
      'acf8f6d2-9ffd-447c-8864-9d230a9ebad9',
      '5eaaff0f-2de9-4bb0-b714-6c3db3afbba8',
      'b9acea25-f3e2-41c3-a0e6-9b5a822fb799',
      '15990b91-0e0a-435e-8af4-144e24c52ffe',
      '54e5eff8-107e-4938-a642-98e3edea86ca',
      '91f47540-5dc5-4424-bc00-25968fe38373',
      '8f9066fe-e269-4e89-847f-2acc06e1bef0',
      '9471a736-58f6-4fe6-b719-78ef587b51ee',
      'bc3b13ae-2837-4c45-9360-9d5cba275fbb',
      'a37cb69b-9c9b-476b-b42c-05dd55d95f94',
      '68950387-7679-4d27-90ad-d5ccb28370b2',
      '640c964a-401c-4bc4-b03c-e992dfecd27b',
      '578a4ed5-2f3b-40f0-b341-033f3e2a09d9',
      '7c8e7492-515a-4754-9a1a-87173ccc6da9',
      '95a98cc0-d2cf-4ea3-8225-9f69190600fb',
      '5eec2c3d-db17-421c-a37a-2fe5746403f4',
      'b2fa745a-e99f-4dce-8c56-89d27cc9098e',
      'c6413394-af1c-4ffe-9ecf-e5d5c97214fc',
      'c90cc1ea-2c6d-4710-b311-41f2be133045',
      '9ff62228-f375-4aae-bb02-db489160a88c',
      '9b7bcedd-dfe0-4ec6-b60b-aa761f26fc86',
      'd719adc2-1700-4b16-b002-cb11a7b8e111',
      '126cf6d1-85f0-44af-9d14-19cb487e5853',
      'fb379562-b26b-4505-8bc5-b8adf5e7214e',
      'ac981ddf-5aa7-4e64-848e-9eeb2edb802b',
      '95d65bc6-d532-4718-aed2-64728ba23b6d',
      '365c9a2a-7416-4567-b977-b61635ceb1a5',
      'a2efce0f-0476-48b4-b93f-1fcec31b830c',
      '68ea4af3-c084-4e58-a664-4b0073de6f13',
      '64711f62-c9ae-4d32-a750-20e92b59e6ae',
      '16f96bcd-2425-459b-8fb7-20a98dc52c32',
      '2a5e4800-fe63-4eae-b2b0-34ba2ee1a5b2',
      'b5cf5957-1997-4eeb-87ce-b5b1d9f127df',
      'dc70ce9f-13a8-47ad-bbb6-4c3e42553fcf',
      '439fc314-8667-40e1-85c5-4c1c38e68ec1',
      'b7a87055-4798-4b14-8832-fc74970cc0d8',
      '8bb4f78f-fae7-4192-9d83-e2eb263586d3',
      'a2b83df8-65a8-482b-8cb0-c11735ed8c8c',
      '3ebb5685-b804-455c-8d29-c8a228502b07',
      '48d9bd82-4447-4814-a0cc-146939f18faf',
    ];
    return this.queryService.getUsers({
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
      requestedByUserId: id,
    });
  }
}
