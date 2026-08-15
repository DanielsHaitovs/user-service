import { CacheService } from '@/baseServices/cache.service';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { GetUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
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

export type FetchedUser = GetUserDto;

@Injectable()
export class FetchUserPipe
  implements PipeTransform<string, Promise<FetchedUser>>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async transform(value: string): Promise<FetchedUser> {
    if (!value || !isUUID(value)) {
      throw new BadRequestException({
        message: 'user id must be a UUID',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const userId = value as UUID;

    const cachedUser = await this.cacheService.getById<GetUserDto>({
      id: userId,
      alias: USER_QUERY_ALIAS,
    });

    if (cachedUser) {
      return cachedUser;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: userId,
      alias: USER_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetUserDto>({
      key: cacheKey,
      operation: async () => {
        const user = await this.userRepository.findOneByOrFail({
          id: userId,
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
