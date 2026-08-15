import { CacheService } from '@/baseServices/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
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

  async transform(value: string): Promise<FetchedRole> {
    if (!value || !isUUID(value)) {
      throw new BadRequestException({
        message: 'role id must be a UUID',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const roleId = value as UUID;
    const cachedRole = await this.cacheService.getById<FetchedRole>({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    return await this.cacheService.coalesce<FetchedRole>({
      key: cacheKey,
      operation: async () => {
        const role = await this.rolesRepository.findOneOrFail({
          where: { id: roleId },
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
