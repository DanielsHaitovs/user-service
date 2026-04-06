import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import {
  CREATE_PERMISSION,
  READ_PERMISSION,
} from '@/lib/const/permission.const';
import {
  CONFLICT_ROLE_NAME_MSG,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
  READ_ROLE,
  ROLE_GENERIC_BAD_REQUEST_MSG,
  ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
  ROLE_NOT_FOUND_MSG,
} from '@/libConst/role.const';
import { EXAMPLE_USER_ID } from '@/libConst/user.const';
import { RolePipelineService } from '@/role/role.pipeline';
import { CreateRoleDto, GetRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
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

@ApiTags('Roles')
@Controller('role')
@TraceController()
export class RoleController {
  constructor(protected readonly pipelineService: RolePipelineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [READ_ROLE, READ_PERMISSION, CREATE_PERMISSION],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    // const { hasAccessToUsers, id } = this.extractAccess(requestedByUser);

    return await this.pipelineService.create({
      createDto,
      createdById: '61a317c3-78ca-4b59-8d14-168343e2b1e6' as UUID,
    });
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions(READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_ROLE],
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
    description: 'Comma-separated list of user IDs to search for',
    example: EXAMPLE_USER_ID,
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetRoleDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('name/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_ROLE],
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
  async findByName(
    @Param('name') name: string,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetRoleDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByNameOrThrow(name);
  }

  @Get('permissions/:id')
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
    name: 'id',
    type: String,
    description: 'Unique ID of the role to search for',
    example: EXAMPLE_ROLE_ID,
  })
  async findByIdWithPermissions(
    @Param('id', ParseUUIDPipe) id: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getPermissionsByRoleId(id);
  }
}
