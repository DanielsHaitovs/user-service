import { CacheService } from '@/base/service/cache.service';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { GetRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

export type FetchedRole = GetRoleDto;

@Injectable()
export class FetchRolePipe
  implements PipeTransform<string, Promise<GetRoleDto>>
{
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<GetRoleDto> {
    const cachedRole = await this.cacheService.getById<GetRoleDto>({
      id: value,
      alias: ROLE_QUERY_ALIAS,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: value,
      alias: ROLE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetRoleDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.rolesRepository.findOneByOrFail({
          id: value,
        });

        await this.cacheService.set<GetRoleDto>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }
}
