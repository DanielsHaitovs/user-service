import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { READ_PERMISSION } from '@/lib/const/permission.const';
import {
  EXAMPLE_ROLE_ID,
  READ_ROLE,
  ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
  ROLE_NOT_FOUND_MSG,
  UPDATE_ROLE,
} from '@/libConst/role.const';
import { RolePipelineService } from '@/role/role.pipeline';
import { PermissionsToRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Roles Permissions')
@Controller('role/permissions')
@TraceController()
export class RolePermissionsController {
  constructor(protected readonly pipelineService: RolePipelineService) {}

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [READ_ROLE, READ_PERMISSION, UPDATE_ROLE],
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
    createdResponse: {
      description: 'Permissions successfully assigned to role',
      type: RoleResponseDto,
      isArray: false,
    },
    notFound: {
      description:
        'Role with the specified ID was not found or Permission code(s) not found',
    },
  })
  async assign(
    @Body()
    assignDto: PermissionsToRoleDto,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    // const { hasAccessToUsers, id } = this.extractAccess(requestedByUser);

    return await this.pipelineService.assignPermissionsToRole(assignDto);
  }

  @Post('unAssign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [READ_ROLE, READ_PERMISSION, UPDATE_ROLE],
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
    createdResponse: {
      description: 'Permissions successfully assigned to role',
      type: RoleResponseDto,
      isArray: false,
    },
    notFound: {
      description:
        'Role with the specified ID was not found or Permission code(s) not found',
    },
  })
  async unAssign(
    @Body()
    unAssignDto: PermissionsToRoleDto,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    // const { hasAccessToUsers, id } = this.extractAccess(requestedByUser);

    return await this.pipelineService.unassignPermissionsFromRole(unAssignDto);
  }

  @Get(':roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_ROLE],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getPermissionsOrThrow(roleId);
  }
}
