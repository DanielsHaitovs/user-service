import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetUserDto } from '@/user/dto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';

import { UUID } from 'crypto';

export interface UserWithRoles {
  user: GetUserDto;
  roles: GetRelatedRoleDto[];
}

@Injectable()
export class FetchUserRolesPipe
  implements PipeTransform<string, Promise<UserWithRoles>>
{
  constructor(
    private readonly queryService: EntityQueryService,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<UserWithRoles> {
    const [user, roles] = await Promise.all([
      this.getUser(value),
      this.getUserRoles(value),
    ]);

    return { user, roles };
  }

  private getUser(userId: UUID): Promise<GetUserDto> {
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

  private getUserRoles(userId: UUID): Promise<GetRelatedRoleDto[]> {
    return this.cacheService.coalesce<GetRelatedRoleDto[]>({
      key: this.cacheService.getIdKeyPrefixByAlias({
        id: userId,
        alias: USER_ROLE_QUERY_ALIAS,
      }),
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
          cacheId: userId,
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
