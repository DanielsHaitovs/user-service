import { Store } from '@/storeEntities/store.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
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
   * Validates that a store with the given name, code, or view code does not already exist.
   * @param name - The name of the store to validate.
   * @param code - The code of the store to validate.
   * @param viewCode - The view code of the store to validate.
   * @throws ConflictException if a store with the given name, code, or view code already exists.
   */
  async throwIfExists({
    name,
    code,
    viewCode,
  }: {
    name: string;
    code: string;
    viewCode: string;
  }): Promise<void> {
    const existingStore = await this.storeRepository.find({
      where: [{ name }, { code }, { viewCode }],
    });

    if (existingStore.length > 0) {
      throw new ConflictException(
        `A store with the name "${name}", code "${code}", or view code "${viewCode}" already exists.`,
      );
    }
  }

  /**
   * Validates that a store with the given codes exists.
   * @param codes - The codes of the stores to validate.
   * @return The IDs of the existing stores with the given codes.
   * @throws UnprocessableEntityException if any of the provided store codes do not exist.
   */
  async validateStoreExists(codes: string[]): Promise<UUID[]> {
    const existingStores = await this.storeRepository.find({
      where: {
        code: In(codes),
      },
    });

    if (existingStores.length != codes.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following permission codes do not exist: ${codes
          .filter((code) => !existingStores.some((p) => p.code === code))
          .join(', ')}`,
      );
    }

    return existingStores.map((s) => s.id);
  }
}
