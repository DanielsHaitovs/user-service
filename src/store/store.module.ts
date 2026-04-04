import { Store } from '@/storeEntities/store.entity';
import { User } from '@/userEntities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User])],
  controllers: [],
  providers: [],
  exports: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StoreModule {}
