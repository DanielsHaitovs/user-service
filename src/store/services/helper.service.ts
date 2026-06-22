import { Store } from '@/storeEntities/store.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class StoreHelperService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /**
   * Validates that a store with the given ids exists.
   * @param ids - The ids of the stores to validate.
   * @return The IDs of the existing stores with the given ids.
   * @throws UnprocessableEntityException if any of the provided store ids do not exist.
   */
  async checkIfManyExistOrThrow(ids?: UUID[]): Promise<UUID[]> {
    if (ids == undefined || ids.length === 0) {
      throw new UnprocessableEntityException('No store ids provided.');
    }

    const existingStores = await this.storeRepository.find({
      where: {
        id: In(ids),
      },
      select: ['id'],
    });

    if (existingStores.length != ids.length) {
      throw new UnprocessableEntityException(
        `Failed to validate store. The following store ids do not exist: ${ids
          .filter((id) => !existingStores.some((s) => s.id === id))
          .join(', ')}`,
      );
    }

    return existingStores.map((s) => s.id);
  }
}
