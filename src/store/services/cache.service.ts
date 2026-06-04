import { BaseCacheService } from '@/baseServices/cache.service';
import { STORE_QUERY_ALIAS } from '@/libConst/store.const';
import { StoreResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly idCacheKeyPrefix = `${STORE_QUERY_ALIAS}:id:`;

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set(store: StoreResponseDto): Promise<void> {
    await this.cacheService.set<StoreResponseDto>({
      key: this.getIdCacheKeyPrefix(store.id),
      value: store,
    });
  }

  async invalidate(id: UUID): Promise<void> {
    await Promise.all([
      this.cacheService.del(this.getIdCacheKeyPrefix(id)),
      this.cacheService.invalidatePaginatedCache(STORE_QUERY_ALIAS),
    ]);
  }

  async revalidate(id: UUID): Promise<void> {
    await this.invalidate(id);

    const store = await this.storeRepository.findOne({
      where: { id },
    });

    if (store) {
      await this.set(store);
    }
  }

  async getById(id: UUID): Promise<StoreResponseDto | undefined> {
    return await this.cacheService.get<StoreResponseDto>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }
}
