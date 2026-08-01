import { CacheService } from '@/baseServices/cache.service';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { GetRoleDto } from '@/roleDto/role.dto';
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

  async transform(value: string): Promise<GetRoleDto> {
    if (!value || !isUUID(value)) {
      throw new BadRequestException({
        message: 'store id must be a UUID',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const roleId = value as UUID;

    const cachedRole = await this.cacheService.getById<GetRoleDto>({
      id: roleId,
      alias: ROLE_QUERY_ALIAS,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: roleId,
      alias: ROLE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetRoleDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.rolesRepository.findOneByOrFail({
          id: roleId,
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
