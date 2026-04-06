import { CreateRoleDto, GetRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { CreateService } from '@/roleServices/create.service';
import { RoleService } from '@/roleServices/role.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class RolePipelineService {
  constructor(
    private readonly roleService: RoleService,
    private readonly createService: CreateService,
  ) {}

  async getByIdOrThrow(id: UUID): Promise<GetRoleDto> {
    return await this.roleService.getByIdOrThrow(id);
  }

  async getByNameOrThrow(name: string): Promise<GetRoleDto> {
    return await this.roleService.getByNameOrThrow(name);
  }

  async getPermissionsByRoleId(id: UUID): Promise<RoleResponseDto> {
    return await this.roleService.getPermissionsByRoleId(id);
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
  }: {
    roleId: UUID;
    permissionCodes: string[];
  }): Promise<RoleResponseDto> {
    return await this.roleService.assignPermissionsToRole({
      roleId,
      permissionCodes,
    });
  }

  async unassignPermissionsFromRole({
    roleId,
    permissionCodes,
  }: {
    roleId: UUID;
    permissionCodes: string[];
  }): Promise<RoleResponseDto> {
    return await this.roleService.unassignPermissionsFromRole({
      roleId,
      permissionCodes,
    });
  }
}
