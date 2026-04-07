// import { CreateStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly userHelper: UserHelperService,
  ) {}

  // async create({
  //   createDto,
  //   createdById,
  // }: {
  //   createDto: CreateStoreDto;
  //   createdById: UUID;
  // }) {
  //   await this.userHelper.validateIfExists({ id: createdById });
  // }
}
