import { deletedResults } from '@/baseHelper/delete';
import { FullUser } from '@/common/pipes/full-user.pipe';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { SystemIdentityService } from '@/system/identity.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
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
    private readonly roleService: UserRolesService,
    private readonly storeService: UserStoresService,
    private readonly systemIdentityService: SystemIdentityService,
  ) {}

  async delete({
    data,
    canRemoveFromRelatedRoles,
    canRemoveFromRelatedStores,
  }: {
    data: FullUser;
    canRemoveFromRelatedRoles: boolean;
    canRemoveFromRelatedStores: boolean;
  }): Promise<boolean> {
    const {
      user: { id },
      roles,
      stores,
    } = data;

    try {
      const systemUserId = this.systemIdentityService.getSystemUserId();

      if (id === systemUserId) {
        throw new UnprocessableEntityException(
          'The system user cannot be deleted.',
        );
      }

      await Promise.all([
        this.removeUserFromRelatedRoles({
          id,
          canRemoveFromRelatedRoles,
          roles,
        }),
        this.removeUserFromRelatedStores({
          id,
          canRemoveFromRelatedStores,
          stores,
        }),
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
    roles,
    canRemoveFromRelatedRoles,
  }: {
    id: UUID;
    roles: GetRelatedRoleDto[];
    canRemoveFromRelatedRoles: boolean;
  }): Promise<void> {
    if (roles.length === 0) return;

    if (!canRemoveFromRelatedRoles) {
      throw new UnprocessableEntityException(
        'User cannot be deleted because they are still assigned to roles. Please unassign the user from their roles before deletion.',
      );
    }

    await this.roleService.unassignRolesFromUser({
      userId: id,
      data: { roleIds: roles.map((role) => role.id) },
      assignedRoles: roles,
    });
  }

  private async removeUserFromRelatedStores({
    id,
    stores,
    canRemoveFromRelatedStores,
  }: {
    id: UUID;
    stores: GetRelatedStoreDto[];
    canRemoveFromRelatedStores: boolean;
  }): Promise<void> {
    if (stores.length === 0) return;

    if (!canRemoveFromRelatedStores) {
      throw new UnprocessableEntityException(
        'User cannot be deleted because they are still assigned to stores. Please unassign the user from their stores before deletion.',
      );
    }

    await this.storeService.unassignStoresFromUser({
      userId: id,
      data: { storeIds: stores.map((store) => store.id) },
      assignedStores: stores,
    });
  }
}
