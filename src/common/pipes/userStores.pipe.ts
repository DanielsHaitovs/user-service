import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { USER_STORES_QUERY_ALIAS } from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { GetUserDto } from '@/user/dto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';

import { isUUID } from 'class-validator';
import { UUID } from 'crypto';

export interface UserWithStores {
  user: GetUserDto;
  stores: GetRelatedStoreDto[];
}

@Injectable()
export class FetchUserStoresPipe
  implements PipeTransform<string, Promise<UserWithStores>>
{
  constructor(
    private readonly queryService: EntityQueryService,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: string): Promise<UserWithStores> {
    if (!value || !isUUID(value)) {
      throw new BadRequestException({
        message: ['each value in storeIds must be a UUID'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const userId = value as UUID;

    const [user, stores] = await Promise.all([
      this.getUser(userId),
      this.getUserStores(userId),
    ]);

    return { user, stores };
  }

  private async getUser(userId: UUID): Promise<GetUserDto> {
    const cached = await this.cacheService.getById<GetUserDto>({
      id: userId,
      alias: USER_QUERY_ALIAS,
    });

    if (cached != undefined) {
      return cached;
    }

    return this.cacheService.coalesce<GetUserDto>({
      key: this.cacheService.getIdKeyPrefixByAlias({
        id: userId,
        alias: USER_QUERY_ALIAS,
      }),
      operation: async () => {
        const query = this.queryService.initQuery<User>({
          entity: User,
          alias: USER_QUERY_ALIAS,
        });

        const user = await query
          .where(`${USER_QUERY_ALIAS}.id = :userId`, { userId })
          .getOneOrFail();

        await this.cacheService.set<GetUserDto>({
          key: this.cacheService.getIdKeyPrefixByAlias({
            id: userId,
            alias: USER_QUERY_ALIAS,
          }),
          value: user,
        });

        return user;
      },
    });
  }

  private async getUserStores(userId: UUID): Promise<GetRelatedStoreDto[]> {
    const cached = await this.cacheService.getById<GetRelatedStoreDto[]>({
      id: userId,
      alias: USER_STORES_QUERY_ALIAS,
    });

    if (cached != undefined) {
      return cached;
    }

    return this.cacheService.coalesce<GetRelatedStoreDto[]>({
      key: this.cacheService.getIdKeyPrefixByAlias({
        id: userId,
        alias: USER_STORES_QUERY_ALIAS,
      }),
      operation: async () => {
        const query = this.queryService
          .initQuery<UserStores>({
            entity: UserStores,
            alias: USER_STORES_QUERY_ALIAS,
          })
          .leftJoinAndSelect(`${USER_STORES_QUERY_ALIAS}.store`, 'store')
          .leftJoinAndSelect(`${USER_STORES_QUERY_ALIAS}.user`, 'user')
          .where('user.id = :userId', { userId })
          .select([
            `${USER_STORES_QUERY_ALIAS}.id`,
            'store.id',
            'store.name',
            'store.createdAt',
            'store.updatedAt',
          ]);

        const userStores = await this.queryService.getAll<UserStores>({
          query,
        });

        const stores = userStores.map((userStore) => userStore.store);

        await this.cacheService.set<GetRelatedStoreDto[]>({
          key: this.cacheService.getIdKeyPrefixByAlias({
            id: userId,
            alias: USER_STORES_QUERY_ALIAS,
          }),
          value: stores,
        });

        return stores;
      },
    });
  }
}
