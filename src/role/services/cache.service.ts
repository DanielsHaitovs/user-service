import { BaseCacheService } from '@/baseServices/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/libConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import { GetRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CacheService {
  private readonly idCacheKeyPrefix = `${ROLE_QUERY_ALIAS}:id:`;
  private readonly rolePermissionsCacheKeyPrefix = `${ROLE_QUERY_ALIAS}:${PERMISSION_QUERY_ALIAS}:id:`;

  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly cacheService: BaseCacheService,
  ) {}

  async set(role: GetRoleDto): Promise<void> {
    await this.cacheService.set<GetRoleDto>({
      key: this.getIdCacheKeyPrefix(role.id),
      value: role,
    });
  }

  async setRolePermissions(role: RoleResponseDto): Promise<void> {
    await this.cacheService.set<RoleResponseDto>({
      key: this.getRolePermissionsCacheKeyPrefix(role.id),
      value: role,
    });
  }

  async invalidate(id: UUID): Promise<void> {
    await Promise.all([
      this.cacheService.del(this.getIdCacheKeyPrefix(id)),
      this.cacheService.del(this.getRolePermissionsCacheKeyPrefix(id)),
      this.cacheService.invalidatePaginatedCache(ROLE_QUERY_ALIAS),
    ]);
  }

  async revalidate(id: UUID): Promise<void> {
    await this.invalidate(id);

    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) return;

    await this.set(role);
  }

  async revalidateRolePermissions(id: UUID): Promise<void> {
    await this.cacheService.del(this.getRolePermissionsCacheKeyPrefix(id));

    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!roleWithPermissions) return;

    await this.setRolePermissions(roleWithPermissions);
  }

  async getById(id: UUID): Promise<GetRoleDto | undefined> {
    return await this.cacheService.get<GetRoleDto>(
      this.getIdCacheKeyPrefix(id),
    );
  }

  async getWithRelatedPermissionsById(
    id: UUID,
  ): Promise<RoleResponseDto | undefined> {
    return await this.cacheService.get<RoleResponseDto>(
      this.getRolePermissionsCacheKeyPrefix(id),
    );
  }

  getIdCacheKeyPrefix(id: UUID): string {
    return this.idCacheKeyPrefix + id;
  }

  getRolePermissionsCacheKeyPrefix(id: UUID): string {
    return this.rolePermissionsCacheKeyPrefix + id;
  }
}
