import { BaseCacheService } from '@/baseServices/cache.service';
import { USER_ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import { USER_STORES_QUERY_ALIAS } from '@/lib/const/store.const';
import { USER_QUERY_ALIAS } from '@/libConst/user.const';
import { GetUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly logService = new Logger('UserCacheService');
  private readonly idCacheKeyPrefix = `${USER_QUERY_ALIAS}:id:`;
  private readonly emailCacheKeyPrefix = `${USER_QUERY_ALIAS}:email:`;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set(user: GetUserDto): Promise<void> {
    await Promise.all([
      this.cacheService.set<GetUserDto>({
        key: this.getIdCacheKeyPrefix(user.id),
        value: user,
      }),
      this.cacheService.set<GetUserDto>({
        key: this.getEmailCacheKeyPrefix(user.email),
        value: user,
      }),
    ]);
  }

  async getById(id: UUID): Promise<GetUserDto | undefined> {
    return await this.cacheService.get<GetUserDto>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  async getByEmail(email: string): Promise<GetUserDto | undefined> {
    return await this.cacheService.get<GetUserDto>(
      this.getEmailCacheKeyPrefix(email),
    );
  }

  async invalidate({
    id,
    email,
  }: {
    id?: UUID | undefined;
    email?: string | undefined;
  }): Promise<void> {
    if (id == undefined && email == undefined) {
      this.logService.warn(
        `No valid identifier provided for cache invalidation. Skipping...`,
      );
      return;
    }

    await Promise.all([
      email != undefined
        ? this.cacheService.del(this.getEmailCacheKeyPrefix(email))
        : undefined,
      id != undefined
        ? this.cacheService.del(this.getIdCacheKeyPrefix(id))
        : undefined,
      this.cacheService.invalidatePaginatedCache(USER_QUERY_ALIAS),
      this.cacheService.del(USER_STORES_QUERY_ALIAS),
      this.cacheService.del(USER_ROLE_QUERY_ALIAS),
    ]);

    await this.cacheService.invalidatePaginatedCache(USER_QUERY_ALIAS);
  }

  async revalidate({
    id,
    email,
  }: {
    id?: UUID | undefined;
    email?: string | undefined;
  }): Promise<void> {
    if (id == undefined && email == undefined) {
      this.logService.warn(
        `No valid identifier provided for cache revalidation. Skipping...`,
      );
      return;
    }

    await this.invalidate({ id, email });

    const store = await this.userRepository.findOne({
      where: {
        ...(id != undefined ? { id } : {}),
        ...(email != undefined ? { email } : {}),
      },
    });

    if (store) {
      await this.set(store);
    }
  }

  getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }

  getEmailCacheKeyPrefix(email: string): string {
    return this.emailCacheKeyPrefix + email;
  }
}
