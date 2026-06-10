import { CacheService } from '@/baseServices/cache.service';
import {
  STORE_QUERY_ALIAS,
  USER_STORES_QUERY_ALIAS,
} from '@/commonConst/store.const';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '@/storeDto/store.dto';
import { CreateService } from '@/storeServices/create.service';
import { DeleteService } from '@/storeServices/delete.service';
import { StoreService } from '@/storeServices/store.service';
import { UpdateService } from '@/storeServices/update.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class StorePipelineService {
  constructor(
    private readonly storeService: StoreService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly cacheService: CacheService,
  ) {}

  async getMany(data: StoreQueryRequest): Promise<StoreListResponseDto> {
    return await this.storeService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetStoreDto> {
    const cached = await this.cacheService.getById<GetStoreDto>({
      id,
      alias: USER_QUERY_ALIAS,
    });

    if (cached) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id,
      alias: STORE_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetStoreDto>({
      key: cacheKey,
      operation: async () => {
        const store = await this.storeService.getByIdOrThrow(id);

        await this.cacheService.set<GetStoreDto>({
          key: cacheKey,
          value: store,
        });

        return store;
      },
    });
  }

  async getByCodeOrThrow(code: string): Promise<GetStoreDto> {
    return await this.storeService.getByCodeOrThrow(code);
  }

  async getByViewCodeOrThrow(viewCode: string): Promise<GetStoreDto> {
    return await this.storeService.getByViewCodeOrThrow(viewCode);
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateStoreDto;
    createdById: UUID;
  }): Promise<StoreResponseDto> {
    const store = await this.createService.create({ createDto, createdById });

    await this.cacheService.set<StoreResponseDto>({
      key: this.cacheService.getIdKeyPrefixByAlias({
        id: store.id,
        alias: STORE_QUERY_ALIAS,
      }),
      value: store,
    });

    return store;
  }

  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateStoreDto;
    id: UUID;
  }): Promise<boolean> {
    const updated = await this.updateService.update({ updateDto, id });

    if (updated) {
      await this.cacheService.invalidateById({
        id,
        alias: STORE_QUERY_ALIAS,
      });
    }

    return updated;
  }

  async delete({
    id,
    canDeleteAssignedStore,
  }: {
    id: UUID;
    canDeleteAssignedStore: boolean;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      id,
      canDeleteAssignedStore,
    });

    if (deleted) {
      await Promise.all([
        this.cacheService.invalidateById({
          id,
          alias: STORE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateByTags({
          tag: { purge: true },
          alias: USER_STORES_QUERY_ALIAS,
        }),
      ]);
    }

    return deleted;
  }
}
