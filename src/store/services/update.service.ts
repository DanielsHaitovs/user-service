import { updatedResults } from '@/base/helper/update';
import { UpdateStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Not, Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /**
   * Updates an existing store with the provided details.
   * @param updateDto - The data transfer object containing the details to update the store with.
   * @param id - The unique identifier of the store to be updated.
   * @returns A promise that resolves to a boolean indicating whether the update was successful.
   * @throws NotFoundException if the store with the provided ID does not exist.
   * @throws ConflictException if a store with the same name, code, or view code already exists (if those fields are being updated).
   */
  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateStoreDto;
    id: UUID;
  }): Promise<boolean> {
    await this.validateUniqueFields({
      updateDto,
      id,
    });

    const updateStore = this.storeRepository.create(updateDto);

    const updated = await this.storeRepository.update(id, updateStore);

    return updatedResults(updated);
  }

  /**
   * Validates that a store with the given name, code, or view code does not already exist, excluding the store with the provided ID.
   * @param store - The existing store being updated.
   * @param updateDto - The data transfer object containing the updated store details.
   * @param id - The ID of the store to exclude from the validation.
   * @throws ConflictException if a store with the given name, code, or view code already exists (excluding the store with the provided ID).
   */
  private async validateUniqueFields({
    updateDto,
    id,
  }: {
    updateDto: UpdateStoreDto;
    id: UUID;
  }): Promise<void> {
    const store = await this.storeRepository.findOneOrFail({
      where: { id },
    });

    const { name, code, viewCode } = updateDto;

    if (name == undefined && code == undefined && viewCode == undefined) {
      throw new UnprocessableEntityException(
        `Cannot update store with ID ${id}.`,
      );
    }

    const match = await this.storeRepository.findOne({
      where: {
        ...(name != undefined && name !== store.name ? { name } : {}),
        ...(code != undefined && code !== store.code ? { code } : {}),
        ...(viewCode != undefined && viewCode !== store.viewCode
          ? { viewCode }
          : {}),
        id: Not(id),
      },
    });

    if (match) {
      throw new ConflictException(
        `Cannot update store with ID ${id}. A store with the same name, code, or view code already exists.`,
      );
    }
  }
}
