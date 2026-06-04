import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import {
  AssignStoresToUserDto,
  UnassignStoresFromUserDto,
  UserStoresListResponseDto,
  UserStoresQueryRequest,
} from '@/userDto/stores.dto';
import { CacheService } from '@/userStoreServices/cache.service';
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

    await this.cacheService.revalidate(data.userId);
  }

  async unassignStoresFromUser({
    userId,
    storeIds,
  }: UnassignStoresFromUserDto): Promise<void> {
    await this.userStoresService.unassignStoresFromUser({ userId, storeIds });

    await this.cacheService.revalidate(userId);
  }

  async getAssignedStores(userId: UUID): Promise<GetRelatedStoreDto[]> {
    const cachedStores = await this.cacheService.getById(userId);

    if (cachedStores) {
      return cachedStores;
    }

    const stores = await this.userStoresService.getAssignedStores(userId);

    await this.cacheService.set({ id: userId, stores });

    return stores;
  }
}
