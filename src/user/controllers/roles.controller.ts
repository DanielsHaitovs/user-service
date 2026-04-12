import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { READ_PERMISSION } from '@/lib/const/permission.const';
import { READ_ROLE } from '@/lib/const/role.const';
import {
  CREATE_USER_ROLE,
  EXAMPLE_USER_ID,
  READ_USER,
  READ_USER_ROLE,
} from '@/lib/const/user.const';
import { UserRolePipelineService } from '@/user/role.pipeline';
import {
  AssignRolesToUserDto,
  GetUserRoleDto,
  UnassignRolesFromUserDto,
} from '@/userDto/roles.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

/**
 * REST API controller for comprehensive user role management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('User Roles')
@Controller('user/roles')
@TraceController()
export class UserRolesController {
  constructor(
    protected readonly userRolePipelineService: UserRolePipelineService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [READ_USER, READ_ROLE, CREATE_USER_ROLE, READ_USER_ROLE],
    operation: {
      summary: 'Assign roles to a user',
      description:
        'Assigns roles to a user with the provided role IDs. The user and roles must exist.',
    },
    body: {
      type: AssignRolesToUserDto,
      description: 'Data required to assign roles to a user',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'assignedById must be a valid UUID',
        'roleIds must be an array of valid UUIDs',
      ],
    },
  })
  async create(
    @Body() assignDto: AssignRolesToUserDto,
    // @CurrentUser() createdByUser: JWTPayload,
  ): Promise<void> {
    await this.userRolePipelineService.assignRolesToUser(assignDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER, READ_ROLE, CREATE_USER_ROLE, READ_USER_ROLE],
    operation: {
      summary: 'Remove roles from a user',
      description:
        'Removes roles from a user with the provided role IDs. The user and roles must exist.',
    },
    body: {
      type: UnassignRolesFromUserDto,
      description: 'Data required to remove roles from a user',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'assignedById must be a valid UUID',
        'roleIds must be an array of valid UUIDs',
      ],
    },
  })
  async remove(
    @Body() unassignDto: UnassignRolesFromUserDto,
    // @CurrentUser() createdByUser: JWTPayload,
  ): Promise<void> {
    await this.userRolePipelineService.unassignRolesFromUser(unassignDto);
  }

  @Get('userId/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER_ROLE, READ_ROLE],
    operation: {
      summary: 'Searches for user roles by user ID',
      description: 'Searches for user roles by their user unique identifiers',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description: 'Returns a list of user roles matching the provided user ID',
      type: GetUserRoleDto,
      isArray: true,
    },
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findRolesByUserId(
    @Param('userId', ParseUUIDPipe) userId: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetUserRoleDto[]> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.userRolePipelineService.getRolesOrThrow(userId);
  }

  @Get('permissions/userId/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER_ROLE, READ_ROLE, READ_PERMISSION],
    operation: {
      summary: 'Searches for user roles by user ID',
      description: 'Searches for user roles by their user unique identifiers',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description:
        'Returns a list of user roles permissions matching the provided user ID',
      type: String,
      isArray: true,
    },
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findPermissionsByUserId(
    @Param('userId', ParseUUIDPipe) userId: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<string[]> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.userRolePipelineService.getPermissionsOrThrow(userId);
  }
}
