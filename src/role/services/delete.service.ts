import { deletedResults } from '@/base/helper/delete';
import { pgErrorStatusCodes } from '@/libConst/database.const';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { SystemIdentityService } from '@/system/identity.service';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class DeleteService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    @InjectRepository(UserRoles)
    private readonly userRolesRepository: Repository<UserRoles>,
    private readonly helperService: RoleHelperService,
    private readonly systemIdentityService: SystemIdentityService,
  ) {}

  async delete({
    id,
    canDeleteAssignedRole,
  }: {
    id: UUID;
    canDeleteAssignedRole: boolean;
  }): Promise<boolean> {
    await this.helperService.checkIfManyExistOrThrow([id]);

    await this.getSystemRoleIds([id]);

    try {
      await this.unAssignFromUsers({ roleId: id, canDeleteAssignedRole });

      const deleted = await this.roleRepository.delete(id);

      return deletedResults(deleted);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error as QueryFailedError & { code: string };

        if (driverError.code === pgErrorStatusCodes.FOREIGN_KEY_VIOLATION) {
          throw new UnprocessableEntityException(
            'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
          );
        }
      }

      throw error;
    }
  }

  private async getSystemRoleIds(roleIds: UUID[]): Promise<void> {
    const systemRoleIds = await this.systemIdentityService.getSystemRoleIds();
    const hasSystemRole = systemRoleIds.some((id) => roleIds.includes(id));
    if (hasSystemRole) {
      throw new UnprocessableEntityException(
        'One or more of the specified roles are system roles and cannot be deleted.',
      );
    }
  }

  private async unAssignFromUsers({
    roleId,
    canDeleteAssignedRole,
  }: {
    roleId: UUID;
    canDeleteAssignedRole: boolean;
  }): Promise<void> {
    const userRoles = await this.userRolesRepository.find({
      where: { role: { id: roleId } },
      take: 1,
      skip: 0,
    });

    if (userRoles.length > 0) {
      if (!canDeleteAssignedRole) {
        throw new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        );
      }

      await this.userRolesRepository.delete({
        role: { id: roleId },
      });
    }
  }
}
