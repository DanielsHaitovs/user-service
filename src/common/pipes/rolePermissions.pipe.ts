import { CacheService } from '@/base/service/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

export type FetchedRole = RoleResponseDto;

@Injectable()
export class FetchRolePermissionsPipe
  implements PipeTransform<string, Promise<FetchedRole>>
{
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<FetchedRole> {
    const cachedRole = await this.cacheService.getById<FetchedRole>({
      id: value,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: value,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    return await this.cacheService.coalesce<FetchedRole>({
      key: cacheKey,
      operation: async () => {
        const role = await this.rolesRepository.findOneOrFail({
          where: { id: value },
          relations: ['permissions'],
        });

        await this.cacheService.set<FetchedRole>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }
}
