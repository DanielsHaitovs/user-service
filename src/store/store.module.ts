import { Store } from '@/storeEntities/store.entity';
import { CreateService } from '@/storeServices/create.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User])],
  controllers: [],
  providers: [StoreHelperService, CreateService, UserHelperService],
  exports: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StoreModule {}
