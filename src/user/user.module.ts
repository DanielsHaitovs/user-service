import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { USER_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { UserRolesController } from '@/user/controllers/roles.controller';
import { UserStoresController } from '@/user/controllers/stores.controller';
import { UserController } from '@/user/controllers/user.controller';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { AuditProducerService } from '@/user/services/audit.service';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { CreateService } from '@/userServices/create.service';
import { DeleteService } from '@/userServices/delete.service';
import { UserHelperService } from '@/userServices/helper.service';
import { UpdateService } from '@/userServices/update.service';
import { UserService } from '@/userServices/user.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    BullModule.registerQueue({
      name: USER_AUDIT_QUEUE,
    }),
    TypeOrmModule.forFeature([User, Roles, Store, UserRoles, UserStores]),
  ],
  controllers: [UserController, UserRolesController, UserStoresController],
  providers: [
    Logger,
    CreateService,
    UserService,
    UpdateService,
    DeleteService,
    UserStoresService,
    UserHelperService,
    UserRolesService,
    UserPipelineService,
    UserRolePipelineService,
    UserStorePipelineService,
    StoreHelperService,
    RoleHelperService,
    EntityQueryService,
    CacheService,
    AuditProducerService,
  ],
  exports: [
    UserPipelineService,
    UserHelperService,
    UserRolesService,
    UserStoresService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
