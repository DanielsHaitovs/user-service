import { EXAMPLE_ROLE_ID } from '@/commonConst/role.const';
import { Idempotent } from '@/commonDecorators/idempotent.decorator';
import {
  ClientMetadata,
  GetClientMetadata,
} from '@/commonDecorators/meta.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { ResourceLock } from '@/commonDecorators/resource-lock.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUserId } from '@/commonDecorators/user.decorator';
import {
  FetchedRole,
  FetchRolePermissionsPipe,
} from '@/commonPipes/rolePermissions.pipe';
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

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

  @Post('assign/:roleId')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
  })
  @Idempotent()
  @ResourceLock('rolePermissions', { paramKey: 'roleId', ttl: 5 })
  @ApiParam({
    name: 'roleId',
    type: String,
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Assign permissions to a role',
    description:
      'Assign one or more permissions to a role. Requires the role ID and an array of permission codes to assign.',
  })
  @ApiOkResponse({
    description: 'Permissions assigned to role successfully',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - Insufficient permissions to assign permissions to role',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error - An unexpected error occurred',
  })
  @ApiNotFoundResponse({
    description: 'Role with the specified ID was not found ',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid role ID format. Role ID must be a valid UUID.',
    examples: {
      'Invalid UUID format': {
        summary: 'Role ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
      'Invalid permission codes': {
        summary: 'Invalid permission codes',
        value: [
          'At least one permission code must be provided to unassign permissions from the role.',
          'permission codes must be an array of strings',
        ],
      },
    },
  })
  async assign(
    @Body()
    assignPayload: PermissionsToRoleDto,
    @Param('roleId', FetchRolePermissionsPipe) role: FetchedRole,
    @CurrentUserId() requestedByUserId: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    await this.pipelineService.assignPermissionsToRole({
      assignPayload,
      role,
      requestedByUserId,
      metadata,
    });
  }

  @Delete('unAssign/:roleId')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
  })
  @Idempotent()
  @ResourceLock('rolePermissions', { paramKey: 'roleId', ttl: 5 })
  @ApiParam({
    name: 'roleId',
    type: String,
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Unassign permissions from a role',
    description:
      'Unassign one or more permissions from a role. Requires the role ID and an array of permission codes to unassign.',
  })
  @ApiOkResponse({
    description: 'Permissions unassigned from role successfully',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - Insufficient permissions to unassign permissions to role',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error - An unexpected error occurred',
  })
  @ApiNotFoundResponse({
    description: 'Role with the specified ID was not found ',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid role ID format. Role ID must be a valid UUID.',
    examples: {
      'Invalid UUID format': {
        summary: 'Role ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
      'Invalid permission codes': {
        summary: 'Invalid permission codes',
        value: [
          'At least one permission code must be provided to unassign permissions from the role.',
          'permission codes must be an array of strings',
        ],
      },
    },
  })
  async unAssign(
    @Body()
    unassignPayload: PermissionsToRoleDto,
    @Param('roleId', FetchRolePermissionsPipe) role: FetchedRole,
    @CurrentUserId() requestedByUserId: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    await this.pipelineService.unassignPermissionsFromRole({
      unassignPayload,
      requestedByUserId,
      metadata,
      role,
    });
  }

  @Get(':roleId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Get role with permissions by ID',
    description:
      'Retrieves a role along with its assigned permissions by the role ID. Requires a valid UUID as the role ID.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid role ID format. Role ID must be a valid UUID.',
    examples: {
      'Invalid UUID format': {
        summary: 'Role ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
    },
  })
  @ApiOkResponse({
    description: 'Role found and returned successfully',
    type: RoleResponseDto,
    isArray: false,
  })
  @ApiNotFoundResponse({
    description: 'Role with the specified ID was not found',
  })
  @ApiParam({
    name: 'roleId',
    type: String,
    description: 'Unique ID of the role to search for',
    example: EXAMPLE_ROLE_ID,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error - An unexpected error occurred',
  })
  async findByIdWithPermissions(
    @Param('roleId', ParseUUIDPipe) roleId: UUID,
  ): Promise<RoleResponseDto> {
    return await this.pipelineService.getPermissionsOrThrow(roleId);
  }
}
