import { Permissions } from '@/common/decorators/permission.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { EXAMPLE_ROLE_ID, READ_ROLE } from '@/lib/const/role.const';
import {
  CREATE_USER_ROLE,
  DELETE_USER_ROLE,
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_ID,
  READ_USER,
  READ_USER_ROLE,
} from '@/lib/const/user.const';
import { TraceController } from '@/lib/decorators/trace.decorator';
import { CreateUserRoleDto } from '@/user/dto/userRole.dto';
import { UserRole } from '@/user/entities/userRoles.entity';
import { UserRoleService } from '@/user/services/roles/userRole.service';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseArrayPipe,
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
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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

const MISSING_ENTITY_MSG = 'User or role(s) not found';

@ApiTags('User Roles')
@Controller('user-roles')
@TraceController()
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  /**
   * Assigns multiple roles to a user in batch with full validation.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(CREATE_USER_ROLE, READ_USER_ROLE, READ_USER, READ_ROLE)
  @ApiOperation({
    summary: 'Assign multiple roles to a user',
    description:
      'Assigns one or more roles to a user with full validation of users and roles. If one of the provided entities does not exist, an error is thrown.',
  })
  @ApiBody({
    type: CreateUserRoleDto,
    description: 'User-role assignment payload',
  })
  @ApiOkResponse({
    description: 'Roles assigned successfully',
    type: UserRole,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: BadRequestException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'userId should not be empty',
            'roleIds should not be empty',
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or role(s) not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: MISSING_ENTITY_MSG },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: UnauthorizedException.name,
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
    description: ForbiddenException.name,
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
  async create(@Body() dto: CreateUserRoleDto): Promise<UserRole[]> {
    return await this.userRoleService.create(dto);
  }

  /**
   * Finds a user-role association using user email.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions(READ_USER_ROLE, READ_USER, READ_ROLE)
  @ApiOperation({
    summary: 'Find user-role(s) by ids',
    description:
      'Returns the user-role records matching the provided user id or role id or assigned by id.',
  })
  @ApiQuery({
    name: 'userIds',
    type: String,
    isArray: true,
    format: 'uuid',
    example: [EXAMPLE_USER_ID],
  })
  @ApiQuery({
    name: 'assignedByIds',
    type: String,
    isArray: true,
    format: 'uuid',
    example: [EXAMPLE_USER_ID],
  })
  @ApiQuery({
    name: 'roleIds',
    type: String,
    isArray: true,
    format: 'uuid',
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiOkResponse({
    description: 'User-role(s) found',
    type: UserRole,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: BadRequestException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example:
            'At least one of userIds, roleIds, or assignedByIds must be provided',
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User roles not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: MISSING_ENTITY_MSG },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: UnauthorizedException.name,
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
    description: ForbiddenException.name,
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
  async findBy(
    @Query('userIds', new ParseArrayPipe({ optional: true })) userIds: UUID[],
    @Query('roleIds', new ParseArrayPipe({ optional: true })) roleIds: UUID[],
    @Query('assignedByIds', new ParseArrayPipe({ optional: true }))
    assignedByIds: UUID[],
  ): Promise<UserRole[]> {
    return await this.userRoleService.findByIds({
      userIds,
      roleIds,
      assignedByIds,
    });
  }

  /**
   * Finds a user-role association using user email.
   */
  @Get(':email')
  @Permissions(READ_USER_ROLE, READ_USER, READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @Permissions(READ_USER_ROLE)
  @ApiOperation({
    summary: 'Find user-role(s) by email',
    description:
      'Returns the user-role records matching the provided user email.',
  })
  @ApiParam({
    name: 'email',
    type: 'string',
    description: 'Email address of the user',
    example: EXAMPLE_USER_EMAIL,
  })
  @ApiOkResponse({
    description: 'User-role(s) found',
    type: UserRole,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: BadRequestException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example:
            'At least one of userIds, roleIds, or assignedByIds must be provided',
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: MISSING_ENTITY_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: MISSING_ENTITY_MSG },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: UnauthorizedException.name,
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
    description: ForbiddenException.name,
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
  async findByUserEmail(@Param('email') email: string): Promise<UserRole> {
    return await this.userRoleService.findByUserEmail(email);
  }

  /**
   * Assigns a single role to a user.
   */
  @Post('assign/:userId')
  @Permissions(CREATE_USER_ROLE, READ_USER, READ_ROLE)
  @HttpCode(HttpStatus.CREATED)
  @Permissions('user-role:assign')
  @ApiOperation({
    summary: 'Assign a role to a user',
    description: 'Assigns a specific role to a user by his UUID.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
    description: 'User ID to assign the role to',
    example: EXAMPLE_USER_ID,
  })
  @ApiQuery({
    name: 'roleId',
    type: String,
    format: 'uuid',
    isArray: true,
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiOkResponse({
    description: 'Role assigned successfully',
    type: UserRole,
  })
  @ApiBadRequestResponse({
    description: BadRequestException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'userId should not be empty',
            'roleId should not be empty',
            'roleId must be a valid UUID',
            'userId must be a valid UUID',
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: MISSING_ENTITY_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: MISSING_ENTITY_MSG },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: UnauthorizedException.name,
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
    description: ForbiddenException.name,
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
  async assignRoleToUser(
    @Query('userId') userId: UUID,
    @Query('roleIds', ParseArrayPipe) roleIds: UUID[],
  ): Promise<UserRole> {
    return await this.userRoleService.assignRolesToUser(userId, roleIds);
  }

  /**
   * Unassigns one or more roles from one or more users.
   */
  @Post('unassign')
  @Permissions(DELETE_USER_ROLE, READ_USER, READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @Permissions('user-role:unassign')
  @ApiOperation({
    summary: 'Unassign roles from users',
    description:
      'Removes roles from users. Both userIds and roleIds must be provided.',
  })
  @ApiQuery({
    name: 'userIds',
    type: 'array',
    isArray: true,
    required: true,
    example: [EXAMPLE_USER_ID],
  })
  @ApiQuery({
    name: 'roleIds',
    type: 'array',
    isArray: true,
    required: true,
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiOkResponse({
    description: 'Roles unassigned successfully',
    schema: {
      type: 'object',
      properties: {
        unassigned: { type: 'boolean', example: true },
      },
    },
  })
  @ApiBadRequestResponse({
    description: BadRequestException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'userId should not be empty',
            'roleId should not be empty',
            'roleId must be a valid UUID',
            'userId must be a valid UUID',
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: MISSING_ENTITY_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: MISSING_ENTITY_MSG },
        error: { type: 'string', example: EntityNotFoundError.name },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: UnauthorizedException.name,
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
    description: ForbiddenException.name,
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
  async unassignRoleFromUser(
    @Query('userIds') userIds: UUID[],
    @Query('roleIds') roleIds: UUID[],
  ): Promise<{ unassigned: boolean }> {
    return await this.userRoleService.unassignRoleFromUser(userIds, roleIds);
  }
}
