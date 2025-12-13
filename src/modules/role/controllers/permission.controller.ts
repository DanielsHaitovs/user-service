import { JWTPayload } from '@/auth/interfaces/req.interface';
import { BaseController } from '@/base/base.controller';
import { DeleteResponseDto } from '@/base/dto/response.dto';
import { ApiOkList } from '@/common/decorators/api.decorator';
import { Permissions } from '@/common/decorators/permission.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import {
  CREATE_PERMISSION,
  DELETE_PERMISSION,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
  PERMISSION_API_OK_RESPONSE_MSG,
  PERMISSION_CODE_EXISTS_MSG,
  PERMISSION_GENERIC_BAD_REQUEST_MSG,
  PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
  PERMISSION_NOT_FOUND_MSG,
  READ_PERMISSION,
  UPDATE_PERMISSION,
} from '@/lib/const/permission.const';
import { READ_ROLE, ROLE_NOT_FOUND_MSG } from '@/lib/const/role.const';
import {
  CreatePermissionDto,
  PermissionListResponseDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from '@/modules/role/dto/permission/permission.dto';
import {
  GetPermissionsByCodesQueryDto,
  GetPermissionsByIdsQueryDto,
  PermissionSearchRequestDto,
} from '@/modules/role/dto/permission/permission.query';
import { Permission } from '@/role/entities/permissions.entity';
import { PermissionService } from '@/role/services/permission/permission.service';
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
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Permissions')
@TraceController()
@Controller('permission')
export class PermissionController extends BaseController<
  CreatePermissionDto,
  GetPermissionsByIdsQueryDto,
  PermissionSearchRequestDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionListResponseDto
> {
  constructor(private readonly permissionService: PermissionService) {
    super();
  }

  /**
   * @param createPermissionDto - Array of permissions to create
   * @param requestedByUser - The user making the request
   * @returns The created permissions
   * @throws BadRequestException - If role id was not provided
   * @throws EntityNotFoundError - If the specified role does not exist
   * @throws ConflictException - If a permission with the same code already exists
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [READ_ROLE, READ_PERMISSION, CREATE_PERMISSION],
    operation: {
      summary: 'Create a new permission',
      description: 'Creates a new permission with the provided information.',
    },
    body: {
      description: 'Permission creation data',
      type: CreatePermissionDto,
      isArray: true,
    },
    badRequestMessages: {
      examples: PERMISSION_GENERIC_BAD_REQUEST_MSG,
    },
    createdResponse: {
      description: 'Permission successfully created',
      type: PermissionResponseDto,
      isArray: true,
    },
    conflictMessage: {
      description: PERMISSION_CODE_EXISTS_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  async create(
    @Body(new ParseArrayPipe({ items: CreatePermissionDto }))
    createPermissionDto: CreatePermissionDto[],
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<PermissionResponseDto[]> {
    const { hasAccessToUsers, id } = this.extractAccess(requestedByUser);

    return await this.permissionService.create({
      permissions: createPermissionDto,
      createdBy: id,
      hasAccessToCreatedBy: hasAccessToUsers,
    });
  }

  /**
   * Retrieves permissions by their unique identifiers.
   *
   * @param filters - Query parameters containing the list of permission IDs
   * @param requestedByUser - The user making the request
   * @returns Promise resolving to PermissionListResponseDto
   * @throws EntityNotFoundError when one or more permissions are not found
   */
  @Get('attribute/ids')
  @Permissions(READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_PERMISSION],
    operation: {
      summary: 'Get permission by ID',
      description: 'Retrieves a permission by its unique identifier.',
    },
    okOperation: {
      description: 'Permission found and returned successfully',
      type: PermissionListResponseDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
  })
  async findByIds(
    @Query() filters: GetPermissionsByIdsQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<PermissionListResponseDto> {
    const { hasAccessToUsers, hasAccessToRoles } =
      this.extractAccess(requestedByUser);

    return await this.permissionService.findByIds({
      filters,
      hasAccessToRoles,
      hasAccessToCreatedBy: hasAccessToUsers,
    });
  }

  /**
   * Retrieves permissions by their unique codes.
   *
   * @param filters - Query parameters containing the list of permission codes
   * @param requestedByUser - The user making the request
   * @returns Promise resolving to PermissionListResponseDto
   * @throws EntityNotFoundError when one or more permissions are not found
   */
  @Get('attribute/codes')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_PERMISSION],
    operation: {
      summary: 'Get permission by Codes',
      description: 'Retrieves a permission by its codes.',
    },
    okOperation: {
      description: PERMISSION_API_OK_RESPONSE_MSG,
      type: PermissionListResponseDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
  })
  async getPermissionByCodes(
    @Query() filters: GetPermissionsByCodesQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<PermissionListResponseDto> {
    const { hasAccessToUsers, hasAccessToRoles } =
      this.extractAccess(requestedByUser);

    return await this.permissionService.findByCodes({
      filters,
      hasAccessToRoles,
      hasAccessToCreatedBy: hasAccessToUsers,
    });
  }

  /**
   * Searches for permissions by name, code, or id.
   *
   * @param value - The search value (name, code, or id)
   * @param control - Additional query parameters for filtering and pagination
   * @returns Promise resolving to PermissionListResponseDto
   */
  @Get('search/:value')
  @Permissions(READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for permissions (name, code, or ID)',
    example: EXAMPLE_PERMISSION_NAME,
  })
  @ApiOkList({
    permissions: [READ_PERMISSION],
    operation: {
      summary: 'Search for permissions',
      description: 'Searches for permissions by name, code, or id',
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: PERMISSION_API_OK_RESPONSE_MSG,
      type: PermissionListResponseDto,
      isArray: false,
    },
  })
  async search(
    @Param('value') value: string,
    @Query() control: PermissionSearchRequestDto,
  ): Promise<PermissionListResponseDto> {
    return await this.permissionService.searchFor({
      value,
      control,
    });
  }

  /**
   * Updates a permission by its ID.
   *
   * @param id - UUID of the permission to update
   * @param updatePermissionDto - Data for updating the permission
   * @returns Promise resolving to the updated Permission
   * @throws EntityNotFoundError when the permission with the specified ID does not exist
   * @throws ConflictException when a permission with the same name or code already exists
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    required: true,
    description: 'Unique identifier of the permission to update',
    example: EXAMPLE_PERMISSION_ID,
  })
  @ApiOkList({
    permissions: [READ_PERMISSION, UPDATE_PERMISSION],
    operation: {
      summary: 'Update a permission',
      description: 'Updates a permission with the provided information.',
    },
    body: {
      description: 'Permission update data',
      type: UpdatePermissionDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_GENERIC_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Permission successfully updated',
      type: PermissionResponseDto,
      isArray: false,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
    conflictMessage: {
      description: PERMISSION_CODE_EXISTS_MSG,
    },
  })
  async updateById(
    @Param('id') id: UUID,
    @Body()
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return await this.permissionService.update({ id, updatePermissionDto });
  }

  /**
   * Deletes permissions by their unique identifiers.
   *
   * @param ids - Array of permission UUIDs to delete
   * @returns Promise resolving to DeleteResponseDto
   * @throws EntityNotFoundError when one or more permissions are not found
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_PERMISSION, DELETE_PERMISSION],
    operation: {
      summary: 'Delete permissions by IDs',
      description: 'Deletes permissions with the provided IDs.',
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: 'Permissions successfully deleted',
      type: DeleteResponseDto,
      isArray: false,
    },
    noContent: {
      description: 'No permissions to delete (empty IDs list)',
    },
    notFound: {
      description: 'One or more permissions not found',
    },
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Permission unique identifiers',
    example: [EXAMPLE_PERMISSION_ID],
  })
  async delete(
    @Query('ids', new ParseArrayPipe({ items: String })) ids: UUID[],
  ): Promise<DeleteResponseDto> {
    return await this.permissionService.deleteByIds(ids);
  }
}
