import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/base/helper/permissions';
import {
  CONFLICT_STORE_NAME_MSG,
  EXAMPLE_STORE_CODE,
  EXAMPLE_STORE_ID,
  EXAMPLE_STORE_VIEW_CODE,
  READ_USER_STORE,
  STORE_GENERIC_BAD_REQUEST_MSG,
  STORE_MIN_OPERATION_BAD_REQUEST_MSG,
  STORE_NOT_FOUND_MSG,
  UNASSIGN_USER_STORE,
} from '@/commonConst/store.const';
import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/commonDecorators/user.decorator';
import { StorePipelineService } from '@/store/store.pipeline';
import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '@/storeDto/store.dto';
import {
  CREATE_STORE_ENDPOINT_PERMISSION,
  DELETE_STORE_ENDPOINT_PERMISSION,
  READ_STORE_ENDPOINT_PERMISSION,
  UPDATE_STORE_ENDPOINT_PERMISSION,
} from '@/system/const/store.const';
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

@ApiTags('Stores')
@Controller({ path: 'store', version: ['1'] })
@TraceController()
@ApiBearerAuth('JWT-auth')
export class StoreController {
  constructor(protected readonly pipelineService: StorePipelineService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: CREATE_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Create a new store',
      description: 'Creates a new store with the provided information.',
    },
    body: {
      description: 'Store creation data',
      type: CreateStoreDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: STORE_GENERIC_BAD_REQUEST_MSG,
    },
    createdResponse: {
      description: 'Role successfully created',
      type: StoreResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: CONFLICT_STORE_NAME_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
  })
  async create(
    @Body()
    createDto: CreateStoreDto,
    @CurrentUserId() createdById: UUID,
  ): Promise<StoreResponseDto> {
    return await this.pipelineService.create({
      createDto,
      createdById,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get store by ID',
      description: 'Retrieves a store by its unique identifier.',
    },
    okOperation: {
      description: 'Store found and returned successfully',
      type: GetStoreDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: STORE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Store id to search for',
    example: EXAMPLE_STORE_ID,
  })
  async findById(@Param('id', ParseUUIDPipe) id: UUID): Promise<GetStoreDto> {
    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('code/:code')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get store by code',
      description: 'Retrieves a store by its code.',
    },
    okOperation: {
      description: 'Store found and returned successfully',
      type: GetStoreDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: STORE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Store code to search for',
    example: EXAMPLE_STORE_CODE,
  })
  async findByCode(@Param('code') code: UUID): Promise<GetStoreDto> {
    return await this.pipelineService.getByCodeOrThrow(code);
  }

  @Get('viewCode/:viewCode')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Get store by view code',
      description: 'Retrieves a store by its view code.',
    },
    okOperation: {
      description: 'Store found and returned successfully',
      type: GetStoreDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: STORE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
  })
  @ApiParam({
    name: 'viewCode',
    type: String,
    description: 'Store code to search for',
    example: EXAMPLE_STORE_VIEW_CODE,
  })
  async findByViewCode(
    @Param('viewCode') viewCode: string,
  ): Promise<GetStoreDto> {
    return await this.pipelineService.getByViewCodeOrThrow(viewCode);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Searches for stores by various parameters',
      description:
        'Searches for stores by their unique identifiers, names, codes or viewCodes. If no query parameters are provided, returns all stores.',
    },
    badRequestMessages: {
      examples: ['store id must be a valid UUID', 'store id is required'],
    },
    okOperation: {
      description:
        'Returns a list of stores matching the provided query parameters',
      type: StoreListResponseDto,
      isArray: false,
    },
  })
  async findStores(
    @Query() query: StoreQueryRequest,
  ): Promise<StoreListResponseDto> {
    return await this.pipelineService.getMany(query);
  }

  @Patch(':id/name')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UPDATE_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Update store',
      description: 'Update of an existing store.',
    },
    body: {
      description: 'Store update data',
      type: UpdateStoreDto,
      isArray: false,
    },
    badRequestMessages: {
      examples: STORE_GENERIC_BAD_REQUEST_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateDto: UpdateStoreDto,
  ): Promise<boolean> {
    return await this.pipelineService.update({ updateDto, id });
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: DELETE_STORE_ENDPOINT_PERMISSION,
    loose: [READ_USER_STORE, UNASSIGN_USER_STORE],
  })
  @ApiOkList({
    operation: {
      summary: 'Delete store',
      description:
        'Deletes a store by its unique identifier. If the store is assigned to users, it will either unassign the store from those users or throw an error based on the `canDeleteAssignedStore` flag.',
    },
    badRequestMessages: {
      examples: STORE_MIN_OPERATION_BAD_REQUEST_MSG,
    },
    notFound: {
      description: STORE_NOT_FOUND_MSG,
    },
    conflictMessage: {
      description: 'Store cannot be deleted due to existing user assignments.',
    },
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: UUID,
    @CurrentUser() requestedByUser: JwtPayload,
  ): Promise<void> {
    const { canReadUserStore, canUnassignUserFromStore } =
      extractAccess(requestedByUser);

    const canDeleteAssignedStore = canReadUserStore && canUnassignUserFromStore;

    await this.pipelineService.delete({
      id,
      canDeleteAssignedStore,
    });
  }
}
