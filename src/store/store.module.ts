import { EntityQueryService } from '@/baseServices/query.service';
import { StoreController } from '@/store/controllers/store.controller';
import { StorePipelineService } from '@/store/store.pipeline';
import { Store } from '@/storeEntities/store.entity';
import { CreateService } from '@/storeServices/create.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import { StoreService } from '@/storeServices/store.service';
import { UpdateService } from '@/storeServices/update.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserStores } from '../user/entities/userStores.entity';
import { UserStoresService } from '../user/services/store/store.service';

import { DeleteService } from './services/delete.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User, UserStores])],
  controllers: [StoreController],
  providers: [
    StoreHelperService,
    CreateService,
    UpdateService,
    DeleteService,
    StoreService,
    StorePipelineService,
    UserHelperService,
    EntityQueryService,
    UserStoresService,
  ],
  exports: [StorePipelineService, StoreHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StoreModule {}
