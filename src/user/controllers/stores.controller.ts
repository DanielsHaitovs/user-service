import { Permissions } from '@/commonDecorators/permission.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { CurrentUserId } from '@/commonDecorators/user.decorator';
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

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    required: ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
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
  async assign(
    @Body() assignDto: AssignStoresToUserDto,
    @CurrentUserId() assignedById: UUID,
  ): Promise<void> {
    await this.userStorePipelineService.assignStoresToUser({
      data: assignDto,
      assignedById,
    });
  }

  @Delete()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    required: UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  })
  @ApiOperation({
    summary: 'Unassign stores from a user',
    description:
      'Unassigns stores from a user with the provided store IDs. The user and stores must exist.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Invalid input data for unassigning stores from a user',
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
  async unassign(
    @Body() unassignDto: UnassignStoresFromUserDto,
  ): Promise<void> {
    await this.userStorePipelineService.unassignStoresFromUser(unassignDto);
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
  async findStoresByUserId(
    @Query() query: UserStoresQueryRequest,
  ): Promise<UserStoresListResponseDto> {
    return await this.userStorePipelineService.getStores(query);
  }
}
