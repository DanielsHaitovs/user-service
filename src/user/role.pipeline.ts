import {
  AssignRolesToUserDto,
  UnassignRolesFromUserDto,
  UserRolesListResponseDto,
  UserRolesQueryRequest,
} from '@/userDto/roles.dto';
import { CacheService } from '@/userRoleServices/cache.service';
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

  async getPermissionsOrThrow(userId: UUID): Promise<string[]> {
    return await this.userRolesService.getPermissionsOrThrow(userId);
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

    await this.cacheService.revalidate(data.userId);
  }

  async unassignRolesFromUser({
    userId,
    roleIds,
  }: UnassignRolesFromUserDto): Promise<void> {
    await this.userRolesService.unassignRolesFromUser({ userId, roleIds });

    await this.cacheService.revalidate(userId);
  }
}
