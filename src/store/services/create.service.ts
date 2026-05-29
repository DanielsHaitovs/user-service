import { CreateStoreDto, StoreResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { User } from '@/userEntities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly storeHelper: StoreHelperService,
  ) {}

  /**
   * Creates a new store with the provided details and associates it with the user who created it.
   * @param createDto - The data transfer object containing the details of the store to be created.
   * @param createdById - The unique identifier of the user who is creating the store.
   * @returns A promise that resolves to a StoreResponseDto containing the details of the newly created store.
   * @throws NotFoundException if the user with the provided ID does not exist.
   * @throws ConflictException if a store with the same name, code, or view code already exists.
   */
  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateStoreDto;
    createdById: UUID;
  }): Promise<StoreResponseDto> {
    const { name, code, viewCode } = createDto;

    await this.storeHelper.throwIfExists({ name, code, viewCode });

    const newStore = this.storeRepository.create(createDto);

    newStore.createdBy = {
      id: createdById,
    } as User;

    return await this.storeRepository.save(newStore);
  }
}
