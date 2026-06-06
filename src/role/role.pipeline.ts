import { CacheService } from '@/baseServices/cache.service';
import { PERMISSION_QUERY_ALIAS } from '@/libConst/permission.const';
import { ROLE_QUERY_ALIAS, USER_ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import { RolesQueryRequest } from '@/roleDto/query.dto';
import {
  CreateRoleDto,
  GetRoleDto,
  PermissionsToRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '@/roleDto/role.dto';
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
  }: {
    createDto: CreateRoleDto;
    createdById: UUID;
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
    ]);

    return { ...role, permissions };
  }

  async assignPermissionsToRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<void> {
    await this.permissionService.assignPermissionsToRole({
      roleId,
      permissionCodes,
    });

    await this.cacheService.invalidateById({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });
  }

  async unassignPermissionsFromRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<void> {
    await this.permissionService.unassignPermissionsFromRole({
      roleId,
      permissionCodes,
    });

    await this.cacheService.invalidateById({
      id: roleId,
      alias: `${ROLE_QUERY_ALIAS}_${PERMISSION_QUERY_ALIAS}`,
    });
  }

  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateRoleDto;
    id: UUID;
  }): Promise<boolean> {
    const updated = await this.updateService.update({ updateDto, id });

    if (updated) {
      await this.cacheService.invalidateById({
        id,
        alias: ROLE_QUERY_ALIAS,
      });
    }

    return updated;
  }

  async delete({
    id,
    canDeleteAssignedRole,
  }: {
    id: UUID;
    canDeleteAssignedRole: boolean;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      id,
      canDeleteAssignedRole,
    });

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
      ]);
    }

    return deleted;
  }
}
