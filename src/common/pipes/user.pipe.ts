import { CacheService } from '@/base/service/cache.service';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { GetUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { Injectable, type PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class FetchUserPipe
  implements PipeTransform<string, Promise<GetUserDto>>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: UUID): Promise<GetUserDto> {
    const cachedRole = await this.cacheService.getById<GetUserDto>({
      id: value,
      alias: USER_QUERY_ALIAS,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: value,
      alias: USER_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetUserDto>({
      key: cacheKey,
      operation: async () => {
        const user = await this.userRepository.findOneByOrFail({
          id: value,
        });

        await this.cacheService.set<GetUserDto>({
          key: cacheKey,
          value: user,
        });

        return user;
      },
    });
  }
}
