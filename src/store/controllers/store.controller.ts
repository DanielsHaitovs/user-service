import { JwtPayload } from '@/auth/auth.interface';
import { extractAccess } from '@/base/helper/permissions';
import {
  EXAMPLE_STORE_CODE,
  EXAMPLE_STORE_ID,
  EXAMPLE_STORE_VIEW_CODE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/commonConst/store.const';
import {
  ClientMetadata,
  GetClientMetadata,
} from '@/commonDecorators/meta.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUser, CurrentUserId } from '@/commonDecorators/user.decorator';
import { FetchStorePipe } from '@/commonPipes/store.pipe';
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Create a new store',
    description: 'Creates a new store with the provided information.',
  })
  @ApiOkResponse({
    description: 'Store successfully created',
    type: StoreResponseDto,
  })
  @ApiCreatedResponse({
    description: 'Store successfully created',
    type: StoreResponseDto,
  })
  @ApiConflictResponse({
    description: 'A store with the same name, code or viewCode already exists',
  })
  @ApiBody({
    description: 'Store creation data',
    type: CreateStoreDto,
    isArray: false,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data for creating a store',
    examples: {
      'Invalid store name': {
        summary: 'Invalid store name',
        value: {
          name: 1234,
        },
      },
      'Invalid store code': {
        summary: 'Invalid store code',
        value: {
          code: 1234,
        },
      },
      'Invalid store viewCode': {
        summary: 'Invalid store viewCode',
        value: {
          viewCode: 1234,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Internal Server Error - An unexpected error occurred while creating the store',
  })
  async create(
    @Body()
    createDto: CreateStoreDto,
    @CurrentUserId() createdById: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<StoreResponseDto> {
    return await this.pipelineService.create({
      createDto,
      createdById,
      metadata,
    });
  }

  @Get('id/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Get store by ID',
    description: 'Retrieves a store by its unique identifier.',
  })
  @ApiOkResponse({
    description: 'Store found and returned successfully',
    type: GetStoreDto,
  })
  @ApiNotFoundResponse({
    description: 'Store with the specified ID was not found',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid store ID format. Store ID must be a valid UUID.',
    examples: {
      'Invalid UUID format': {
        summary: 'Store ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
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
  @ApiOperation({
    summary: 'Get store by code',
    description: 'Retrieves a store by its code.',
  })
  @ApiOkResponse({
    description: 'Store found and returned successfully',
    type: GetStoreDto,
  })
  @ApiNotFoundResponse({
    description: 'Store with the specified code was not found',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid store code format. Store code must be a non-empty string.',
    examples: {
      'Empty store code': {
        summary: 'Empty store code',
        value: '',
      },
      'Invalid store code format': {
        summary: 'Invalid store code format',
        value: 12345,
      },
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
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid store view code format. Store view code must be a non-empty string.',
    examples: {
      'Empty store view code': {
        summary: 'Empty store view code',
        value: '',
      },
      'Invalid store view code format': {
        summary: 'Invalid store view code format',
        value: 12345,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Store with the specified view code was not found',
  })
  @ApiOperation({
    summary: 'Get store by view code',
    description: 'Retrieves a store by its view code.',
  })
  @ApiOkResponse({
    description: 'Store found and returned successfully',
    type: GetStoreDto,
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
  @ApiOperation({
    summary: 'Search for stores',
    description:
      'Searches for stores by their unique identifiers, names, codes or viewCodes. If no query parameters are provided, returns all stores.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters. Store IDs must be valid UUIDs and store names, codes and viewCodes must be valid strings.',
    examples: {
      'Invalid store ID format': {
        summary: 'Store ID is not a valid UUID',
        value: {
          ids: ['12345-invalid-uuid'],
        },
      },
      'Invalid store name format': {
        summary: 'Store name is not a valid string',
        value: {
          names: [1234],
        },
      },
      'Invalid store code format': {
        summary: 'Store code is not a valid string',
        value: {
          codes: [1234],
        },
      },
      'Invalid store viewCode format': {
        summary: 'Store viewCode is not a valid string',
        value: {
          viewCodes: [1234],
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Returns a list of stores matching the provided query parameters',
    type: StoreListResponseDto,
  })
  async findStores(
    @Query() query: StoreQueryRequest,
  ): Promise<StoreListResponseDto> {
    return await this.pipelineService.getMany(query);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UPDATE_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Update store',
    description: 'Updates the name, code or viewCode of an existing store.',
  })
  @ApiBody({
    description: 'Store update data',
    type: UpdateStoreDto,
    isArray: false,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data for updating a store',
    examples: {
      'Invalid store name': {
        summary: 'Invalid store name',
        value: {
          name: 1234,
        },
      },
      'Invalid store code': {
        summary: 'Invalid store code',
        value: {
          code: 1234,
        },
      },
      'Invalid store viewCode': {
        summary: 'Invalid store viewCode',
        value: {
          viewCode: 1234,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Store with the specified ID was not found',
  })
  @ApiConflictResponse({
    description: 'A store with the same name, code or viewCode already exists',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Store id to update',
    example: EXAMPLE_STORE_ID,
  })
  @ApiOkResponse({
    description: 'Store successfully updated',
    type: Boolean,
  })
  async update(
    @Param('id', FetchStorePipe) store: GetStoreDto,
    @Body() updateDto: UpdateStoreDto,
    @GetClientMetadata() metadata: ClientMetadata,
    @CurrentUserId() requestedByUserId: UUID,
  ): Promise<boolean> {
    return await this.pipelineService.update({
      updateDto,
      store,
      requestedByUserId,
      metadata,
    });
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: DELETE_STORE_ENDPOINT_PERMISSION,
    loose: [READ_USER_STORE, UNASSIGN_USER_STORE],
  })
  @ApiOperation({
    summary: 'Delete store',
    description:
      'Deletes a store by its unique identifier. If the store is assigned to users, it will either unassign the store from those users or throw an error based on the permissions of the requesting user.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid store ID format. Store ID must be a valid UUID.',
    examples: {
      'Invalid UUID format': {
        summary: 'Store ID is not a valid UUID',
        value: '12345-invalid-uuid',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Store with the specified ID was not found',
  })
  async delete(
    @Param('id', FetchStorePipe) store: GetStoreDto,
    @CurrentUser() requestedByUser: JwtPayload,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    const {
      canReadUserStore,
      canUnassignUserFromStore,
      id: requestedByUserId,
    } = extractAccess(requestedByUser);

    const canDeleteAssignedStore = canReadUserStore && canUnassignUserFromStore;

    await this.pipelineService.delete({
      store,
      canDeleteAssignedStore,
      requestedByUserId,
      metadata,
    });
  }
}
