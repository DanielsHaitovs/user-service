import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/base/permissions';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser } from '@/commonDecorators/user.decorator';
import {
  ASSIGN_PERMISSION_TO_ROLE,
  CONFLICT_ROLE_NAME_MSG,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
  READ_USER_ROLE,
  ROLE_GENERIC_BAD_REQUEST_MSG,
  ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
  ROLE_NOT_FOUND_MSG,
  UNASSIGN_USER_ROLE,
} from '@/libConst/role.const';
import { EXAMPLE_USER_ID } from '@/libConst/user.const';
import { RolePipelineService } from '@/role/role.pipeline';
import { RolesQueryRequest } from '@/roleDto/query.dto';
import {
  CreateRoleDto,
  GetRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

import { READ_PERMISSION } from '../../lib/const/permission.const';

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
  @ApiOkList({
    operation: {
      summary: 'Create a new role',
      description: 'Creates a new role with the provided information.',
    },
    body: {
      description: 'Role creation data',
      type: CreateRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_GENERIC_BAD_REQUEST_MSG,
    },
    createdResponse: {
      description: 'Role successfully created',
      type: RoleResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: CONFLICT_ROLE_NAME_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  async create(
    @Body()
    createDto: CreateRoleDto,
    @CurrentUser() requestedByUser: JwtPayload,
  ): Promise<RoleResponseDto> {
    const { canAssignPermissionsToRoles, canReadPermissions, id } =
      extractAccess(requestedByUser);

    if (!canAssignPermissionsToRoles || !canReadPermissions) {
      createDto.permissions = [];
    }

    return await this.pipelineService.create({
      createDto,
      createdById: id,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get role by ID',
      description: 'Retrieves a role by its unique identifier.',
    },
    okOperation: {
      description: 'Role found and returned successfully',
      type: GetRoleDto,
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
    name: 'id',
    type: String,
    description: 'Role id to search for',
    example: EXAMPLE_USER_ID,
  })
  async findById(@Param('id', ParseUUIDPipe) id: UUID): Promise<GetRoleDto> {
    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('name/:name')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get role by name',
      description: 'Retrieves a role by its unique name.',
    },
    okOperation: {
      description: 'Role found and returned successfully',
      type: GetRoleDto,
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
    name: 'name',
    type: String,
    description: 'Unique name of the role to search for',
    example: EXAMPLE_ROLE_NAME,
  })
  async findByName(@Param('name') name: string): Promise<GetRoleDto> {
    return await this.pipelineService.getByNameOrThrow(name);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_ROLE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for roles',
      description:
        'Searches for roles by their unique identifiers or names. If no query parameters are provided, returns all roles.',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description: 'Returns a list of user roles matching the provided user ID',
      type: RoleListResponseDto,
      isArray: false,
    },
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
  @ApiOkList({
    operation: {
      summary: 'Update role name',
      description: 'Updates the name of an existing role.',
    },
    body: {
      description: 'Role name update data',
      type: CreateRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_GENERIC_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Role name successfully updated',
      type: RoleResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: CONFLICT_ROLE_NAME_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Role id to update',
    example: EXAMPLE_USER_ID,
  })
  async updateName(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateDto: CreateRoleDto,
  ): Promise<boolean> {
    return await this.pipelineService.update({
      updateDto,
      id,
    });
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: DELETE_ROLE_ENDPOINT_PERMISSION,
    loose: [READ_USER_ROLE, UNASSIGN_USER_ROLE],
  })
  @ApiOkList({
    operation: {
      summary: 'Deletes a role',
      description:
        'Deletes an existing role from the system. Role is identified by their unique ID.',
    },
    badRequestMessages: {
      examples: ['role id must be a valid UUID', 'role id is required'],
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Role unique identifier - must be a valid UUID',
    example: EXAMPLE_ROLE_ID,
    format: 'uuid',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentUser() requestedByUser: JwtPayload,
  ): Promise<void> {
    const { canReadUserRoles, canUnassignUserFromRoles } =
      extractAccess(requestedByUser);

    const canDeleteAssignedRole = canReadUserRoles && canUnassignUserFromRoles;

    await this.pipelineService.delete({ id, canDeleteAssignedRole });
  }
}
