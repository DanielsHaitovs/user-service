import { CacheService } from '@/baseServices/cache.service';
import { STORE_QUERY_ALIAS } from '@/commonConst/store.const';
import { GetStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isUUID } from 'class-validator';
import { UUID } from 'crypto';
import { Repository } from 'typeorm';

export type FetchedStore = GetStoreDto;

@Injectable()
export class FetchStorePipe
  implements PipeTransform<string, Promise<GetStoreDto>>
{
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: string): Promise<GetStoreDto> {
    if (!value || !isUUID(value)) {
      throw new BadRequestException({
        message: 'store id must be a UUID',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const storeId = value as UUID;

    const cachedStore = await this.cacheService.getById<GetStoreDto>({
      id: storeId,
      alias: STORE_QUERY_ALIAS,
    });

    if (cachedStore) {
      return cachedStore;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: storeId,
      alias: STORE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetStoreDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.storeRepository.findOneByOrFail({
          id: storeId,
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
