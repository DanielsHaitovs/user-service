import { Permissions } from '@/common/decorators/permission.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { CurrentUserId } from '@/common/decorators/user.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { ParseUUIDArrayPipe } from '@/common/pipes/uuidArray.pipe';
import {
  CREATE_ROLE,
  DELETE_ROLE,
  EXAMPLE_ROLE_DESCRIPTION,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
  READ_PERMISSION,
  READ_ROLE,
  ROLE_NOT_FOUND_MSG,
  UPDATE_ROLE,
} from '@/lib/const/role.const';
import {
  CreateRoleDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@/role/dto/role.dto';
import { Role } from '@/role/entities/role.entity';
import { getRoleGenerucSelectableFields } from '@/role/helper/role-fields.util';
import { RoleService } from '@/role/services/role.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Roles')
@TraceController()
@Controller('roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RolesController {
  constructor(
    private readonly roleService: RoleService,
    // private readonly queryService: RoleQueryService,
  ) {}

  @Post()
  @Permissions(CREATE_ROLE, READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Creates a new role with the provided information.',
  })
  @ApiBody({
    description: 'Role creation data',
    type: CreateRoleDto,
    isArray: true,
    required: true,
    examples: {
      'new-role': {
        summary: 'Create a new role',
        value: {
          name: EXAMPLE_ROLE_NAME,
          description: EXAMPLE_ROLE_DESCRIPTION,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name should not be empty'],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Role successfully created',
    example: {
      id: [EXAMPLE_ROLE_ID],
      name: EXAMPLE_ROLE_NAME,
      description: EXAMPLE_ROLE_DESCRIPTION,
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    example: {
      statusCode: 500,
      message: InternalServerErrorException.name,
      error: InternalServerErrorException.name,
    },
  })
  async createRole(
    @Body()
    roleDto: CreateRoleDto,
    @CurrentUserId() createdBy: UUID,
  ): Promise<Role> {
    return await this.roleService.create({ roleDto, createdBy });
  }

  @Get('attributes/ids')
  @Permissions(READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get roles by IDs',
    description: 'Retrieves roles by their unique identifiers.',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Role unique identifiers',
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter roles by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter roles by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort roles by sort field',
    enum: getRoleGenerucSelectableFields({}),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order roles by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiOkResponse({
    description: 'Roles found and returned successfully',
    example: [
      {
        id: [EXAMPLE_ROLE_ID],
        name: EXAMPLE_ROLE_NAME,
        description: EXAMPLE_ROLE_DESCRIPTION,
      },
    ],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid UUID format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: ROLE_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: ROLE_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
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
  async getRolesByIds(
    @Query('ids', ParseUUIDArrayPipe) ids: UUID[],
    @Query('page', new ParseIntPipe()) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<Role[]> {
    return await this.roleService.findByIds({
      ids,
      pagination: { page, limit },
      ...(sortField && { sort: { sortField, sortOrder } }),
    });
  }

  @Get('attributes/createdBy')
  @Permissions(READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get roles by IDs of users who created them',
    description: 'Retrieves roles by their unique identifiers.',
  })
  @ApiQuery({
    name: 'createdByUserIds',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'User ids that created Role',
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter roles by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter roles by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort roles by sort field',
    enum: getRoleGenerucSelectableFields({}),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order roles by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiOkResponse({
    description: 'Roles found and returned successfully',
    example: [
      {
        id: [EXAMPLE_ROLE_ID],
        name: EXAMPLE_ROLE_NAME,
        description: EXAMPLE_ROLE_DESCRIPTION,
      },
    ],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid UUID format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: ROLE_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: ROLE_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
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
  async getRolesCreatedByUserId(
    @Query('ids', ParseUUIDArrayPipe) createdByUserIds: UUID[],
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<Role[]> {
    return await this.roleService.findCreatedByUserWithId({
      createdByUserIds,
      pagination: { page, limit },
      sort: { sortField, sortOrder },
    });
  }

  @Get('attributes/:value')
  @Permissions(READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Searches for role by name, code, id',
  })
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for role (name, code, or ID)',
    example: EXAMPLE_ROLE_NAME,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter roles by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter roles by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort roles by sort field',
    enum: getRoleGenerucSelectableFields({}),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order roles by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiOkResponse({
    description: 'Role found and returned successfully',
    example: [
      {
        id: EXAMPLE_ROLE_ID,
        name: EXAMPLE_ROLE_NAME,
      },
    ],
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
  async searchForRoles(
    @Param('value') value: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<RoleListResponseDto> {
    if (!sortField || sortField === '') {
      sortField = 'name';
    }

    return await this.roleService.searchFor({
      value,
      pagination: {
        page,
        limit,
      },
      sort: {
        sortField,
        sortOrder,
      },
    });
  }

  @Patch(':id')
  @Permissions(UPDATE_ROLE, READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update roles',
    description: 'Updates roles with the provided information.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    required: true,
    description: 'Unique identifier of the role to update',
    example: EXAMPLE_ROLE_ID,
  })
  @ApiBody({
    description: 'Role update data',
    type: UpdateRoleDto,
    isArray: false,
    required: true,
    examples: {
      'update-role': {
        summary: 'Update roles',
        value: {
          name: EXAMPLE_ROLE_NAME,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Roles successfully updated',
    example: [
      {
        id: EXAMPLE_ROLE_ID,
        name: EXAMPLE_ROLE_NAME,
        description: EXAMPLE_ROLE_DESCRIPTION,
      },
    ],
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Invalid UUID format' },
            {
              type: 'array',
              items: { type: 'string' },
              example: [
                'id must be a valid UUID',
                'name must be a valid string',
                'description must be a valid string',
              ],
            },
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: ROLE_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: ROLE_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
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
  async updateRole(
    @Param('id') id: UUID,
    @Body()
    role: UpdateRoleDto,
  ): Promise<Role> {
    return await this.roleService.update({ id, role });
  }

  @Delete()
  @Permissions(DELETE_ROLE, READ_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete roles by IDs',
    description: 'Deletes roles with the provided IDs.',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Role unique identifiers',
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiOkResponse({
    description: 'Roles successfully deleted',
    example: {
      deletedIds: [EXAMPLE_ROLE_ID],
    },
  })
  @ApiNoContentResponse({
    description: 'No roles to delete (empty IDs list)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format in one or more IDs',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid UUID format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'One or more roles not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'One or more roles not found',
        },
        error: { type: 'string', example: NotFoundException.name },
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
  async deleteByIds(
    @Query('ids', new ParseArrayPipe({ items: String })) ids: UUID[],
  ): Promise<{ deleted: number }> {
    return await this.roleService.deleteByIds(ids);
  }

  /**
   * Adds permissions to an existing role.
   * @param permissionIds - The IDs of the permissions to add.
   * @param roleId - The ID of the role to which permissions will be added.
   * @returns The updated role entity with new permissions.
   * @throws NotFoundException if the role or any of the permissions do not exist.
   */
  @Post('add-permissions')
  @Permissions(UPDATE_ROLE, READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add permissions to a role',
    description: 'Associates permissions with an existing role.',
  })
  @ApiBody({
    description: 'Permission IDs and Role ID',
    schema: {
      type: 'object',
      properties: {
        permissionIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['permission-id-1', 'permission-id-2'],
        },
        roleId: {
          type: 'string',
          format: 'uuid',
          example: 'role-id-1',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Permissions successfully added to the role',
    example: {
      id: 'role-id-1',
      name: 'Role Name',
      permissions: [
        {
          id: 'permission-id-1',
          name: 'Permission Name 1',
          code: 'permission-code-1',
        },
        {
          id: 'permission-id-2',
          name: 'Permission Name 2',
          code: 'permission-code-2',
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Role or permissions not found',
    example: {
      statusCode: 404,
      message: 'Role with id role-id-1 not found',
      error: 'NotFoundException',
    },
  })
  async addPermissionsToRole(
    @Body('permissionIds', new ParseArrayPipe({ items: String }))
    permissionIds: UUID[],
    @Body('roleId') roleId: UUID,
  ): Promise<Role> {
    return this.roleService.addPermissionsToRole({ permissionIds, roleId });
  }

  /**
   * Advanced roles&permissins search and filtering endpoint with pagination and field selection.
   *
   * Provides comprehensive query capabilities supporting multiple filter combinations,
   * flexible sorting options, and selective field retrieval for optimal performance.
   * Designed for administrative interfaces, reporting systems, and complex roles&permissins
   * management scenarios requiring fine-grained data access control.
   */
  // @Get('attributes/filter')
  // @Permissions(READ_ROLE, READ_PERMISSION)
  // @HttpCode(HttpStatus.OK)
  // @ApiQuery({
  //   name: 'ids',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter roles by IDs',
  // })
  // @ApiQuery({
  //   name: 'createdByIds',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter by IDs of users who created the roles',
  // })
  // @ApiQuery({
  //   name: 'names',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter role by names',
  // })
  // @ApiQuery({
  //   name: 'includeCreatedBy',
  //   type: Boolean,
  //   isArray: false,
  //   required: false,
  //   description: 'Include created by user in the response',
  // })
  // @ApiQuery({
  //   name: 'includePermissions',
  //   type: Boolean,
  //   isArray: false,
  //   required: false,
  //   description: 'Include permissions in the response',
  // })
  // @ApiQuery({
  //   name: 'permissionIds',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter permissions IDs',
  // })
  // @ApiQuery({
  //   name: 'permissionNames',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter by permissions names',
  // })
  // @ApiQuery({
  //   name: 'permissionCodes',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Filter by permissions codes',
  // })
  // @ApiQuery({
  //   name: 'page',
  //   type: Number,
  //   required: true,
  //   description: 'Filter users by page number',
  //   example: 1,
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   type: Number,
  //   required: true,
  //   description: 'Filter users by limit of results per page',
  //   example: 10,
  //   maximum: 500,
  // })
  // @ApiQuery({
  //   name: 'sortField',
  //   type: String,
  //   required: false,
  //   description: 'Filter users by sort order',
  //   enum: [
  //     ...getRoleGenerucSelectableFields({}),
  //     ...getPermissionsGenericSelectableFields({}),
  //     ...getUserSelectableFields({}),
  //   ],
  //   example: 'name',
  // })
  // @ApiQuery({
  //   name: 'sortOrder',
  //   type: String,
  //   required: false,
  //   description: 'Filter users by sort order',
  //   enum: ['ASC', 'DESC'],
  // })
  // @ApiQuery({
  //   name: 'selectRoles',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Set role fields to include in response',
  //   enum: getRoleGenerucSelectableFields({}),
  // })
  // @ApiQuery({
  //   name: 'selectPermissions',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Set permissions fields to include in response',
  //   enum: getPermissionsGenericSelectableFields({}),
  // })
  // @ApiQuery({
  //   name: 'selectCreatedBy',
  //   type: String,
  //   isArray: true,
  //   required: false,
  //   description: 'Set created by user fields to include in response',
  //   enum: getPermissionsGenericSelectableFields({}),
  // })
  // async filterUsers(
  //   @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
  //   @Query('createdByIds', new ParseArrayPipe({ optional: true }))
  //   createdByIds: UUID[],
  //   @Query('names', new ParseArrayPipe({ optional: true }))
  //   names: string[],
  //   @Query('includePermissions', new ParseBoolPipe({ optional: true }))
  //   includePermissions: boolean,
  //   @Query('includeCreatedBy', new ParseBoolPipe({ optional: true }))
  //   includeCreatedBy: boolean,
  //   @Query('permissionIds', new ParseArrayPipe({ optional: true }))
  //   permissionIds: UUID[],
  //   @Query('permissionNames', new ParseArrayPipe({ optional: true }))
  //   permissionNames: string[],
  //   @Query('permissionCodes', new ParseArrayPipe({ optional: true }))
  //   permissionCodes: string[],
  //   @Query('page', ParseIntPipe) page: number,
  //   @Query('limit', ParseIntPipe) limit: number,
  //   @Query('sortField') sortField: string,
  //   @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  //   @Query('selectRoles', new ParseArrayPipe({ optional: true }))
  //   selectRoles: string[],
  //   @Query('selectPermissions', new ParseArrayPipe({ optional: true }))
  //   selectPermissions: string[],
  //   @Query('selectCreatedBy', new ParseArrayPipe({ optional: true }))
  //   selectCreatedBy: string[],
  // ): Promise<RoleListResponseDto> {
  //   return await this.queryService.getRoles({
  //     rolesQuery: {
  //       ids,
  //       names,
  //       createdByIds,
  //     },
  //     permissionsQuery: {
  //       ids: permissionIds,
  //       names: permissionNames,
  //       codes: permissionCodes,
  //     },
  //     includePermissions,
  //     includeCreatedBy,
  //     pagination: {
  //       page,
  //       limit,
  //     },
  //     sort: {
  //       sortField,
  //       sortOrder,
  //     },
  //     selectRoles,
  //     selectPermissions,
  //     selectCreatedBy,
  //   });
  // }
}
