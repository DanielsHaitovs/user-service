import { updatedResults } from '@/base/update';
import { UpdateStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly storeHelper: StoreHelperService,
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
    const { name, code, viewCode } = updateDto;

    await this.storeHelper.validateUniqueFields({ name, code, viewCode, id });

    const updateStore = this.storeRepository.create(updateDto);

    const updated = await this.storeRepository.update(id, updateStore);

    return updatedResults(updated);
  }
}
