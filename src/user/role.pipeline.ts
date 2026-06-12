import { CacheService } from '@/baseServices/cache.service';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import {
  AssignRolesToUserDto,
  UnassignRolesFromUserDto,
  UserRolesListResponseDto,
  UserRolesQueryRequest,
} from '@/userDto/roles.dto';
import { UserRolesService } from '@/userRoleServices/role.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserRolePipelineService {
  constructor(
    private readonly userRolesService: UserRolesService,
    private readonly cacheService: CacheService,
  ) {}

  async getRoles(
    query: UserRolesQueryRequest,
  ): Promise<UserRolesListResponseDto> {
    return await this.userRolesService.getRoles(query);
  }

  async getPermissions(userId: UUID): Promise<string[]> {
    return await this.userRolesService.getPermissions(userId);
  }

  async assignRolesToUser({
    data,
    assignedById,
  }: {
    data: AssignRolesToUserDto;
    assignedById: UUID;
  }): Promise<void> {
    await this.userRolesService.assignRolesToUser({
      data,
      assignedById,
    });

    await this.cacheService.invalidateById({
      id: data.userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });
  }

  async unassignRolesFromUser({
    userId,
    roleIds,
  }: UnassignRolesFromUserDto): Promise<void> {
    await this.userRolesService.unassignRolesFromUser({ userId, roleIds });

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });
  }

  async getAssignedRoles(userId: UUID): Promise<GetRelatedRoleDto[]> {
    const cachedStores = await this.cacheService.getById<GetRelatedRoleDto[]>({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    if (cachedStores) {
      return cachedStores;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetRelatedRoleDto[]>({
      key: cacheKey,
      operation: async () => {
        const stores = await this.userRolesService.getAssignedRoles(userId);

        await this.cacheService.set<GetRelatedRoleDto[]>({
          key: cacheKey,
          value: stores,
        });

        return stores;
      },
    });
  }
}
