import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUserId } from '@/commonDecorators/user.decorator';
import {
  EXAMPLE_PERMISSION_CODE,
  PERMISSION_CODE_EXISTS_MSG,
  PERMISSION_GENERIC_BAD_REQUEST_MSG,
  PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
  PERMISSION_NOT_FOUND_MSG,
} from '@/lib/const/permission.const';
import { ROLE_NOT_FOUND_MSG } from '@/libConst/role.const';
import { EXAMPLE_USER_ID } from '@/libConst/user.const';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import {
  CreatePermissionDto,
  GetPermissionDto,
  PermissionResponseDto,
} from '@/permissionDto/permission.dto';
import {
  CREATE_PERMISSION_ENDPOINT_PERMISSION,
  READ_PERMISSION_ENDPOINT_PERMISSION,
  UPDATE_PERMISSION_ENDPOINT_PERMISSION,
} from '@/system/const/permission.const';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Permissions')
@Controller({ path: 'permission', version: ['1'] })
@TraceController()
@ApiBearerAuth('JWT-auth')
export class PermissionController {
  constructor(protected readonly pipelineService: PermissionPipelineService) {}

  /**
   * Creates a new permission.
   *
   * Validates the input data, checks for existing permission code conflicts,
   * and associates the creator's information. Returns the created permission entity.
   * @param createDto - Data for the new permission
   * @param requestedByUser - JWT payload of the user creating the permission
   * @returns The created permission entity
   * @throws ConflictException if a permission with the same code already exists
   * @throws BadRequestException for validation errors
   * @throws UnprocessableEntityException if the creator user does not exist
   * @throws UnprocessableEntityException if any of the provided role IDs do not exist
   */
  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: CREATE_PERMISSION_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Create a new permission',
      description: 'Creates a new permission with the provided information.',
    },
    body: {
      description: 'Permission creation data',
      type: CreatePermissionDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_GENERIC_BAD_REQUEST_MSG,
    },
    createdResponse: {
      description: 'Permission successfully created',
      type: PermissionResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: PERMISSION_CODE_EXISTS_MSG,
    },
    notFound: {
      description: ROLE_NOT_FOUND_MSG,
    },
  })
  async create(
    @Body()
    createDto: CreatePermissionDto,
    @CurrentUserId() createdById: UUID,
  ): Promise<PermissionResponseDto> {
    return await this.pipelineService.create({
      createDto,
      createdById,
    });
  }

  /**
   * Retrieves a permission by its unique identifier.
   *
   * Validates the requesting user's access and returns the permission if found.
   * @param id - The unique identifier of the permission to retrieve
   * @param requestedByUser - JWT payload of the user making the request
   * @returns The requested permission entity
   * @throws BadRequestException for validation errors
   * @throws EntityNotFoundError if the permission is not found
   */
  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_PERMISSION_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get permission by ID',
      description: 'Retrieves a permission by its unique identifier.',
    },
    okOperation: {
      description: 'Permission found and returned successfully',
      type: GetPermissionDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Permission id to search for',
    example: EXAMPLE_USER_ID,
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: UUID,
  ): Promise<GetPermissionDto> {
    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('code/:code')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_PERMISSION_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get permission by code',
      description: 'Retrieves a permission by its unique code.',
    },
    okOperation: {
      description: 'Permission found and returned successfully',
      type: GetPermissionDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Unique code of the permission to search for',
    example: EXAMPLE_PERMISSION_CODE,
  })
  async findByCode(@Param('code') code: string): Promise<GetPermissionDto> {
    return await this.pipelineService.getByCodeOrThrow(code);
  }

  @Patch('id/:id/name')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UPDATE_PERMISSION_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Update permission name',
      description: 'Updates the name of an existing permission.',
    },
    okOperation: {
      description: 'Permission name updated successfully',
      type: Boolean,
      isArray: false,
    },
    badRequestMessages: {
      examples: PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: PERMISSION_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Permission id to update',
    example: EXAMPLE_USER_ID,
  })
  async updateName(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body('name') name: string,
  ): Promise<boolean> {
    return await this.pipelineService.updateName({ name, id });
  }
}
