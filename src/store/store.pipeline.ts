import { StoreQueryRequest } from '@/storeDto/query.dto';
import {
  CreateStoreDto,
  GetStoreDto,
  StoreListResponseDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '@/storeDto/store.dto';
import { CreateService } from '@/storeServices/create.service';
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
  ) {}

  async getMany(data: StoreQueryRequest): Promise<StoreListResponseDto> {
    return await this.storeService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetStoreDto> {
    return await this.storeService.getByIdOrThrow(id);
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
    return await this.createService.create({ createDto, createdById });
  }

  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateStoreDto;
    id: UUID;
  }): Promise<boolean> {
    return await this.updateService.update({ updateDto, id });
  }
}
