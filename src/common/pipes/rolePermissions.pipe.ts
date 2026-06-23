import { CacheService } from '@/base/service/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity'; // Adjust path
import { Injectable, type PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class FetchRolePermissionsPipe
  implements PipeTransform<string, Promise<RoleResponseDto>>
{
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<RoleResponseDto> {
    const cachedRole = await this.cacheService.getById<RoleResponseDto>({
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

    return await this.cacheService.coalesce<RoleResponseDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.rolesRepository.findOneOrFail({
          where: { id: value },
          relations: ['permissions'],
        });

        await this.cacheService.set<RoleResponseDto>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }
}
