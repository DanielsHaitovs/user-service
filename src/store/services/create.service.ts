import { STORE_QUERY_ALIAS } from '@/commonConst/store.const';
import { CreateStoreDto, StoreResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
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

    await this.throwIfNotUnique({ name, code, viewCode });

    const newStore = this.storeRepository.create(createDto);

    newStore.createdBy = {
      id: createdById,
    } as User;

    return await this.storeRepository.save(newStore);
  }

  /**
   * Validates that a store with the given name, code, or view code does not already exist.
   * @param name - The name of the store to validate.
   * @param code - The code of the store to validate.
   * @param viewCode - The view code of the store to validate.
   * @throws ConflictException if a store with the given name, code, or view code already exists.
   */
  private async throwIfNotUnique({
    name,
    code,
    viewCode,
  }: {
    name?: string | undefined;
    code?: string | undefined;
    viewCode?: string | undefined;
  }): Promise<void> {
    if (name == undefined && code == undefined && viewCode == undefined) {
      throw new UnprocessableEntityException(
        'Cannot validate if store exists.',
      );
    }

    const query = this.storeRepository.createQueryBuilder(STORE_QUERY_ALIAS);

    if (name != undefined) {
      query.orWhere(`${STORE_QUERY_ALIAS}.name = :name`, { name });
    }

    if (code != undefined) {
      query.orWhere(`${STORE_QUERY_ALIAS}.code = :code`, { code });
    }

    if (viewCode != undefined) {
      query.orWhere(`${STORE_QUERY_ALIAS}.viewCode = :viewCode`, { viewCode });
    }

    const existingStore = await query.getMany();

    if (existingStore.length > 0) {
      throw new ConflictException('A store already exists.');
    }
  }
}
