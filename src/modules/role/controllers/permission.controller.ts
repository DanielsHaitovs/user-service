import { Permissions } from '@/common/decorators/permission.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import {
  CREATE_PERMISSION,
  DELETE_PERMISSION,
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
  EXAMPLE_ROLE_ID,
  PERMISSINO_CODE_EXISTS_MSG,
  PERMISSINO_NOT_FOUND_MSG,
  READ_PERMISSION,
  READ_ROLE,
  UPDATE_PERMISSION,
} from '@/lib/const/role.const';
import { TraceController } from '@/lib/decorators/trace.decorator';
import {
  CreatePermissionDto,
  PermissionListResponseDto,
  UpdatePermissionDto,
} from '@/role/dto/permission.dto';
import { Permission } from '@/role/entities/permissions.entity';
import { getPermissionsSelectableFields } from '@/role/helper/role-fields.util';
import { PermissionService } from '@/role/services/permission.service';
import {
  BadRequestException,
  Body,
  ConflictException,
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
  ApiConflictResponse,
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

@ApiTags('Permissions')
@TraceController()
@Controller('permission')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Permissions(READ_ROLE, READ_PERMISSION, CREATE_PERMISSION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new permission',
    description: 'Creates a new permission with the provided information.',
  })
  @ApiBody({
    description: 'Permission creation data',
    type: CreatePermissionDto,
    isArray: true,
    required: true,
    examples: {
      'new-permission': {
        summary: 'Create a new permission',
        value: [
          {
            name: EXAMPLE_PERMISSION_NAME,
            code: EXAMPLE_PERMISSION_CODE,
            roleId: EXAMPLE_ROLE_ID,
          },
        ],
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
          example: ['name should not be empty', 'code should not be empty'],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Permission successfully created',
    example: [
      {
        id: [EXAMPLE_PERMISSION_ID],
        name: EXAMPLE_PERMISSION_NAME,
        code: EXAMPLE_PERMISSION_CODE,
      },
    ],
  })
  @ApiConflictResponse({
    description: PERMISSINO_CODE_EXISTS_MSG,
    example: {
      statusCode: 409,
      message: PERMISSINO_CODE_EXISTS_MSG,
      error: ConflictException.name,
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
  async createPermission(
    @Body(new ParseArrayPipe({ items: CreatePermissionDto }))
    createPermissionDto: CreatePermissionDto[],
  ): Promise<Permission[]> {
    return await this.permissionService.create(createPermissionDto);
  }

  @Get('ids')
  @Permissions(READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieves a permission by its unique identifier.',
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
  @ApiOkResponse({
    description: 'Permission found and returned successfully',
    example: [
      {
        id: [EXAMPLE_PERMISSION_ID],
        name: EXAMPLE_PERMISSION_NAME,
        code: EXAMPLE_PERMISSION_CODE,
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
    description: PERMISSINO_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: PERMISSINO_NOT_FOUND_MSG },
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
  async getPermissionById(
    @Query('ids', ParseArrayPipe) ids: UUID[],
  ): Promise<Permission[]> {
    return await this.permissionService.findByIds(ids);
  }

  @Get('codes')
  @Permissions(READ_ROLE, READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieves a permission by its unique identifier.',
  })
  @ApiQuery({
    name: 'codes',
    type: String,
    isArray: true,
    required: true,
    description: 'Permission unique identifiers',
    example: [EXAMPLE_PERMISSION_ID],
  })
  @ApiOkResponse({
    description: 'Permission found and returned successfully',
    example: [
      {
        id: EXAMPLE_PERMISSION_ID,
        name: EXAMPLE_PERMISSION_NAME,
        code: EXAMPLE_PERMISSION_CODE,
      },
    ],
  })
  @ApiBadRequestResponse({
    description: 'Invalid code format provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid code format' },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: PERMISSINO_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: PERMISSINO_NOT_FOUND_MSG },
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
  async getPermissionByCodes(
    @Query('codes', ParseArrayPipe) codes: string[],
  ): Promise<Permission[]> {
    return await this.permissionService.findByCodes(codes);
  }

  @Get(':value')
  @Permissions(READ_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Searches for permissions by name, code, id',
  })
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for permissions (name, code, or ID)',
    example: EXAMPLE_PERMISSION_NAME,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter permissions by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter permissions by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort permissions by sort field',
    enum: getPermissionsSelectableFields(),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'sort order permissionss',
    enum: ['ASC', 'DESC'],
  })
  @ApiOkResponse({
    description: 'Permission found and returned successfully',
    example: [
      {
        id: EXAMPLE_PERMISSION_ID,
        name: EXAMPLE_PERMISSION_NAME,
        code: EXAMPLE_PERMISSION_CODE,
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
  async searchForPermissions(
    @Param('value') value: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<PermissionListResponseDto> {
    return await this.permissionService.searchFor({
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
  @Permissions(READ_PERMISSION, UPDATE_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update permissions',
    description: 'Updates permissions with the provided information.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    required: true,
    description: 'Unique identifier of the permission to update',
    example: EXAMPLE_PERMISSION_ID,
  })
  @ApiBody({
    description: 'Permission update data',
    type: UpdatePermissionDto,
    isArray: false,
    required: true,
    examples: {
      'update-permission': {
        summary: 'Update permissions',
        value: {
          name: EXAMPLE_PERMISSION_NAME,
          code: EXAMPLE_PERMISSION_CODE,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Permissions successfully updated',
    example: [
      {
        id: EXAMPLE_PERMISSION_ID,
        name: EXAMPLE_PERMISSION_NAME,
        code: EXAMPLE_PERMISSION_CODE,
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
                'code must be a valid string',
              ],
            },
          ],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiNotFoundResponse({
    description: PERMISSINO_NOT_FOUND_MSG,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: PERMISSINO_NOT_FOUND_MSG },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Code already exists (when updating code)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: PERMISSINO_CODE_EXISTS_MSG,
        },
        error: { type: 'string', example: ConflictException.name },
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
  async updatePermission(
    @Param('id') id: UUID,
    @Body()
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return await this.permissionService.update(id, updatePermissionDto);
  }

  @Delete()
  @Permissions(READ_PERMISSION, DELETE_PERMISSION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete permissions by IDs',
    description: 'Deletes permissions with the provided IDs.',
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
  @ApiOkResponse({
    description: 'Permissions successfully deleted',
    example: {
      deletedIds: [EXAMPLE_PERMISSION_ID],
    },
  })
  @ApiNoContentResponse({
    description: 'No permissions to delete (empty IDs list)',
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
    description: 'One or more permissions not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'One or more permissions not found',
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
    @Query(new ParseArrayPipe({ items: String })) ids: UUID[],
  ): Promise<{ deleted: number }> {
    return await this.permissionService.deleteByIds(ids);
  }
}
