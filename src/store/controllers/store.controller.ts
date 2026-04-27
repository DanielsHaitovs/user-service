import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import {
  CONFLICT_STORE_NAME_MSG,
  CREATE_STORE,
  EXAMPLE_STORE_CODE,
  EXAMPLE_STORE_ID,
  EXAMPLE_STORE_VIEW_CODE,
  READ_STORE,
  STORE_GENERIC_BAD_REQUEST_MSG,
  STORE_MIN_OPERATION_BAD_REQUEST_MSG,
  STORE_NOT_FOUND_MSG,
} from '@/lib/const/store.const';
import { StorePipelineService } from '@/store/store.pipeline';
import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
} from '@/storeDto/store.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Stores')
@Controller({ path: 'store', version: ['1'] })
@TraceController()
export class StoreController {
  constructor(protected readonly pipelineService: StorePipelineService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [CREATE_STORE],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<StoreResponseDto> {
    // const { hasAccessToUsers, id } = this.extractAccess(requestedByUser);

    return await this.pipelineService.create({
      createDto,
      createdById: '61a317c3-78ca-4b59-8d14-168343e2b1e6' as UUID,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_STORE],
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
  async findById(
    @Param('id', ParseUUIDPipe) id: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetStoreDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByIdOrThrow(id);
  }

  @Get('code/:code')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_STORE],
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
  async findByCode(
    @Param('code') code: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetStoreDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByCodeOrThrow(code);
  }

  @Get('viewCode/:viewCode')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_STORE],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetStoreDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);

    return await this.pipelineService.getByViewCodeOrThrow(viewCode);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_STORE],
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
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<StoreListResponseDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.pipelineService.getMany(query);
  }
}
