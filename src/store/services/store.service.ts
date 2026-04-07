import { GetStoreDto } from '@/storeDto/store.dto';
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
  ) {}

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
