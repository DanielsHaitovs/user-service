import { StoreHelperService } from '@/storeServices/helper.service';
import {
  AssignStoresToUserDto,
  GetUserStoreDto,
  UnassignStoresFromUserDto,
} from '@/userDto/stores.dto';
import { UserStores } from '@/userEntities/userStores.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError, In } from 'typeorm';

@Injectable()
export class UserStoresService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly userHelperService: UserHelperService,
    private readonly storeHelperService: StoreHelperService,
  ) {}

  /**
   * Retrieves the stores assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetUserStoreDto objects representing the user's stores.
   * @throws An EntityNotFoundError if the user does not exist.
   */
  async getStoresOrThrow(userId: UUID): Promise<GetUserStoreDto[]> {
    return await this.entityManager
      .findBy(UserStores, {
        user: { id: userId },
      })
      .then((userStores) => {
        if (userStores.length === 0) {
          throw new EntityNotFoundError(
            UserStores,
            `No stores found for user with ID ${userId}`,
          );
        }

        return userStores;
      });
  }

  /**
   * Assigns stores to a user.
   *
   * @param userId - The unique identifier of the user to whom stores will be assigned (UUID).
   * @param storeIds - An array of unique identifiers (UUIDs) representing the stores to be assigned to the user.
   * @param assignedById - The unique identifier of the user who is assigning the stores (UUID).
   * @returns A promise that resolves when the stores have been successfully assigned to the user.
   * @throws An EntityNotFoundError if the user or the assigning user does not exist.
   */
  async assignStoresToUser({
    userId,
    storeIds,
    assignedById,
  }: AssignStoresToUserDto): Promise<void> {
    await this.userHelperService.validateIfExists({ id: userId });
    await this.userHelperService.validateIfExists({ id: assignedById });
    await this.storeHelperService.validateStoresExists(storeIds);

    const userStores = storeIds.map((storeId) => ({
      user: { id: userId },
      store: { id: storeId },
      assignedBy: { id: assignedById },
    }));

    await this.entityManager.save(UserStores, userStores);
  }

  /**
   * Removes stores from a user.
   *
   * @param userId - The unique identifier of the user from whom stores will be removed (UUID).
   * @param storeIds - An array of unique identifiers (UUIDs) representing the stores to be removed from the user.
   * @returns A promise that resolves when the stores have been successfully removed from the user.
   * @throws An EntityNotFoundError if the user does not exist.
   */
  async unassignStoresFromUser({
    userId,
    storeIds,
  }: UnassignStoresFromUserDto): Promise<void> {
    await this.userHelperService.validateIfExists({ id: userId });
    await this.storeHelperService.validateStoresExists(storeIds);

    await this.entityManager.delete(UserStores, {
      user: { id: userId },
      store: { id: In(storeIds) },
    });
  }
}
