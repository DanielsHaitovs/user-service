import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { USER_STORES_QUERY_ALIAS } from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { GetUserDto } from '@/user/dto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';

import { UUID } from 'crypto';

export interface FullUser {
  user: GetUserDto;
  stores: GetRelatedStoreDto[];
  roles: GetRelatedRoleDto[];
}

@Injectable()
export class FetchFullUserPipe
  implements PipeTransform<string, Promise<FullUser>>
{
  constructor(
    private readonly queryService: EntityQueryService,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<FullUser> {
    const [user, stores, roles] = await Promise.all([
      this.getUser(value),
      this.getUserStores(value),
      this.getUserRoles(value),
    ]);

    return { user, stores, roles };
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

  private async getUserRoles(userId: UUID): Promise<GetRelatedRoleDto[]> {
    const cached = await this.cacheService.getById<GetRelatedRoleDto[]>({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    if (cached != undefined) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    return this.cacheService.coalesce<GetRelatedRoleDto[]>({
      key: cacheKey,
      operation: async () => {
        const query = this.queryService
          .initQuery<UserRoles>({
            entity: UserRoles,
            alias: USER_ROLE_QUERY_ALIAS,
          })
          .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.role`, 'role')
          .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.user`, 'user')
          .where('user.id = :userId', { userId })
          .select([
            `${USER_ROLE_QUERY_ALIAS}.id`,
            'role.id',
            'role.name',
            'role.createdAt',
            'role.updatedAt',
          ]);

        const userRoles = await this.queryService.getAll<UserRoles>({
          query,
        });

        const roles = userRoles.map((userRole) => userRole.role);

        await this.cacheService.set<GetRelatedRoleDto[]>({
          key: this.cacheService.getIdKeyPrefixByAlias({
            id: userId,
            alias: USER_ROLE_QUERY_ALIAS,
          }),
          value: roles,
        });

        return roles;
      },
    });
  }
}
