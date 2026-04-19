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
  constructor(private readonly userStoresService: UserStoresService) {}

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
  }

  async unassignStoresFromUser({
    userId,
    storeIds,
  }: UnassignStoresFromUserDto): Promise<void> {
    await this.userStoresService.unassignStoresFromUser({ userId, storeIds });
  }
}
