import { deletedResults } from '@/base/helper/delete';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { SystemIdentityService } from '@/system/identity.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { UserHelperService } from '@/userServices/helper.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class DeleteService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly helperService: UserHelperService,
    private readonly roleService: UserRolesService,
    private readonly storeService: UserStoresService,
    private readonly systemIdentityService: SystemIdentityService,
  ) {}

  async delete({
    id,
    canRemoveFromRelatedRoles,
    canRemoveFromRelatedStores,
  }: {
    id: UUID;
    canRemoveFromRelatedRoles: boolean;
    canRemoveFromRelatedStores: boolean;
  }): Promise<boolean> {
    try {
      const systemUserId = this.systemIdentityService.getSystemUserId();
      await this.helperService.checkIfExists({ id });

      if (id === systemUserId) {
        throw new UnprocessableEntityException(
          'The system user cannot be deleted.',
        );
      }

      await Promise.all([
        this.removeUserFromRelatedRoles({ id, canRemoveFromRelatedRoles }),
        this.removeUserFromRelatedStores({ id, canRemoveFromRelatedStores }),
      ]);

      const deleted = await this.userRepository.delete(id);

      return deletedResults(deleted);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error as QueryFailedError & { code: string };

        if (driverError.code === pgErrorStatusCodes.FOREIGN_KEY_VIOLATION) {
          throw new UnprocessableEntityException(
            'User cannot be deleted because it had activity in the system. Please contact support for assistance.',
          );
        }
      }

      throw error;
    }
  }

  private async removeUserFromRelatedRoles({
    id,
    canRemoveFromRelatedRoles,
  }: {
    id: UUID;
    canRemoveFromRelatedRoles: boolean;
  }): Promise<void> {
    const userRoles = await this.roleService.getAssignedRoles(id);

    if (userRoles.length > 0) {
      if (!canRemoveFromRelatedRoles) {
        throw new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to roles. Please unassign the user from their roles before deletion.',
        );
      }

      await this.roleService.unassignRolesFromUser({
        userId: id,
        data: { roleIds: userRoles.map((role) => role.id) },
        assignedRoles: userRoles,
      });
    }
  }

  private async removeUserFromRelatedStores({
    id,
    canRemoveFromRelatedStores,
  }: {
    id: UUID;
    canRemoveFromRelatedStores: boolean;
  }): Promise<void> {
    const userStores = await this.storeService.getAssignedStores(id);

    if (userStores.length > 0) {
      if (!canRemoveFromRelatedStores) {
        throw new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to stores. Please unassign the user from their stores before deletion.',
        );
      }

      await this.storeService.unassignStoresFromUser({
        userId: id,
        data: { storeIds: userStores.map((store) => store.id) },
        assignedStores: userStores,
      });
    }
  }
}
