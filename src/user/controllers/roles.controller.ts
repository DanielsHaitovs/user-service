import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUserId } from '@/commonDecorators/user.decorator';
import {
  ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
  READ_USER_ROLE_ENDPOINT_PERMISSION,
  UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { UserRolePipelineService } from '@/user/role.pipeline';
import {
  AssignRolesToUserDto,
  UnassignRolesFromUserDto,
  UserRolesListResponseDto,
  UserRolesQueryRequest,
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
  Query,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

/**
 * REST API controller for comprehensive user role management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users Roles')
@Controller({
  path: 'user/roles',
  version: ['1'],
})
@TraceController()
@ApiBearerAuth('JWT-auth')
export class UserRolesController {
  constructor(
    protected readonly userRolePipelineService: UserRolePipelineService,
  ) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
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
  async assignRole(
    @Body() assignDto: AssignRolesToUserDto,
    @CurrentUserId() assignedById: UUID,
  ): Promise<void> {
    await this.userRolePipelineService.assignRolesToUser({
      data: assignDto,
      assignedById,
    });
  }

  @Delete()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
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
  async remove(@Body() unassignDto: UnassignRolesFromUserDto): Promise<void> {
    await this.userRolePipelineService.unassignRolesFromUser(unassignDto);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for user roles by user ID',
      description: 'Searches for user roles by their user unique identifiers',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description: 'Returns a list of user roles matching the provided user ID',
      type: UserRolesListResponseDto,
      isArray: false,
    },
  })
  async findRolesByUserId(
    @Query() query: UserRolesQueryRequest,
  ): Promise<UserRolesListResponseDto> {
    return await this.userRolePipelineService.getRoles(query);
  }

  @Get('permissions/:userId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for user permissions by user ID',
      description: 'Searches for user permissions by user unique identifiers',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description:
        'Returns a list of user permissions matching the provided user ID',
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
  ): Promise<string[]> {
    return await this.userRolePipelineService.getPermissionsOrThrow(userId);
  }
}
