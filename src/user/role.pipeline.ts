import {
  AssignRolesToUserDto,
  GetUserRoleDto,
  UnassignRolesFromUserDto,
} from '@/userDto/roles.dto';
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
  }

  async unassignRolesFromUser({
    userId,
    roleIds,
  }: UnassignRolesFromUserDto): Promise<void> {
    await this.userRolesService.unassignRolesFromUser({ userId, roleIds });
  }
}
