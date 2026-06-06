import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import {
  EXAMPLE_ROLE_ID,
  ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
  ROLE_NOT_FOUND_MSG,
} from '@/libConst/role.const';
import { RolePipelineService } from '@/role/role.pipeline';
import { PermissionsToRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import {
  ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
  READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
  UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
} from '@/system/const/role.const';
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
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Roles Permissions')
@Controller({
  path: 'role/permissions',
  version: ['1'],
})
@TraceController()
@ApiBearerAuth('JWT-auth')
export class RolePermissionsController {
  constructor(protected readonly pipelineService: RolePipelineService) {}

  @Post('assign')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Assign permissions to a role',
      description: 'Assigns a set of permissions to a specified role.',
    },
    body: {
      description: 'A DTO containing the role ID and the permissions to assign',
      type: PermissionsToRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: [
        'permission codes must be an array of strings',
        'Each permission code must be a non-empty string',
        'Each roleId must be a valid UUIDv4',
      ],
    },
    notFound: {
      description:
        'Role with the specified ID was not found or Permission code(s) not found',
    },
  })
  async assign(
    @Body()
    assignDto: PermissionsToRoleDto,
  ): Promise<void> {
    await this.pipelineService.assignPermissionsToRole(assignDto);
  }

  @Delete('unAssign')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Unassign permissions to a role',
      description: 'Unassigns a set of permissions from a specified role.',
    },
    body: {
      description:
        'A DTO containing the role ID and the permissions to unassign',
      type: PermissionsToRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: [
        'permission codes must be an array of strings',
        'Each permission code must be a non-empty string',
        'Each roleId must be a valid UUIDv4',
      ],
    },
    notFound: {
      description:
        'Role with the specified ID was not found or Permission code(s) not found',
    },
  })
  async unAssign(
    @Body()
    unAssignDto: PermissionsToRoleDto,
  ): Promise<void> {
    await this.pipelineService.unassignPermissionsFromRole(unAssignDto);
  }

  @Get(':roleId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get role by ID with permissions',
      description:
        'Retrieves a role by its unique ID along with its permissions.',
    },
    okOperation: {
      description: 'Role found and returned successfully',
      type: RoleResponseDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'roleId',
    type: String,
    description: 'Unique ID of the role to search for',
    example: EXAMPLE_ROLE_ID,
  })
  async findByIdWithPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: UUID,
  ): Promise<RoleResponseDto> {
    return await this.pipelineService.getPermissionsOrThrow(roleId);
  }
}
