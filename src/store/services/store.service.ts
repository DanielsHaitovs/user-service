import { EntityQueryService } from '@/base/service/query.service';
import { StoreQueryRequest } from '@/storeDto/query.dto';
import { GetStoreDto, StoreListResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves a list of stores based on the provided query parameters, including pagination, sorting, and filtering options.
   * @param data - An object containing the query parameters for retrieving stores, such as IDs, names, codes, pagination details, sorting options, and date filters.
   * @returns A promise that resolves to a StoreListResponseDto containing the paginated list of stores matching the query criteria.
   */
  async getMany(data: StoreQueryRequest): Promise<StoreListResponseDto> {
    const {
      ids,
      names,
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

    const query = this.queryService.initQuery<Store>({
      entity: Store,
      alias: 'store',
    });

    this.queryService.whereIn<Store>({
      query,
      field: 'store.name',
      condition: 'AND',
      values: names,
    });

    this.queryService.whereIn<Store>({
      query,
      field: 'store.id',
      condition: 'AND',
      values: ids,
    });

    this.queryService.whereIn<Store>({
      query,
      field: 'store.code',
      condition: 'AND',
      values: codes,
    });

    this.queryService.whereIn<Store>({
      query,
      field: 'store.viewCode',
      condition: 'AND',
      values: viewCodes,
    });

    if (dateFilterParam != undefined) {
      this.queryService.dateGreaterThan<Store>({
        query,
        field: `store.${dateFilterParam}`,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<Store>({
        query,
        field: `store.${dateFilterParam}`,
        condition: 'AND',
        date: dateTo,
      });
    }

    this.queryService.sort<Store>({
      query,
      sort: {
        sortField,
        sortOrder,
      },
    });

    this.queryService.paginate<Store>({
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
   * Retrieves a store by its ID or throws an exception if not found.
   * @param id - The UUID of the store to retrieve.
   * @returns  A promise that resolves to the GetStoreDto of the found store.
   * @throws EntityNotFoundException if no store with the given ID is found.
   */
  async getByIdOrThrow(id: UUID): Promise<GetStoreDto> {
    return await this.storeRepository.findOneByOrFail({ id });
  }

  /**
   * Retrieves a store by its code or throws an exception if not found.
   * @param code - The code of the store to retrieve.
   * @returns A promise that resolves to the GetStoreDto of the found store.
   * @throws EntityNotFoundException if no store with the given code is found.
   */
  async getByCodeOrThrow(code: string): Promise<GetStoreDto> {
    return await this.storeRepository.findOneByOrFail({ code });
  }

  /**
   * Retrieves a store by its view code or throws an exception if not found.
   * @param viewCode - The view code of the store to retrieve.
   * @returns A promise that resolves to the GetStoreDto of the found store.
   * @throws EntityNotFoundException if no store with the given view code is found.
   */
  async getByViewCodeOrThrow(viewCode: string): Promise<GetStoreDto> {
    return await this.storeRepository.findOneByOrFail({ viewCode });
  }
}
