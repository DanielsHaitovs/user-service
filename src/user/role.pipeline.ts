import { CacheService } from '@/baseServices/cache.service';
import { UserAction } from '@/common/enum/action.enum';
import { UserWithRoles } from '@/common/pipes/userRoles.pipe';
import {
  USER_ROLE_PERMISSIONS_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/commonConst/role.const';
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
    const roles = await this.getAssignedRoles(userId);

    const roleIds = roles.map((role) => role.id);

    const cached = await this.cacheService.getById<string[]>({
      id: userId,
      alias: USER_ROLE_PERMISSIONS_QUERY_ALIAS,
    });

    if (cached) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: userId,
      alias: USER_ROLE_PERMISSIONS_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<string[]>({
      key: cacheKey,
      operation: async () => {
        const permissions = await this.userRolesService.getPermissions(roleIds);

        await this.cacheService.set<string[]>({
          key: cacheKey,
          value: permissions,
        });

        return permissions;
      },
    });
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

    const result = await this.userRolesService.assignRolesToUser({
      data,
      userId,
      assignedRoles: roles,
      assignedById,
    });

    if (!result) {
      return;
    }

    await Promise.all([
      this.cacheService.invalidateById({
        id: userId,
        alias: USER_ROLE_QUERY_ALIAS,
      }),
      this.cacheService.invalidateById({
        id: userId,
        alias: USER_ROLE_PERMISSIONS_QUERY_ALIAS,
      }),
      this.cacheService.invalidateByTags({
        alias: USER_ROLE_QUERY_ALIAS,
        tag: { purge: true },
      }),
    ]);

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

    const result = await this.userRolesService.unassignRolesFromUser({
      userId,
      data,
      assignedRoles: roles,
    });

    if (!result) {
      return;
    }

    await Promise.all([
      this.cacheService.invalidateById({
        id: userId,
        alias: USER_ROLE_QUERY_ALIAS,
      }),
      this.cacheService.invalidateById({
        id: userId,
        alias: USER_ROLE_PERMISSIONS_QUERY_ALIAS,
      }),
      this.cacheService.invalidateByTags({
        alias: USER_ROLE_QUERY_ALIAS,
        tag: { purge: true },
      }),
    ]);

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
        const roles = await this.userRolesService.getAssignedRoles(userId);

        await this.cacheService.set<GetRelatedRoleDto[]>({
          key: cacheKey,
          value: roles,
        });

        return roles;
      },
    });
  }
}
