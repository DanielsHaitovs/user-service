import { CreateStoreDto, StoreResponseDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly userHelper: UserHelperService,
    private readonly storeHelper: StoreHelperService,
  ) {}

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateStoreDto;
    createdById: UUID;
  }): Promise<StoreResponseDto> {
    const { name, code, viewCode } = createDto;
    await this.userHelper.validateIfExists({ id: createdById });
    await this.storeHelper.throwIfExists({ name, code, viewCode });

    const newStore = this.storeRepository.create(createDto);

    newStore.createdBy = {
      id: createdById,
    } as User;

    return await this.storeRepository.save(newStore);
  }
}
