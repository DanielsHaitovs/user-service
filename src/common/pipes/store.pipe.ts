import { CacheService } from '@/base/service/cache.service';
import { STORE_QUERY_ALIAS } from '@/commonConst/store.const';
import { GetStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class FetchStorePipe
  implements PipeTransform<string, Promise<GetStoreDto>>
{
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<GetStoreDto> {
    const cachedRole = await this.cacheService.getById<GetStoreDto>({
      id: value,
      alias: STORE_QUERY_ALIAS,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: value,
      alias: STORE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetStoreDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.storeRepository.findOneByOrFail({
          id: value,
        });

        await this.cacheService.set<GetStoreDto>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }
}
