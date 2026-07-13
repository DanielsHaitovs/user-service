import { CacheService } from '@/baseServices/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { PermissionService } from '@/permissionServices/permission.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class PermissionPipelineService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
  ) {}

  async getByIdOrThrow(id: UUID): Promise<GetPermissionDto> {
    const cachedPermission = await this.cacheService.getById<GetPermissionDto>({
      id,
      alias: PERMISSION_QUERY_ALIAS,
    });

    if (cachedPermission) {
      return cachedPermission;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id,
      alias: PERMISSION_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetPermissionDto>({
      key: cacheKey,
      operation: async () => {
        const permission = await this.permissionService.getByIdOrThrow(id);

        await this.cacheService.set<GetPermissionDto>({
          key: cacheKey,
          value: permission,
          ttl: 3600 * 24 * 7,
        });

        return permission;
      },
    });
  }

  async getByCodeOrThrow(code: string): Promise<GetPermissionDto> {
    return await this.permissionService.getByCodeOrThrow(code);
  }
}
