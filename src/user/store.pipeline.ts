import { CacheService } from '@/baseServices/cache.service';
import { UserAction } from '@/common/enum/action.enum';
import { UserWithStores } from '@/common/pipes/userStores.pipe';
import { USER_STORES_QUERY_ALIAS } from '@/commonConst/store.const';
import { ClientMetadata } from '@/commonDecorators/meta.decorator';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { AuditProducerService } from '@/user/services/audit.service';
import {
  AssignStoresToUserDto,
  UnassignStoresFromUserDto,
  UserStoresListResponseDto,
  UserStoresQueryRequest,
} from '@/userDto/stores.dto';
import { UserStoresService } from '@/userStoreServices/store.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserStorePipelineService {
  constructor(
    private readonly userStoresService: UserStoresService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditProducerService,
  ) {}

  async getStores(
    data: UserStoresQueryRequest,
  ): Promise<UserStoresListResponseDto> {
    return await this.userStoresService.getStores(data);
  }

  async assignStoresToUser({
    data,
    userStores,
    assignedById,
    metadata,
  }: {
    data: AssignStoresToUserDto;
    userStores: UserWithStores;
    assignedById: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const {
      user: { id: userId },
      stores,
    } = userStores;

    const result = await this.userStoresService.assignStoresToUser({
      data,
      userId,
      assignedStores: stores,
      assignedById,
    });

    if (!result) {
      return;
    }

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
    });

    const assignedStores = await this.getAssignedStores(userId);

    await this.auditService.sendStoreLog({
      createdAt: new Date(),
      userId: assignedById,
      action: UserAction.ASSIGN_STORE,
      details: `Assigned stores to user ${userId}`,
      targetUserId: userId,
      oldState: stores,
      newState: assignedStores,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  async unassignStoresFromUser({
    userStores,
    data,
    metadata,
    requestedById,
  }: {
    userStores: UserWithStores;
    data: UnassignStoresFromUserDto;
    requestedById: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const {
      user: { id: userId },
      stores,
    } = userStores;

    const result = await this.userStoresService.unassignStoresFromUser({
      userId,
      data,
      assignedStores: stores,
    });

    if (!result) {
      return;
    }

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
    });

    const assignedStores = await this.getAssignedStores(userId);

    await this.auditService.sendStoreLog({
      createdAt: new Date(),
      userId: requestedById,
      action: UserAction.REVOKE_STORE,
      details: `Unassign stores to user ${userId}`,
      targetUserId: userId,
      oldState: stores,
      newState: assignedStores,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  async getAssignedStores(userId: UUID): Promise<GetRelatedStoreDto[]> {
    const cachedStores = await this.cacheService.getById<GetRelatedStoreDto[]>({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
    });

    if (cachedStores) {
      return cachedStores;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetRelatedStoreDto[]>({
      key: cacheKey,
      operation: async () => {
        const stores = await this.userStoresService.getAssignedStores(userId);

        await this.cacheService.set<GetRelatedStoreDto[]>({
          key: cacheKey,
          value: stores,
        });

        return stores;
      },
    });
  }
}
