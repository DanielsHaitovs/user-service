import { CacheService } from '@/baseServices/cache.service';
import { USER_STORES_QUERY_ALIAS } from '@/commonConst/store.const';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
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
  ) {}

  async getStores(
    data: UserStoresQueryRequest,
  ): Promise<UserStoresListResponseDto> {
    return await this.userStoresService.getStores(data);
  }

  async assignStoresToUser({
    data,
    assignedById,
  }: {
    data: AssignStoresToUserDto;
    assignedById: UUID;
  }): Promise<void> {
    await this.userStoresService.assignStoresToUser({
      data,
      assignedById,
    });

    await this.cacheService.invalidateById({
      id: data.userId,
      alias: USER_STORES_QUERY_ALIAS,
    });
  }

  async unassignStoresFromUser({
    userId,
    storeIds,
  }: UnassignStoresFromUserDto): Promise<void> {
    await this.userStoresService.unassignStoresFromUser({ userId, storeIds });

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
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
