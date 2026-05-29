import { EntityQueryService } from '@/base/service/query.service';
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

@Module({
  imports: [TypeOrmModule.forFeature([Store, User])],
  controllers: [StoreController],
  providers: [
    StoreHelperService,
    CreateService,
    UpdateService,
    StoreService,
    StorePipelineService,
    UserHelperService,
    EntityQueryService,
  ],
  exports: [StorePipelineService, StoreHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StoreModule {}
