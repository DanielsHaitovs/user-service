import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import {
  CREATE_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
} from '@/lib/const/store.const';
import { READ_USER } from '@/lib/const/user.const';
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
  @ApiOkList({
    permissions: [READ_USER, READ_STORE, CREATE_USER_STORE, READ_USER_STORE],
    operation: {
      summary: 'Assign stores to a user',
      description:
        'Assigns stores to a user with the provided store IDs. The user and stores must exist.',
    },
    body: {
      type: AssignStoresToUserDto,
      description: 'Data required to assign stores to a user',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'assignedById must be a valid UUID',
        'storeIds must be an array of valid UUIDs',
      ],
    },
  })
  async create(
    @Body() assignDto: AssignStoresToUserDto,
    // @CurrentUser() createdByUser: JWTPayload,
  ): Promise<void> {
    await this.userStorePipelineService.assignStoresToUser({
      data: assignDto,
      assignedById: '61a317c3-78ca-4b59-8d14-168343e2b1e6' as UUID,
    });
  }

  @Delete()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER, READ_STORE, CREATE_USER_STORE, READ_USER_STORE],
    operation: {
      summary: 'Remove stores from a user',
      description:
        'Removes stores from a user with the provided store IDs. The user and stores must exist.',
    },
    body: {
      type: UnassignStoresFromUserDto,
      description: 'Data required to remove stores from a user',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'assignedById must be a valid UUID',
        'storeIds must be an array of valid UUIDs',
      ],
    },
  })
  async remove(
    @Body() unassignDto: UnassignStoresFromUserDto,
    // @CurrentUser() createdByUser: JWTPayload,
  ): Promise<void> {
    await this.userStorePipelineService.unassignStoresFromUser(unassignDto);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_USER_STORE, READ_STORE, READ_USER],
    operation: {
      summary: 'Searches for user stores by user ID',
      description: 'Searches for user stores by their user unique identifiers',
    },
    badRequestMessages: {
      examples: ['user id must be a valid UUID', 'user id is required'],
    },
    okOperation: {
      description:
        'Returns a list of user stores matching the provided user ID',
      type: UserStoresListResponseDto,
      isArray: false,
    },
  })
  async findStoresByUserId(
    @Query() query: UserStoresQueryRequest,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<UserStoresListResponseDto> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.userStorePipelineService.getStores(query);
  }
}
