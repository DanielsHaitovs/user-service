import {
  EXAMPLE_PERMISSION_CODE,
  PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG,
  PERMISSION_NOT_FOUND_MSG,
} from '@/commonConst/permission.const';
import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { READ_PERMISSION_ENDPOINT_PERMISSION } from '@/system/const/permission.const';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
}
