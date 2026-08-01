import {
  FetchUserStoresPipe,
  UserWithStores,
} from '@/common/pipes/userStores.pipe';
import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { Idempotent } from '@/commonDecorators/idempotent.decorator';
import {
  ClientMetadata,
  GetClientMetadata,
} from '@/commonDecorators/meta.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUserId } from '@/commonDecorators/user.decorator';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import {
  ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  READ_USER_STORE_ENDPOINT_PERMISSION,
  UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
} from '@/system/const/user.const';
import { UserStorePipelineService } from '@/user/store.pipeline';
import {
  AssignStoresToUserDto,
  UnassignStoresFromUserDto,
  UserStoresListResponseDto,
  UserStoresQueryRequest,
} from '@/userDto/stores.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { UUID } from 'crypto';

/**
 * REST API controller for comprehensive user store management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users Stores')
@Controller({
  path: 'user/stores',
  version: ['1'],
})
@TraceController()
@ApiBearerAuth('JWT-auth')
export class UserStoresController {
  constructor(
    protected readonly userStorePipelineService: UserStorePipelineService,
  ) {}

  @Post('user/:id')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  @ApiOperation({
    summary: 'Assign stores to a user',
    description:
      'Assigns stores to a user with the provided store IDs. The user and stores must exist.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid input data for assigning stores to a user',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-userId-uuid',
          assignedById: '12345  -invalid-assignedById-uuid',
          storeIds: ['12345-invalid-storeId-uuid'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or one or more stores not found',
  })
  @ApiOkResponse({
    description: 'Stores successfully assigned to the user',
  })
  @Idempotent()
  async assign(
    @Param('id', FetchUserStoresPipe) userStores: UserWithStores,
    @Body() assignDto: AssignStoresToUserDto,
    @CurrentUserId() assignedById: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    await this.userStorePipelineService.assignStoresToUser({
      data: assignDto,
      assignedById,
      userStores,
      metadata,
    });
  }

  @Delete('user/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  @ApiOperation({
    summary: 'Unassign stores from a user',
    description:
      'Unassign stores from a user with the provided store IDs. The user and stores must exist.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid input data for unassigned stores from a user',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-userId-uuid',
          assignedById: '12345  -invalid-assignedById-uuid',
          storeIds: ['12345-invalid-storeId-uuid'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User or one of the provided stores are not found',
  })
  @ApiOkResponse({
    description: 'Stores successfully unassigned from the user',
  })
  @Idempotent()
  async unassign(
    @Param('id', FetchUserStoresPipe) userStores: UserWithStores,
    @Body() unassignDto: UnassignStoresFromUserDto,
    @CurrentUserId() requestedById: UUID,
    @GetClientMetadata() metadata: ClientMetadata,
  ): Promise<void> {
    await this.userStorePipelineService.unassignStoresFromUser({
      data: unassignDto,
      requestedById,
      userStores,
      metadata,
    });
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Searches for user stores by user ID',
    description: 'Searches for user stores by their user unique identifiers',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters for searching user stores',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-userId-uuid',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns a list of user stores matching the provided user ID',
    type: UserStoresListResponseDto,
  })
  async findStores(
    @Query() query: UserStoresQueryRequest,
  ): Promise<UserStoresListResponseDto> {
    return await this.userStorePipelineService.getStores(query);
  }

  @Get('assigned/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: READ_USER_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Searches for user stores by user ID',
    description: 'Searches for user stores by user unique identifiers',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid query parameters for searching user permissions',
    examples: {
      'Invalid userId format': {
        summary: 'Invalid userId format',
        value: {
          userId: '12345-invalid-uuid',
        },
      },
      'Missing userId': {
        summary: 'Missing required userId parameter',
        value: {},
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns a list of user stores matching the provided user ID',
    type: GetRelatedStoreDto,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findAssignedStoresByUserId(
    @Param('id', ParseUUIDPipe) userId: UUID,
  ): Promise<GetRelatedStoreDto[]> {
    return await this.userStorePipelineService.getAssignedStores(userId);
  }
}
