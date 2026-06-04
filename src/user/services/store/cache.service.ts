import { BaseCacheService } from '@/baseServices/cache.service';
import { USER_STORES_QUERY_ALIAS } from '@/libConst/store.const';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { UserStores } from '@/userEntities/userStores.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly idCacheKeyPrefix = `${USER_STORES_QUERY_ALIAS}:id:`;

  constructor(
    @InjectRepository(UserStores)
    private readonly userStoreRepository: Repository<UserStores>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set({
    id,
    stores,
  }: {
    id: UUID;
    stores: GetRelatedStoreDto[];
  }): Promise<void> {
    await this.cacheService.set<GetRelatedStoreDto[]>({
      key: this.getIdCacheKeyPrefix(id),
      value: stores,
    });
  }

  async getById(id: UUID): Promise<GetRelatedStoreDto[] | undefined> {
    return await this.cacheService.get<GetRelatedStoreDto[]>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  async invalidate(id: UUID): Promise<void> {
    await this.cacheService.del(this.getIdCacheKeyPrefix(id));
    await this.cacheService.invalidatePaginatedCache(USER_STORES_QUERY_ALIAS);
  }

  async revalidate(id: UUID): Promise<void> {
    await this.invalidate(id);

    const userStores = await this.userStoreRepository.find({
      where: {
        user: { id },
      },
      relations: ['store'],
    });

    if (userStores.length > 0) {
      await this.set({ id, stores: userStores.map(({ store }) => store) });
    }
  }

  private getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }
}
