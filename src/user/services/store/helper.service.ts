import { EntityQueryService } from '@/base/service/query.service';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { UserStores } from '@/userEntities/userStores.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UserStoreHelperService {
  constructor(
    @InjectRepository(UserStores)
    private readonly storeRepository: Repository<UserStores>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves the stores assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetRelatedStoreDto objects representing the user's stores.
   */
  async getAssignedStores(userId: UUID): Promise<GetRelatedStoreDto[]> {
    const query = this.storeRepository
      .createQueryBuilder('userStore')
      .leftJoinAndSelect('userStore.store', 'store')
      .leftJoinAndSelect('userStore.user', 'user')
      .where('user.id = :userId', { userId })
      .select([
        'userStore.id',
        'store.id',
        'store.name',
        'store.code',
        'store.viewCode',
        'store.createdAt',
        'store.updatedAt',
      ]);

    const userStores = await this.queryService.getAll<UserStores>({
      query,
      cache: true,
    });

    return userStores.map((userStore) => ({
      id: userStore.store.id,
      name: userStore.store.name,
      code: userStore.store.code,
      viewCode: userStore.store.viewCode,
      createdAt: userStore.store.createdAt,
      updatedAt: userStore.store.updatedAt,
    }));
  }
}
