import {
  AssignStoresToUserDto,
  GetUserStoreDto,
  UnassignStoresFromUserDto,
} from '@/userDto/stores.dto';
import { UserStoresService } from '@/userService/store/store.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserStorePipelineService {
  constructor(private readonly userStoresService: UserStoresService) {}

  async getStoresOrThrow(userId: UUID): Promise<GetUserStoreDto[]> {
    return await this.userStoresService.getStoresOrThrow(userId);
  }

  async assignStoresToUser({
    userId,
    storeIds,
    assignedById,
  }: AssignStoresToUserDto): Promise<void> {
    await this.userStoresService.assignStoresToUser({
      userId,
      storeIds,
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
