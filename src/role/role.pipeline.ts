import { RolesQueryRequest } from '@/roleDto/query.dto';
import {
  CreateRoleDto,
  GetRoleDto,
  PermissionsToRoleDto,
  RoleListResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '@/roleDto/role.dto';
import { CacheService } from '@/roleServices/cache.service';
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
    const cachedRole = await this.cacheService.getById(id);

    if (cachedRole) {
      return cachedRole;
    }

    const cached = await this.roleService.getByIdOrThrow(id);

    await this.cacheService.set(cached);

    return cached;
  }

  async getPermissionsOrThrow(roleId: UUID): Promise<RoleResponseDto> {
    const cached =
      await this.cacheService.getWithRelatedPermissionsById(roleId);

    if (cached) {
      return cached;
    }

    const role = await this.permissionService.getPermissionsOrThrow(roleId);

    await this.cacheService.setRolePermissions(role);

    return role;
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateRoleDto;
    createdById: UUID;
  }): Promise<RoleResponseDto> {
    const role = await this.createService.create({ createDto, createdById });

    await this.cacheService.set(role);

    return role;
  }

  async assignPermissionsToRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<RoleResponseDto> {
    const assignedRoles = await this.permissionService.assignPermissionsToRole({
      roleId,
      permissionCodes,
    });

    await this.cacheService.revalidateRolePermissions(roleId);

    return assignedRoles;
  }

  async unassignPermissionsFromRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<RoleResponseDto> {
    const unAssignRoles =
      await this.permissionService.unassignPermissionsFromRole({
        roleId,
        permissionCodes,
      });

    await this.cacheService.revalidateRolePermissions(roleId);

    return unAssignRoles;
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
      await this.cacheService.revalidate(id);
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
      await this.cacheService.invalidate(id);
    }

    return deleted;
  }
}
