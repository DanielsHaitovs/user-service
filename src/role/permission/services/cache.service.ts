import { BaseCacheService } from '@/baseServices/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/libConst/permission.const';
import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly idCacheKeyPrefix = `${PERMISSION_QUERY_ALIAS}:id:`;

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set(permission: GetPermissionDto): Promise<void> {
    await this.cacheService.set<GetPermissionDto>({
      key: this.getIdCacheKeyPrefix(permission.id),
      value: permission,
    });
  }

  async invalidate(id: UUID): Promise<void> {
    await this.cacheService.del(this.getIdCacheKeyPrefix(id));
  }

  async revalidate(id: UUID): Promise<void> {
    await this.invalidate(id);

    const permission = await this.permissionsRepository.findOne({
      where: { id },
    });

    if (!permission) return;

    await this.set(permission);
  }

  async getById(id: UUID): Promise<GetPermissionDto | undefined> {
    return await this.cacheService.get<GetPermissionDto>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }
}
