import { EntityQueryService } from '@/base/service/query.service';
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
import { UserRoleHelperService } from '@/userRoleServices/helper.service';
import { UserRolesService } from '@/userRoleServices/role.service';
import { CreateService } from '@/userServices/create.service';
import { UserHelperService } from '@/userServices/helper.service';
import { UserService } from '@/userServices/user.service';
import { UserStoreHelperService } from '@/userStoreServices/helper.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles, Store, UserRoles, UserStores]),
  ],
  controllers: [UserController, UserRolesController, UserStoresController],
  providers: [
    CreateService,
    UserService,
    UserStoresService,
    UserHelperService,
    UserRolesService,
    UserPipelineService,
    UserRolePipelineService,
    UserStorePipelineService,
    StoreHelperService,
    RoleHelperService,
    UserRoleHelperService,
    UserStoreHelperService,
    EntityQueryService,
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
