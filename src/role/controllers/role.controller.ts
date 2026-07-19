import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/base/helper/permissions';
import { READ_PERMISSION } from '@/commonConst/permission.const';
import {
  ASSIGN_PERMISSION_TO_ROLE,
  EXAMPLE_ROLE_ID,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/commonConst/role.const';
import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { Idempotent } from '@/commonDecorators/idempotent.decorator';
import {
  ClientMetadata,
  GetClientMetadata,
} from '@/commonDecorators/meta.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/commonDecorators/user.decorator';
import { FetchedRole, FetchRolePipe } from '@/commonPipes/role.pipe';
import { RolePipelineService } from '@/role/role.pipeline';
import { RolesQueryRequest } from '@/roleDto/query.dto';
import {
  CreateRoleDto,
  GetRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '@/roleDto/role.dto';
import {
  CREATE_ROLE_ENDPOINT_PERMISSION,
  DELETE_ROLE_ENDPOINT_PERMISSION,
  READ_ROLE_ENDPOINT_PERMISSION,
  UPDATE_ROLE_ENDPOINT_PERMISSION,
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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Roles')
@Controller({ path: 'role', version: ['1'] })
@TraceController()
@ApiBearerAuth('JWT-auth')
export class RoleController {
  constructor(protected readonly pipelineService: RolePipelineService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: CREATE_ROLE_ENDPOINT_PERMISSION,
    loose: [ASSIGN_PERMISSION_TO_ROLE, READ_PERMISSION],
  })
  @ApiBody({
    description: 'Role creation data',
    type: CreateRoleDto,
    isArray: false,
  })
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Creates a new role with the provided information.',
  })
  @ApiOkResponse({
    description: 'Role successfully created',
    type: RoleResponseDto,
  })
  @ApiCreatedResponse({
    description: 'Role successfully created',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Not Found - Related resource not found',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data for creating a role',
    examples: {
      'Invalid role name': {
        summary: 'Invalid role name',
        value: {
          name: 12345,
          permissions: ['valid-permission-code'],
        },
      },
      'Invalid permissions format': {
        summary: 'Invalid permissions format',
        value: {
          name: 'Example Role',
          permissions: 'not-an-array',
        },
      },
      'Permission does not exist': {
        summary: 'Permission does not exist',
        value: {
          name: 'Example Role',
          permissions: 'not-found-permission-code',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict - A role with the same name already exists',
  })
  @Idempotent()
  async create(
    @Body()
    createDto: CreateRoleDto,
    @CurrentUser() requestedByUser: JwtPayload,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<RoleResponseDto> {
    const { canAssignPermissionsToRoles, canReadPermissions, id } =
      extractAccess(requestedByUser);

    if (!canAssignPermissionsToRoles || !canReadPermissions) {
      createDto.permissions = [];
    }

    return await this.pipelineService.create({
      createDto,
      createdById: id,
      metadata,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_ENDPOINT_PERMISSION,
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
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieves a role by its unique identifier.',
  })
  @ApiNotFoundResponse({
    description: 'Role with the specified ID was not found',
  })
  @ApiOkResponse({
    description: 'Role found and returned successfully',
    type: GetRoleDto,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Role id to search for',
    example: EXAMPLE_USER_ID,
  })
  async findById(@Param('id', ParseUUIDPipe) id: UUID): Promise<GetRoleDto> {
    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Search for roles',
    description:
      'Searches for roles by their unique identifiers or names. If no query parameters are provided, returns all roles.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters. Role IDs must be valid UUIDs and role names must be valid strings.',
    examples: {
      'Invalid role ID format': {
        summary: 'Role ID is not a valid UUID',
        value: {
          ids: ['12345-invalid-uuid'],
          names: ['Valid Role Name'],
        },
      },
      'Invalid role name format': {
        summary: 'Role name is not a valid string',
        value: {
          ids: ['550e8400-e29b-41d4-a716-446655440000'],
          names: [12345],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns a list of roles matching the search criteria',
    type: RoleListResponseDto,
  })
  async findRoles(
    @Query() query: RolesQueryRequest,
  ): Promise<RoleListResponseDto> {
    return await this.pipelineService.getMany(query);
  }

  @Patch(':id/name')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UPDATE_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkResponse({
    description: 'Role name successfully updated',
    type: Boolean,
  })
  @ApiOperation({
    summary: 'Update role name',
    description: 'Updates the name of an existing role.',
  })
  @ApiBody({
    description: 'Role name update data',
    type: CreateRoleDto,
    isArray: false,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data for updating role name',
    examples: {
      'Invalid role name': {
        summary: 'Invalid role name',
        value: {
          name: 12345,
        },
      },
      'Invalid role ID format': {
        summary: 'Role ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict - A role with the same name already exists',
  })
  @ApiNotFoundResponse({
    description: 'Role with the specified ID was not found',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Role id to update',
    example: EXAMPLE_USER_ID,
  })
  @Idempotent()
  async updateName(
    @Param('id', FetchRolePipe) role: FetchedRole,
    @Body() updateDto: UpdateRoleDto,
    @CurrentUserId() requestedByUserId: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<boolean> {
    return await this.pipelineService.update({
      updateDto,
      role,
      requestedByUserId,
      metadata,
    });
  }

  @Delete('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: DELETE_ROLE_ENDPOINT_PERMISSION,
    loose: [READ_USER_ROLE, UNASSIGN_USER_ROLE],
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Role unique identifier - must be a valid UUID',
    example: EXAMPLE_ROLE_ID,
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Delete a role',
    description:
      'Deletes an existing role from the system. Role is identified by their unique ID. If the role is currently assigned to any users, it cannot be deleted until it is unassigned from all users.',
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
    description: 'Role successfully deleted',
    type: Boolean,
  })
  @Idempotent()
  async delete(
    @Param('id', FetchRolePipe) role: FetchedRole,
    @CurrentUser() requestedByUser: JwtPayload,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    const {
      canReadUserRoles,
      canUnassignUserFromRoles,
      id: requestedByUserId,
    } = extractAccess(requestedByUser);

    const canDeleteAssignedRole = canReadUserRoles && canUnassignUserFromRoles;

    await this.pipelineService.delete({
      role,
      canDeleteAssignedRole,
      requestedByUserId,
      metadata,
    });
  }
}
