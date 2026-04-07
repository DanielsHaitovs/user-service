import { Store } from '@/storeEntities/store.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class HelperService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  // async throwIfExists({
  //   name,
  //   code,
  //   viewCode,
  // }: {
  //   name: string;
  //   code: string;
  //   viewCode: string;
  // }): Promise<void> {
  //   // const existingStore = await this.storeRepository.findBy({
  //   //   where: Or({ name }, { code }, { viewCode }),
  //   // })
  //   // if (existingStore) {
  //   //   const existingFields = [];
  //   //   if (existingStore.name === name) existingFields.push('name');
  //   //   if (existingStore.code === code) existingFields.push('code');
  //   //   if (existingStore.viewCode === viewCode) existingFields.push('viewCode');
  //   //   throw new Error(
  //   //     `A store with the same ${existingFields.join(', ')} already exists.`,
  //   //   );
  //   // }
  // }
}
