import { GetStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Not, Repository } from 'typeorm';

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
    name?: string | undefined;
    code?: string | undefined;
    viewCode?: string | undefined;
  }): Promise<void> {
    const query = this.storeRepository.createQueryBuilder('store');

    if (name == undefined && code == undefined && viewCode == undefined) {
      throw new ConflictException('A store already exists.');
    }

    if (name != undefined) {
      query.orWhere('store.name = :name', { name });
    }

    if (code != undefined) {
      query.orWhere('store.code = :code', { code });
    }

    if (viewCode != undefined) {
      query.orWhere('store.viewCode = :viewCode', { viewCode });
    }

    const existingStore = await query.getMany();

    if (existingStore.length > 0) {
      throw new ConflictException('A store already exists.');
    }
  }

  /**
   * Validates that a store with the given name, code, or view code does not already exist, excluding the store with the provided ID.
   * @param name - The name of the store to validate.
   * @param code - The code of the store to validate.
   * @param viewCode - The view code of the store to validate.
   * @param id - The ID of the store to exclude from the validation.
   * @throws UnprocessableEntityException if no fields are provided for validation or if a store with the given name, code, or view code already exists (excluding the store with the provided ID).
   */
  async validateUniqueFields({
    name,
    code,
    viewCode,
    id,
  }: {
    name?: string | undefined;
    code?: string | undefined;
    viewCode?: string | undefined;
    id: UUID;
  }): Promise<void> {
    const store = await this.validateIfExists(id);

    if (name == undefined && code == undefined && viewCode == undefined) {
      throw new UnprocessableEntityException(
        `Cannot update store with ID ${id}.`,
      );
    }

    const validationPromises = new Array<Promise<boolean>>();

    if (name != undefined && name !== store.name) {
      validationPromises.push(this.isUniqueNameOrThrow({ name, id }));
    }

    if (code != undefined && code !== store.code) {
      validationPromises.push(this.isUniqueCodeOrThrow({ code, id }));
    }

    if (viewCode != undefined && viewCode !== store.viewCode) {
      validationPromises.push(this.isUniqueViewCodeOrThrow({ viewCode, id }));
    }

    if (validationPromises.length > 0) {
      await Promise.all(validationPromises);
    }
  }

  /**
   * Validates that a store with the given name does not already exist, excluding the store with the provided ID.
   * @param name - The name of the store to validate.
   * @param id - The ID of the store to exclude from the validation.
   * @returns A promise that resolves to a boolean indicating whether the name is unique (true) or already exists (false).
   */
  private async isUniqueNameOrThrow({
    name,
    id,
  }: {
    name: string;
    id: UUID;
  }): Promise<boolean> {
    const existingStore = await this.storeRepository.findOne({
      where: {
        name,
        id: Not(id),
      },
    });

    return !existingStore;
  }

  /**
   * Validates that a store with the given code does not already exist, excluding the store with the provided ID.
   * @param code - The code of the store to validate.
   * @param id - The ID of the store to exclude from the validation.
   * @returns A promise that resolves to a boolean indicating whether the code is unique (true) or already exists (false).
   */
  private async isUniqueCodeOrThrow({
    code,
    id,
  }: {
    code: string;
    id: UUID;
  }): Promise<boolean> {
    const existingStore = await this.storeRepository.findOne({
      where: {
        code,
        id: Not(id),
      },
    });

    return !existingStore;
  }

  /**
   * Validates that a store with the given view code does not already exist, excluding the store with the provided ID.
   * @param viewCode - The view code of the store to validate.
   * @param id - The ID of the store to exclude from the validation.
   * @returns A promise that resolves to a boolean indicating whether the view code is unique (true) or already exists (false).
   */
  private async isUniqueViewCodeOrThrow({
    viewCode,
    id,
  }: {
    viewCode: string;
    id: UUID;
  }): Promise<boolean> {
    const existingStore = await this.storeRepository.findOne({
      where: {
        viewCode,
        id: Not(id),
      },
    });

    return !existingStore;
  }

  /**
   * Validates that a store with the given ids exists.
   * @param ids - The ids of the stores to validate.
   * @return The IDs of the existing stores with the given ids.
   * @throws UnprocessableEntityException if any of the provided store ids do not exist.
   */
  async manyExistsByIdOrThrow(ids?: string[]): Promise<GetStoreDto[]> {
    if (ids == undefined || ids.length === 0) {
      return [];
    }

    const existingStores = await this.storeRepository.find({
      where: {
        id: In(ids),
      },
    });

    if (existingStores.length != ids.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following permission ids do not exist: ${ids
          .filter((id) => !existingStores.some((s) => s.id === id))
          .join(', ')}`,
      );
    }

    return existingStores;
  }

  /**
   * Validates that a store with the given ID exists and retrieves it.
   * @param id - The UUID of the store to validate and retrieve.
   * @returns A promise that resolves to the GetStoreDto of the found store.
   * @throws EntityNotFoundException if no store with the given ID is found.
   */
  private async validateIfExists(id: UUID): Promise<GetStoreDto> {
    return await this.storeRepository.findOneOrFail({
      where: { id },
    });
  }
}
