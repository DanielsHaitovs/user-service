import { CacheService } from '@/baseServices/cache.service';
import { RoleAction } from '@/common/enum/action.enum';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import {
  ROLE_QUERY_ALIAS,
  USER_ROLE_PERMISSIONS_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/commonConst/role.const';
import { ClientMetadata } from '@/commonDecorators/meta.decorator';
import { RolesQueryRequest } from '@/roleDto/query.dto';
import {
  CreateRoleDto,
  GetRoleDto,
  PermissionsToRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '@/roleDto/role.dto';
import { AuditProducerService } from '@/roleServices/audit.service';
import { CreateService } from '@/roleServices/create.service';
import { DeleteService } from '@/roleServices/delete.service';
import { RolePermissionService } from '@/roleServices/permission.service';
import { RoleService } from '@/roleServices/role.service';
import { UpdateService } from '@/roleServices/update.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class RolePipelineService {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: RolePermissionService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditProducerService,
  ) {}

  async getMany(data: RolesQueryRequest): Promise<RoleListResponseDto> {
    return await this.roleService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetRoleDto> {
    const cachedRole = await this.cacheService.getById<GetRoleDto>({
      id,
      alias: ROLE_QUERY_ALIAS,
    });

    if (cachedRole) {
      return cachedRole;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id,
      alias: ROLE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetRoleDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.roleService.getByIdOrThrow(id);

        await this.cacheService.set<GetRoleDto>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }

  async getPermissionsOrThrow(roleId: UUID): Promise<RoleResponseDto> {
    const cached = await this.cacheService.getById<RoleResponseDto>({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    if (cached) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    return await this.cacheService.coalesce<RoleResponseDto>({
      key: cacheKey,
      operation: async () => {
        const role = await this.permissionService.getPermissionsOrThrow(roleId);

        await this.cacheService.set<RoleResponseDto>({
          key: cacheKey,
          value: role,
        });

        return role;
      },
    });
  }

  async create({
    createDto,
    createdById,
    metadata,
  }: {
    createDto: CreateRoleDto;
    createdById: UUID;
    metadata: ClientMetadata;
  }): Promise<RoleResponseDto> {
    const { permissions, ...role } = await this.createService.create({
      createDto,
      createdById,
    });

    await Promise.all([
      this.cacheService.set({
        key: this.cacheService.getIdKeyPrefixByAlias({
          id: role.id,
          alias: ROLE_QUERY_ALIAS,
        }),
        value: role,
      }),
      this.cacheService.set<RoleResponseDto>({
        key: this.cacheService.getIdKeyPrefixByAlias({
          id: role.id,
          alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
        }),
        value: { ...role, permissions },
      }),
      this.auditService.sendLog({
        userId: createdById,
        action: RoleAction.CREATE,
        targetRoleId: role.id,
        details: `Role created with name: ${role.name} and permissions: ${permissions.map((permission) => permission.name).join(', ')}`,
        newState: { ...role, permissions },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }),
    ]);

    return { ...role, permissions };
  }

  async assignPermissionsToRole({
    assignPayload,
    role,
    metadata,
    requestedByUserId,
  }: {
    assignPayload: PermissionsToRoleDto;
    role: RoleResponseDto;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const { permissionCodes } = assignPayload;

    await this.permissionService.assignPermissionsToRole({
      role,
      assignPayload,
    });

    await this.cacheService.invalidateById({
      id: role.id,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: role.id,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    await this.cacheService.coalesce<RoleResponseDto>({
      key: cacheKey,
      operation: async () => {
        const changedRole = await this.permissionService.getPermissionsOrThrow(
          role.id,
        );

        await Promise.all([
          this.cacheService.set<RoleResponseDto>({
            key: cacheKey,
            value: changedRole,
          }),
          this.auditService.sendLog({
            userId: requestedByUserId,
            action: RoleAction.ASSIGN,
            targetRoleId: role.id,
            details: `Permissions assigned to role with name: ${role.name}. Permissions: ${permissionCodes.join(', ')}`,
            oldState: role,
            newState: changedRole,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }),
        ]);

        return role;
      },
    });
  }

  async unassignPermissionsFromRole({
    unassignPayload,
    role,
    metadata,
    requestedByUserId,
  }: {
    unassignPayload: PermissionsToRoleDto;
    role: RoleResponseDto;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<void> {
    const { permissionCodes } = unassignPayload;

    const amountOfUnassigned =
      await this.permissionService.unassignPermissionsFromRole({
        role,
        unassignPayload,
      });

    if (amountOfUnassigned === 0) {
      return;
    }

    await this.cacheService.invalidateById({
      id: role.id,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    await this.cacheService.invalidateByKeyPattern(
      `*:${USER_ROLE_PERMISSIONS_QUERY_ALIAS}`,
    );

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: role.id,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });

    await this.cacheService.coalesce<RoleResponseDto>({
      key: cacheKey,
      operation: async () => {
        const changedRole = await this.permissionService.getPermissionsOrThrow(
          role.id,
        );

        await Promise.all([
          this.cacheService.set<RoleResponseDto>({
            key: cacheKey,
            value: changedRole,
          }),
          this.auditService.sendLog({
            userId: requestedByUserId,
            action: RoleAction.UNASSIGN,
            targetRoleId: role.id,
            details: `Permissions unassigned from role with name: ${role.name}. Permissions: ${permissionCodes.join(', ')}`,
            oldState: role,
            newState: changedRole,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          }),
        ]);

        return role;
      },
    });
  }

  async update({
    updateDto,
    role,
    requestedByUserId,
    metadata,
  }: {
    updateDto: UpdateRoleDto;
    role: GetRoleDto;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const { id } = role;

    const updated = await this.updateService.update({ updateDto, role });

    if (updated) {
      await Promise.all([
        this.cacheService.invalidateById({
          id,
          alias: ROLE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateById({
          id,
          alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
        }),
        this.auditService.sendLog({
          userId: requestedByUserId,
          action: RoleAction.UPDATE,
          targetRoleId: id,
          details: `Role name was updated`,
          oldState: role,
          // eslint-disable-next-line @typescript-eslint/no-misused-spread
          newState: { ...role, ...updateDto },
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
    }

    return updated;
  }

  async delete({
    role,
    canDeleteAssignedRole,
    requestedByUserId,
    metadata,
  }: {
    role: GetRoleDto;
    canDeleteAssignedRole: boolean;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      role,
      canDeleteAssignedRole,
    });

    const { id } = role;

    if (deleted) {
      await Promise.all([
        this.cacheService.invalidateByTags({
          tag: {
            purge: true,
          },
          alias: ROLE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateById({
          id,
          alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
        }),
        this.cacheService.invalidateById({
          id,
          alias: ROLE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateByTags({
          tag: {
            purge: true,
          },
          alias: USER_ROLE_QUERY_ALIAS,
        }),
        this.auditService.sendLog({
          userId: requestedByUserId,
          action: RoleAction.DELETE,
          targetRoleId: id,
          details: `Role was deleted`,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
    }

    return deleted;
  }
}
