import { BaseCacheService } from '@/baseServices/cache.service';
import { USER_ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly idCacheKeyPrefix = `${USER_ROLE_QUERY_ALIAS}:id:`;

  constructor(
    @InjectRepository(UserRoles)
    private readonly userRoleRepository: Repository<UserRoles>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set({
    id,
    roles,
  }: {
    id: UUID;
    roles: GetRelatedRoleDto[];
  }): Promise<void> {
    await this.cacheService.set<GetRelatedRoleDto[]>({
      key: this.getIdCacheKeyPrefix(id),
      value: roles,
    });
  }

  async getById(id: UUID): Promise<GetRelatedRoleDto[] | undefined> {
    return await this.cacheService.get<GetRelatedRoleDto[]>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  async invalidate(id: UUID): Promise<void> {
    await this.cacheService.del(this.getIdCacheKeyPrefix(id));
    await this.cacheService.invalidatePaginatedCache(USER_ROLE_QUERY_ALIAS);
  }

  async revalidate(id: UUID): Promise<void> {
    await this.invalidate(id);

    const userRoles = await this.userRoleRepository.find({
      where: {
        user: { id },
      },
      relations: ['role'],
    });

    if (userRoles.length > 0) {
      await this.set({ id, roles: userRoles.map(({ role }) => role) });
    }
  }

  private getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }
}
