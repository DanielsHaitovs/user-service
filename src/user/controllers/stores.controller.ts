import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import {
  CREATE_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
} from '@/lib/const/store.const';
import { EXAMPLE_USER_ID, READ_USER } from '@/lib/const/user.const';
import {
  AssignStoresToUserDto,
  GetUserStoreDto,
  UnassignStoresFromUserDto,
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
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

import { UserStorePipelineService } from '../store.pipeline';

/**
 * REST API controller for comprehensive user store management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users Stores')
@Controller('user/stores')
@TraceController()
export class UserStoresController {
  constructor(
    protected readonly userStorePipelineService: UserStorePipelineService,
  ) {}

  @Post()
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
    await this.userStorePipelineService.assignStoresToUser(assignDto);
  }

  @Delete()
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

  @Get('userId/:userId')
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
      type: GetUserStoreDto,
      isArray: true,
    },
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
  })
  async findStoresByUserId(
    @Param('userId', ParseUUIDPipe) userId: UUID,
    // @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<GetUserStoreDto[]> {
    // const { hasAccessToDepartments, hasAccessToRoles, hasAccessToPermissions } =
    //   this.extractAccess(requestedByUser);
    return await this.userStorePipelineService.getStoresOrThrow(userId);
  }
}
