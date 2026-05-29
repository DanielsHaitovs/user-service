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
  ) {}

  async getMany(data: RolesQueryRequest): Promise<RoleListResponseDto> {
    return await this.roleService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetRoleDto> {
    return await this.roleService.getByIdOrThrow(id);
  }

  async getByNameOrThrow(name: string): Promise<GetRoleDto> {
    return await this.roleService.getByNameOrThrow(name);
  }

  async getPermissionsOrThrow(roleId: UUID): Promise<RoleResponseDto> {
    return await this.permissionService.getPermissionsOrThrow(roleId);
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateRoleDto;
    createdById: UUID;
  }): Promise<RoleResponseDto> {
    return await this.createService.create({ createDto, createdById });
  }

  async assignPermissionsToRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<RoleResponseDto> {
    return await this.permissionService.assignPermissionsToRole({
      roleId,
      permissionCodes,
    });
  }

  async unassignPermissionsFromRole({
    roleId,
    permissionCodes,
  }: PermissionsToRoleDto): Promise<RoleResponseDto> {
    return await this.permissionService.unassignPermissionsFromRole({
      roleId,
      permissionCodes,
    });
  }

  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateRoleDto;
    id: UUID;
  }): Promise<boolean> {
    return await this.updateService.update({ updateDto, id });
  }
}
