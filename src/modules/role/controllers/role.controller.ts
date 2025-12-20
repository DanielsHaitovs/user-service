import { JWTPayload } from '@/authInterfaces/req.interface';
import { BaseController } from '@/base/base.controller';
import { DeleteResponseDto } from '@/baseDto/response.dto';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser } from '@/commonDecorators/user.decorator';
import { AuthenticationGuard } from '@/commonGuards/auth.guard';
import { PermissionsGuard } from '@/commonGuards/permission.guard';
import { READ_PERMISSION } from '@/roleConst/permission.const';
import {
  CONFLICT_ROLE_NAME_MSG,
  CREATE_ROLE,
  DELETE_ROLE,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
  READ_ROLE,
  ROLE_API_OK_RESPONSE_MSG,
  ROLE_GENERIC_BAD_REQUEST_MSG,
  ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
  ROLE_NOT_FOUND_MSG,
  UPDATE_ROLE,
} from '@/roleConst/role.const';
import {
  FilterRolesQueryDto,
  GetRoleByIdsQueryDto,
  RoleSearchRequestDto,
} from '@/roleDto/query.dto';
import {
  AssignPermissionsToRoleDto,
  CreateRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { QueryService } from '@/roleServices/query.service';
import { RoleService } from '@/roleServices/role.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Roles')
@TraceController()
@Controller('roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export class RolesController extends BaseController<
  CreateRoleDto,
  GetRoleByIdsQueryDto,
  RoleSearchRequestDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleListResponseDto
> {
  constructor(
    private readonly roleService: RoleService,
    private readonly queryService: QueryService,
  ) {
    super();
  }

  /**
   * Creates a new role with the provided information.
   * @param roleDto - The DTO containing role creation data.
   * @param requestedByUser - The user making the request.
   * @returns The newly created role entity.
   * @throws ConflictException if a role with the same name already exists.
   * @throws NotFoundException if the permissions provided do not exist.
   */
  @Post()
  @Permissions(CREATE_ROLE, READ_ROLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [CREATE_ROLE, READ_ROLE],
    operation: {
      summary: 'Create a new role',
      description: 'Creates a new role with the provided information.',
    },
    body: {
      type: CreateRoleDto,
      description: 'Roles creation data',
    },
    createdResponse: {
      description: 'Roles successfully created',
      type: RoleResponseDto,
    },
    conflictMessage: {
      description: CONFLICT_ROLE_NAME_MSG,
    },
    badRequestMessages: {
      examples: ROLE_GENERIC_BAD_REQUEST_MSG,
    },
  })
  async create(
    @Body()
    roleDto: CreateRoleDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    const { id, hasAccessToUsers, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return await this.roleService.create({
      roleDto,
      createdBy: id,
      hasAccessToCreatedBy: hasAccessToUsers,
      hasAccessToPermissions,
    });
  }

  /**
   * @param filters - Query filters containing role IDs
   * @param requestedByUser - The user making the request
   * @returns List of roles matching the provided IDs
   * @throws NotFoundException if any of the roles do not exist
   */
  @Get('attribute/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_ROLE],
    operation: {
      summary: 'Get roles by IDs',
      description: 'Retrieves roles by their unique identifiers.',
    },
    okOperation: {
      description: ROLE_API_OK_RESPONSE_MSG,
      type: RoleListResponseDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  async findByIds(
    @Query() filters: GetRoleByIdsQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleListResponseDto> {
    const { hasAccessToUsers, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return await this.roleService.findByIds({
      filters,
      hasAccessToCreatedBy: hasAccessToUsers,
      hasAccessToPermissions,
    });
  }

  /**
   * @param value - search value (name, code, id)
   * @param control - query control parameters
   * @returns List of roles matching the search criteria
   */
  @Get('search/:value')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for role (name, code, or ID)',
    example: EXAMPLE_ROLE_NAME,
  })
  @ApiOkList({
    permissions: [READ_ROLE],
    operation: {
      summary: 'Search roles',
      description: 'Searches for role by name, code, id',
    },
    okOperation: {
      description: ROLE_API_OK_RESPONSE_MSG,
      type: RoleListResponseDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
  })
  async search(
    @Param('value') value: string,
    @Query() control: RoleSearchRequestDto,
  ): Promise<RoleListResponseDto> {
    return await this.roleService.searchFor({
      value,
      control,
    });
  }

  /**
   * Updates a role by its unique identifier.
   * @param id - The UUID of the role to update.
   * @param roleToUpdate - The DTO containing updated role information.
   * @returns The updated role entity.
   * @throws NotFoundException if the role does not exist.
   * @throws ConflictException if the updated role name conflicts with an existing role.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    required: true,
    description: 'Unique identifier of the role to update',
    example: EXAMPLE_ROLE_ID,
  })
  @ApiOkList({
    permissions: [READ_ROLE, UPDATE_ROLE],
    operation: {
      summary: 'Update a role',
      description: 'Updates a role with the provided information.',
    },
    body: {
      description: 'Role update data',
      type: UpdateRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_GENERIC_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Role successfully updated',
      type: RoleResponseDto,
      isArray: false,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
    conflictMessage: {
      description: CONFLICT_ROLE_NAME_MSG,
    },
  })
  async updateById(
    @Param('id') id: UUID,
    @Body()
    roleToUpdate: UpdateRoleDto,
  ): Promise<Roles> {
    return await this.roleService.update({ id, roleToUpdate });
  }

  /**
   * Deletes roles by their unique identifiers.
   * @param ids - An array of role UUIDs to be deleted.
   * @returns A DeleteResponseDto indicating the result of the deletion operation.
   * @throws BadRequestException if no role ids provided.
   * @throws NotFoundException if any of the roles do not exist.
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Roles unique identifiers',
    example: [EXAMPLE_ROLE_ID],
  })
  @ApiOkList({
    permissions: [DELETE_ROLE, READ_ROLE],
    operation: {
      summary: 'Delete roles by IDs',
      description: 'Deletes roles with the provided IDs.',
    },
    badRequestMessages: {
      examples: ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Roles successfully deleted',
      type: DeleteResponseDto,
      isArray: false,
    },
    noContent: {
      description: 'No roles to delete (empty IDs list)',
    },
    notFound: {
      description: 'One or more roles not found',
    },
  })
  async delete(
    @Query('ids', new ParseArrayPipe({ items: String })) ids: UUID[],
  ): Promise<DeleteResponseDto> {
    return await this.roleService.deleteByIds(ids);
  }

  /**
   * Adds permissions to an existing role.
   * @param payload - The DTO containing permission IDs/codes and the role ID.
   * @returns The updated role entity with new permissions.
   * @throws NotFoundException if the role or any of the permissions do not exist.
   */
  @Post('add-permissions')
  @Permissions(UPDATE_ROLE, READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [UPDATE_ROLE, READ_ROLE, READ_PERMISSION],
    operation: {
      summary: 'Add permissions to a role',
      description: 'Associates permissions with an existing role.',
    },
    body: {
      description: 'Permission IDs and Roles ID',
      type: AssignPermissionsToRoleDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: ROLE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Permissions successfully added to the role',
      type: RoleResponseDto,
      isArray: false,
    },
    notFound: {
      description: 'One or more roles not found',
    },
  })
  async addPermissionsToRole(
    @Body() payload: AssignPermissionsToRoleDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleResponseDto> {
    const { hasAccessToUsers } = this.extractAccess(requestedByUser);

    const { permissionIds, permissionCodes, roleId } = payload;

    return this.roleService.addPermissionsToRole({
      permissionIds,
      permissionCodes,
      roleId,
      hasAccessToCreatedBy: hasAccessToUsers,
    });
  }

  /**
   * Advanced roles&permissins search and filtering endpoint with pagination and field selection.
   *
   * Provides comprehensive query capabilities supporting multiple filter combinations,
   * flexible sorting options, and selective field retrieval for optimal performance.
   * Designed for administrative interfaces, reporting systems, and complex roles&permissins
   * management scenarios requiring fine-grained data access control.
   */
  @Get('query')
  @Permissions(READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  async filterUsers(
    @Query() filters: FilterRolesQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<RoleListResponseDto> {
    const { id, hasAccessToUsers, hasAccessToPermissions } =
      this.extractAccess(requestedByUser);

    return await this.queryService.getRoles({
      filters,
      hasAccessToPermissions,
      hasAccessToCreatedBy: hasAccessToUsers,
      requestedByUserId: id,
    });
  }
}
