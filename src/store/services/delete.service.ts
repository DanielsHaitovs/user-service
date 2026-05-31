import { deletedResults } from '@/base/delete';
import { pgErrorStatusCodes } from '@/libConst/database.const';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';

import { UserStores } from '../../user/entities/userStores.entity';
import { UserStoresService } from '../../user/services/store/store.service';

@Injectable()
export class DeleteService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(UserStores)
    private readonly userStoreRepository: Repository<UserStores>,
    private readonly helperService: StoreHelperService,
    private readonly userStoreService: UserStoresService,
  ) {}

  /** Deletes a store by its ID. If the store is assigned to users, it will either unassign the store from those users or throw an error based on the `canDeleteAssignedStore` flag.
   *
   * @param {Object} params - The parameters for deleting a store.
   * @param {UUID} params.id - The ID of the store to be deleted.
   * @param {boolean} params.canDeleteAssignedStore - A flag indicating whether the store can be deleted even if it is assigned to users. If false, an error will be thrown if the store is assigned to any users.
   * @returns {Promise<boolean>} - A promise that resolves to true if the store was successfully deleted, or false otherwise.
   * @throws {UnprocessableEntityException} - Throws an exception if the store cannot be deleted due to being assigned to users and `canDeleteAssignedStore` is false.
   */
  async delete({
    id,
    canDeleteAssignedStore,
  }: {
    id: UUID;
    canDeleteAssignedStore: boolean;
  }): Promise<boolean> {
    await this.helperService.validateIfExists(id);

    try {
      await this.unAssignFromUsers({ id, canDeleteAssignedStore });

      const deleted = await this.storeRepository.delete(id);

      return deletedResults(deleted);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error as QueryFailedError & { code: string };

        if (driverError.code === pgErrorStatusCodes.FOREIGN_KEY_VIOLATION) {
          throw new UnprocessableEntityException(
            'Store cannot be deleted because it is currently assigned to one or more users. Please unassign the store from all users before attempting to delete it.',
          );
        }
      }

      throw error;
    }
  }

  /** Unassigns a store from all users it is currently assigned to. If the store is assigned to users and `canDeleteAssignedStore` is false, an error will be thrown.
   *
   * @param {Object} params - The parameters for unassigning a store from users.
   * @param {UUID} params.id - The ID of the store to be unassigned from users.
   * @param {boolean} params.canDeleteAssignedStore - A flag indicating whether the store can be unassigned from users. If false, an error will be thrown if the store is assigned to any users.
   * @returns {Promise<void>} - A promise that resolves when the unassignment process is complete.
   * @throws {UnprocessableEntityException} - Throws an exception if the store cannot be unassigned from users due to being assigned to users and `canDeleteAssignedStore` is false.
   */
  private async unAssignFromUsers({
    id,
    canDeleteAssignedStore,
  }: {
    id: UUID;
    canDeleteAssignedStore: boolean;
  }): Promise<void> {
    const userRoles = await this.userStoreService.getAssignedUserIds(id);

    if (userRoles.length > 0) {
      if (!canDeleteAssignedStore) {
        throw new UnprocessableEntityException(
          'Store cannot be deleted because it is currently assigned to one or more users. Please unassign the store from all users before attempting to delete it.',
        );
      }

      await this.userStoreRepository.delete({
        store: { id },
      });
    }
  }
}
