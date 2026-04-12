import { GetUserRoleDto } from '@/userDto/roles.dto';
import { UserRolesService } from '@/userService/role/role.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserRolePipelineService {
  constructor(private readonly userRolesService: UserRolesService) {}

  async getRolesOrThrow(userId: UUID): Promise<GetUserRoleDto[]> {
    return await this.userRolesService.getRolesOrThrow(userId);
  }

  async getPermissionsOrThrow(userId: UUID): Promise<string[]> {
    return await this.userRolesService.getPermissionsOrThrow(userId);
  }

  async assignRolesToUser({
    userId,
    roleIds,
    assignedById,
  }: {
    userId: UUID;
    roleIds: UUID[];
    assignedById: UUID;
  }): Promise<void> {
    await this.userRolesService.assignRolesToUser({
      userId,
      roleIds,
      assignedById,
    });
  }

  async unassignRolesFromUser({
    userId,
    roleIds,
  }: {
    userId: UUID;
    roleIds: UUID[];
  }): Promise<void> {
    await this.userRolesService.unassignRolesFromUser({ userId, roleIds });
  }
}
