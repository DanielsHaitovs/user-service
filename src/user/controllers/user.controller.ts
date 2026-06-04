import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/base/helper/permissions';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser } from '@/commonDecorators/user.decorator';
import {
  ASSIGN_USER_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/lib/const/role.const';
import {
  ASSIGN_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/lib/const/store.const';
import {
  EMAIL_EXISTS_MSG,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_ID,
  USER_API_OK_RESPONSE_MSG,
  USER_MIN_OPERATION_BAD_REQUEST_MSG,
} from '@/libConst/user.const';
import {
  CREATE_USER_ENDPOINT_PERMISSION,
  DELETE_USER_ENDPOINT_PERMISSION,
  READ_USER_ENDPOINT_PERMISSION,
  UPDATE_USER_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { UserPipelineService } from '@/user/user.pipeline';
import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

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
@Controller({
  path: 'user',
  version: ['1'],
})
@TraceController()
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(protected readonly pipelineService: UserPipelineService) {}

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
  @Version('1')
  @Permissions({
    required: CREATE_USER_ENDPOINT_PERMISSION,
    loose: [
      ASSIGN_USER_ROLE,
      READ_ROLE,
      READ_USER_ROLE,
      ASSIGN_USER_STORE,
      READ_STORE,
      READ_USER_STORE,
    ],
  })
  @ApiOkList({
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
    @CurrentUser() requestedByUser: JwtPayload,
  ): Promise<UserResponseDto> {
    const {
      canAssignUserToRoles,
      canReadRoles,
      canReadUserRoles,
      canAssignUserToStore,
      canReadStore,
      canReadUserStore,
      id: createdById,
    } = extractAccess(requestedByUser);

    if (!canAssignUserToRoles || !canReadRoles || !canReadUserRoles) {
      createDto.roleIds = [];
    }

    if (!canAssignUserToStore || !canReadStore || !canReadUserStore) {
      createDto.storeIds = [];
    }

    return await this.pipelineService.create({
      createDto,
      createdById,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for users by ID',
      description: 'Searches for users by their unique identifiers',
    },
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: USER_API_OK_RESPONSE_MSG,
      type: GetUserDto,
      isArray: false,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findById(@Param('id', ParseUUIDPipe) id: UUID): Promise<GetUserDto> {
    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('email/:email')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for users by email',
      description: 'Searches for users by their email addresses',
    },
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: USER_API_OK_RESPONSE_MSG,
      type: GetUserDto,
      isArray: false,
    },
  })
  @ApiParam({
    name: 'email',
    type: String,
    description: 'Email address of the user to search for',
    example: EXAMPLE_USER_EMAIL,
  })
  async findByEmail(@Param('email') email: string): Promise<GetUserDto> {
    return await this.pipelineService.getByEmailOrThrow(email);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for users by various parameters',
      description:
        'Searches for users by their unique identifiers, names, emails, or other attributes. If no query parameters are provided, returns all users.',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description:
        'Returns a list of users matching the provided query parameters',
      type: UserListResponseDto,
      isArray: false,
    },
  })
  async findUsers(
    @Query() query: UserQueryRequest,
  ): Promise<UserListResponseDto> {
    return await this.pipelineService.getMany(query);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UPDATE_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Updates a user',
      description:
        'Updates the details of an existing user. User is identified by their unique ID.',
    },
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    format: 'uuid',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() data: UpdateUserDto,
  ): Promise<boolean> {
    return await this.pipelineService.update({ id, data });
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: DELETE_USER_ENDPOINT_PERMISSION,
    loose: [
      READ_ROLE,
      READ_USER_ROLE,
      UNASSIGN_USER_ROLE,
      READ_STORE,
      READ_USER_STORE,
      UNASSIGN_USER_STORE,
    ],
  })
  @ApiOkList({
    operation: {
      summary: 'Deletes a user',
      description:
        'Deletes an existing user from the system. User is identified by their unique ID.',
    },
    badRequestMessages: {
      examples: USER_MIN_OPERATION_BAD_REQUEST_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    format: 'uuid',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentUser() requestedByUser: JwtPayload,
  ): Promise<void> {
    const {
      canReadRoles,
      canReadUserRoles,
      canUnassignUserFromRoles,
      canReadStore,
      canReadUserStore,
      canUnassignUserFromStore,
    } = extractAccess(requestedByUser);

    const canRemoveFromRelatedRoles =
      canReadRoles && canReadUserRoles && canUnassignUserFromRoles;
    const canRemoveFromRelatedStores =
      canReadStore && canReadUserStore && canUnassignUserFromStore;
    await this.pipelineService.delete({
      id,
      canRemoveFromRelatedRoles,
      canRemoveFromRelatedStores,
    });
  }
}
