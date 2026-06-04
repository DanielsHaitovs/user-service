import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '@/storeDto/store.dto';
import { CacheService } from '@/storeServices/cache.service';
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
    const cached = await this.cacheService.getById(id);

    if (cached) {
      return cached;
    }

    const store = await this.storeService.getByIdOrThrow(id);

    await this.cacheService.set(store);

    return store;
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

    await this.cacheService.set(store);

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
      await this.cacheService.revalidate(id);
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
      await this.cacheService.invalidate(id);
    }

    return deleted;
  }
}
