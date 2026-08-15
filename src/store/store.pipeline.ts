import { CacheService } from '@/baseServices/cache.service';
import { StoreAction } from '@/common/enum/action.enum';
import {
  STORE_QUERY_ALIAS,
  USER_STORES_QUERY_ALIAS,
} from '@/commonConst/store.const';
import { ClientMetadata } from '@/commonDecorators/meta.decorator';
import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '@/storeDto/store.dto';
import { AuditProducerService } from '@/storeServices/audit.service';
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
    private readonly auditService: AuditProducerService,
  ) {}

  async getMany(data: StoreQueryRequest): Promise<StoreListResponseDto> {
    return await this.storeService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetStoreDto> {
    const cached = await this.cacheService.getById<GetStoreDto>({
      id,
      alias: STORE_QUERY_ALIAS,
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
    metadata,
  }: {
    createDto: CreateStoreDto;
    createdById: UUID;
    metadata: ClientMetadata;
  }): Promise<StoreResponseDto> {
    const store = await this.createService.create({ createDto, createdById });

    await Promise.all([
      this.cacheService.invalidateByTags({
        tag: { purge: true },
        alias: STORE_QUERY_ALIAS,
      }),
      this.cacheService.set<StoreResponseDto>({
        key: this.cacheService.getIdKeyPrefixByAlias({
          id: store.id,
          alias: STORE_QUERY_ALIAS,
        }),
        value: store,
      }),
      this.auditService.sendLog({
        userId: createdById,
        action: StoreAction.CREATE,
        targetStoreId: store.id,
        details: `Store created with name: ${store.name}`,
        newState: store,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }),
    ]);

    return store;
  }

  async update({
    updateDto,
    store,
    requestedByUserId,
    metadata,
  }: {
    updateDto: UpdateStoreDto;
    store: GetStoreDto;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const updated = await this.updateService.update({ updateDto, store });

    if (updated) {
      await Promise.all([
        this.cacheService.invalidateById({
          id: store.id,
          alias: STORE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateByTags({
          tag: { purge: true },
          alias: STORE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateByTags({
          tag: {
            purge: true,
          },
          alias: USER_STORES_QUERY_ALIAS,
        }),
        this.auditService.sendLog({
          userId: requestedByUserId,
          action: StoreAction.UPDATE,
          targetStoreId: store.id,
          details: `Store created with name: ${store.name}`,
          newState: store,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
    }

    return updated;
  }

  async delete({
    store,
    canDeleteAssignedStore,
    requestedByUserId,
    metadata,
  }: {
    store: GetStoreDto;
    canDeleteAssignedStore: boolean;
    requestedByUserId: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      store,
      canDeleteAssignedStore,
    });

    if (deleted) {
      await Promise.all([
        this.cacheService.invalidateById({
          id: store.id,
          alias: STORE_QUERY_ALIAS,
        }),
        this.cacheService.invalidateByTags({
          tag: { purge: true },
          alias: USER_STORES_QUERY_ALIAS,
        }),
        this.auditService.sendLog({
          userId: requestedByUserId,
          action: StoreAction.DELETE,
          targetStoreId: store.id,
          details: `Store ${store.id} was deleted.`,
          oldState: store,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
    }

    return deleted;
  }
}
