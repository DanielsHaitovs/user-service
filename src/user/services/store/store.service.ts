import { EntityQueryService } from '@/base/service/query.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import {
  AssignStoresToUserDto,
  UnassignStoresFromUserDto,
  UserStoresListResponseDto,
  UserStoresQueryRequest,
} from '@/userDto/stores.dto';
import { UserStores } from '@/userEntities/userStores.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserStoresService {
  constructor(
    @InjectRepository(UserStores)
    private readonly storeRepository: Repository<UserStores>,
    private readonly userHelperService: UserHelperService,
    private readonly storeHelperService: StoreHelperService,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves the stores assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetUserStoreDto objects representing the user's stores.
   */
  async getStores(
    data: UserStoresQueryRequest,
  ): Promise<UserStoresListResponseDto> {
    const {
      userId,
      codes,
      viewCodes,
      page,
      limit,
      sortField,
      sortOrder,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = data;
    await this.userHelperService.validateIfExists({ id: userId });

    const query = this.queryService.initQuery<UserStores>({
      entity: UserStores,
      alias: 'userStore',
    });

    this.queryService.joinRelation<UserStores>({
      query,
      alias: 'user',
    });

    this.queryService.joinRelation<UserStores>({
      query,
      alias: 'store',
    });

    this.queryService.where<UserStores>({
      query,
      field: 'user.id',
      condition: 'AND',
      value: userId,
    });

    this.queryService.whereIn<UserStores>({
      query,
      field: 'store.code',
      condition: 'AND',
      values: codes,
    });

    this.queryService.whereIn<UserStores>({
      query,
      field: 'store.viewCode',
      condition: 'AND',
      values: viewCodes,
    });

    if (dateFilterParam != undefined) {
      this.queryService.dateGreaterThan<UserStores>({
        query,
        field: `userStore.${dateFilterParam}`,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<UserStores>({
        query,
        field: `userStore.${dateFilterParam}`,
        condition: 'AND',
        date: dateTo,
      });
    }

    this.queryService.sort<UserStores>({
      query,
      sort: {
        sortField,
        sortOrder,
      },
    });

    query.select([
      'userStore.id',
      'userStore.createdAt',
      'userStore.updatedAt',
      'store.id',
      'store.name',
      'store.code',
      'store.viewCode',
      'store.createdAt',
    ]);

    this.queryService.paginate<UserStores>({
      query,
      pagination: {
        page,
        limit,
      },
    });

    return await this.queryService.paginatedResult({
      query,
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
    data,
    assignedById,
  }: {
    data: AssignStoresToUserDto;
    assignedById: UUID;
  }): Promise<void> {
    const { userId, storeIds } = data;
    await this.userHelperService.validateIfExists({ id: userId });
    await this.userHelperService.validateIfExists({ id: assignedById });
    await this.storeHelperService.validateStoresExists(storeIds);

    const userStores = storeIds.map((storeId) => ({
      user: { id: userId },
      store: { id: storeId },
      assignedBy: { id: assignedById },
    }));

    await this.storeRepository.save(userStores);
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

    await this.storeRepository.delete({
      user: { id: userId },
      store: { id: In(storeIds) },
    });
  }
}
