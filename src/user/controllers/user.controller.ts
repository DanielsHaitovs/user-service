import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { READ_DEPARTMENT } from '@/libConst/department.const';
import { READ_ROLE } from '@/libConst/role.const';
import {
  CREATE_USER,
  CREATE_USER_ROLE,
  EMAIL_EXISTS_MSG,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_ID,
  READ_USER,
  READ_USER_ROLE,
  USER_API_OK_RESPONSE_MSG,
  USER_MIN_OPERATION_BAD_REQUEST_MSG,
} from '@/libConst/user.const';
import { UserPipelineService } from '@/user/user.pipeline';
import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

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
    // @CurrentUser() createdByUser: JWTPayload,
  ): Promise<UserResponseDto> {
    return await this.pipelineService.create({
      createDto,
      createdById: '61a317c3-78ca-4b59-8d14-168343e2b1e6' as UUID,
    });
  }

  @Get('id/:id')
  @Version('1')
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
  async findById(
    @Param('id', ParseUUIDPipe) id: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetUserDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('email/:email')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
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
  async findByEmail(
    @Param('email') email: string,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetUserDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByEmailOrThrow(email);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserListResponseDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.pipelineService.getMany(query);
  }
}
