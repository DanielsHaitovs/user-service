import { CacheService } from '@/baseServices/cache.service';
import { UserAction } from '@/common/enum/action.enum';
import { UserWithRoles } from '@/common/pipes/userRoles.pipe';
import { USER_ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { ClientMetadata } from '@/commonDecorators/meta.decorator';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { AuditProducerService } from '@/user/services/audit.service';
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
    private readonly auditService: AuditProducerService,
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
    userRoles,
    assignedById,
    metadata,
  }: {
    data: AssignRolesToUserDto;
    userRoles: UserWithRoles;
    assignedById: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const {
      user: { id: userId },
      roles,
    } = userRoles;

    await this.userRolesService.assignRolesToUser({
      data,
      userId,
      assignedRoles: roles,
      assignedById,
    });

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    const assignedRoles = await this.getAssignedRoles(userId);

    await this.auditService.sendRoleLog({
      createdAt: new Date(),
      userId: assignedById,
      action: UserAction.ASSIGN_ROLE,
      details: `Assigned roles to user ${userId}`,
      targetUserId: userId,
      oldState: roles,
      newState: assignedRoles,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  async unassignRolesFromUser({
    userRoles,
    data,
    requestedById,
    metadata,
  }: {
    userRoles: UserWithRoles;
    data: UnassignRolesFromUserDto;
    requestedById: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const {
      user: { id: userId },
      roles,
    } = userRoles;

    await this.userRolesService.unassignRolesFromUser({
      userId,
      data,
      assignedRoles: roles,
    });

    await this.cacheService.invalidateById({
      id: userId,
      alias: USER_ROLE_QUERY_ALIAS,
    });

    const assignedRoles = await this.getAssignedRoles(userId);

    await this.auditService.sendRoleLog({
      createdAt: new Date(),
      userId: requestedById,
      action: UserAction.REVOKE_ROLE,
      details: `Unassigned roles to user ${userId}`,
      targetUserId: userId,
      oldState: roles,
      newState: assignedRoles,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
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
