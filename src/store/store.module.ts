import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { STORE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { StoreController } from '@/store/controllers/store.controller';
import { StorePipelineService } from '@/store/store.pipeline';
import { Store } from '@/storeEntities/store.entity';
import { AuditProducerService } from '@/storeServices/audit.service';
import { CreateService } from '@/storeServices/create.service';
import { DeleteService } from '@/storeServices/delete.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import { StoreService } from '@/storeServices/store.service';
import { UpdateService } from '@/storeServices/update.service';
import { User } from '@/userEntities/user.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    BullModule.registerQueue({
      name: STORE_AUDIT_QUEUE,
    }),
    TypeOrmModule.forFeature([Store, User, UserStores]),
  ],
  controllers: [StoreController],
  providers: [
    Logger,
    StoreHelperService,
    CreateService,
    UpdateService,
    DeleteService,
    StoreService,
    StorePipelineService,
    UserHelperService,
    CacheService,
    AuditProducerService,
    EntityQueryService,
  ],
  exports: [StorePipelineService, StoreHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StoreModule {}
