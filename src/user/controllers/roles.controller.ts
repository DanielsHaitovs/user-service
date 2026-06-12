import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Assign roles to a user',
    description:
      'Assigns roles to a user with the provided role IDs. The user and roles must exist.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid input data for assigning roles to a user',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-userId-uuid',
        },
      },
      'Invalid roleIds format': {
        summary: 'Invalid roleIds format',
        value: {
          roleIds: ['12345-invalid-roleId-uuid'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or one or more roles not found',
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
  @ApiOperation({
    summary: 'Remove roles from a user',
    description:
      'Removes roles from a user with the provided role IDs. The user and roles must exist.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid input data for removing roles from a user',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-uuid',
        },
      },
      'Invalid roleIds format': {
        summary: 'Invalid roleIds format',
        value: {
          roleIds: ['12345-invalid-uuid'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or one or more roles not found',
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
  @ApiOperation({
    summary: 'Searches for user roles by user ID',
    description: 'Searches for user roles by their user unique identifiers',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters for searching user roles',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-uuid',
        },
      },
      'Missing userId': {
        summary: 'Missing required userId parameter',
        value: {},
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns a list of user roles matching the provided user ID',
    type: UserRolesListResponseDto,
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
  @ApiOperation({
    summary: 'Searches for user permissions by user ID',
    description: 'Searches for user permissions by user unique identifiers',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters for searching user permissions',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-uuid',
        },
      },
      'Missing userId': {
        summary: 'Missing required userId parameter',
        value: {},
      },
    },
  })
  @ApiOkResponse({
    description:
      'Returns a list of user permissions matching the provided user ID',
    type: String,
    isArray: true,
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
    return await this.userRolePipelineService.getPermissions(userId);
  }
}
