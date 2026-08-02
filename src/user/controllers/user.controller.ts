import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/baseHelper/permissions';
import { FetchFullUserPipe, FullUser } from '@/common/pipes/full-user.pipe';
import { FetchedUser, FetchUserPipe } from '@/common/pipes/user.pipe';
import {
  ASSIGN_USER_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/commonConst/role.const';
import {
  ASSIGN_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/commonConst/store.const';
import { EXAMPLE_USER_EMAIL, EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { Idempotent } from '@/commonDecorators/idempotent.decorator';
import {
  ClientMetadata,
  GetClientMetadata,
} from '@/commonDecorators/meta.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/commonDecorators/user.decorator';
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user account with the provided information. Email must be unique.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
    required: true,
  })
  @ApiOkResponse({
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @Idempotent()
  async create(
    @Body() createDto: CreateUserDto,
    @CurrentUser() requestedByUser: JwtPayload,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<UserResponseDto> {
    const {
      canAssignUserToRoles,
      canAssignUserToStore,
      id: createdById,
    } = extractAccess(requestedByUser);

    if (!canAssignUserToRoles) {
      createDto.roleIds = [];
    }

    if (!canAssignUserToStore) {
      createDto.storeIds = [];
    }

    return await this.pipelineService.create({
      createDto,
      createdById,
      metadata,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves a user by their unique identifier. The ID must be a valid UUID.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format',
    examples: {
      'Invalid UUID': {
        summary: 'User ID is not a valid UUID',
        value: {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User found and returned successfully',
    type: GetUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found with the provided ID',
    examples: {
      'User Not Found': {
        summary: 'No user exists with the specified ID',
        value: {
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findById(@Param('id', ParseUUIDPipe) id: UUID): Promise<GetUserDto> {
    return await this.pipelineService.getByIdOrThrow({ id });
  }

  @Get('email/:email')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Get user by email',
    description:
      'Retrieves a user by their email address. The email must be unique and properly formatted.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    examples: {
      'Invalid Email': {
        summary: 'Email is not in a valid format',
        value: {
          statusCode: 400,
          message: 'Validation failed (email must be a valid email)',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User found and returned successfully',
    type: GetUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found with the provided email',
    examples: {
      'User Not Found': {
        summary: 'No user exists with the specified email',
        value: {
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        },
      },
    },
  })
  @ApiParam({
    name: 'email',
    type: String,
    description: 'Email address of the user to search for',
    example: EXAMPLE_USER_EMAIL,
  })
  async findByEmail(@Param('email') email: string): Promise<GetUserDto> {
    return await this.pipelineService.getByEmailOrThrow({ email });
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Find users with advanced filtering',
    description:
      'Retrieves a list of users based on provided query parameters. Supports filtering by various fields, pagination, and sorting.',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
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
  @ApiBody({
    type: UpdateUserDto,
    description: 'Data for updating the user',
    required: true,
  })
  @ApiOperation({
    summary: 'Update an existing user',
    description:
      'Updates the details of an existing user. User is identified by their unique ID.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format or validation errors',
    examples: {
      'Invalid UUID': {
        summary: 'User ID is not a valid UUID',
        value: {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
        },
      },
      'Validation Error': {
        summary: 'Input data failed validation',
        value: {
          statusCode: 400,
          message: [
            'name must be a string',
            'email must be a valid email address',
          ],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already exists for another user',
    examples: {
      'Email Conflict': {
        summary: 'The provided email is already in use by another user',
        value: {
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found with the provided ID',
    examples: {
      'User Not Found': {
        summary: 'No user exists with the specified ID',
        value: {
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    format: 'uuid',
  })
  @Idempotent()
  async update(
    @Param('id', FetchUserPipe) user: FetchedUser,
    @Body() data: UpdateUserDto,
    @CurrentUserId() requestedById: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<boolean> {
    return await this.pipelineService.update({
      user,
      data,
      requestedById,
      metadata,
    });
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
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Deletes a user by their unique identifier. Also handles unassign from related roles and stores based on permissions.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format',
    examples: {
      'Invalid UUID': {
        summary: 'User ID is not a valid UUID',
        value: {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found with the provided ID',
    examples: {
      'User Not Found': {
        summary: 'No user exists with the specified ID',
        value: {
          statusCode: 404,
          message: 'User not found',
          error: 'Not Found',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    format: 'uuid',
  })
  @Idempotent()
  async delete(
    @CurrentUser() requestedByUser: JwtPayload,
    @Param('id', FetchFullUserPipe) data: FullUser,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    const {
      canReadRoles,
      canReadUserRoles,
      canUnassignUserFromRoles,
      canReadStore,
      canReadUserStore,
      canUnassignUserFromStore,
      id,
    } = extractAccess(requestedByUser);

    const canRemoveFromRelatedRoles =
      canReadRoles && canReadUserRoles && canUnassignUserFromRoles;
    const canRemoveFromRelatedStores =
      canReadStore && canReadUserStore && canUnassignUserFromStore;

    await this.pipelineService.delete({
      data,
      requestedById: id,
      metadata,
      canRemoveFromRelatedRoles,
      canRemoveFromRelatedStores,
    });
  }
}
