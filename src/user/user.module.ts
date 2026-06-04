import { BaseCacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { UserRolesController } from '@/user/controllers/roles.controller';
import { UserStoresController } from '@/user/controllers/stores.controller';
import { UserController } from '@/user/controllers/user.controller';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { CacheService as RoleCacheService } from '@/userRoleServices/cache.service';
import { UserRolesService } from '@/userRoleServices/role.service';
import { CacheService } from '@/userServices/cache.service';
import { CreateService } from '@/userServices/create.service';
import { DeleteService } from '@/userServices/delete.service';
import { UserHelperService } from '@/userServices/helper.service';
import { UpdateService } from '@/userServices/update.service';
import { UserService } from '@/userServices/user.service';
import { CacheService as StoreCacheService } from '@/userStoreServices/cache.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles, Store, UserRoles, UserStores]),
  ],
  controllers: [UserController, UserRolesController, UserStoresController],
  providers: [
    Logger,
    CacheService,
    StoreCacheService,
    RoleCacheService,
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
    BaseCacheService,
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
