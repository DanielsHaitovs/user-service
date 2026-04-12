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
import { UserRolesService } from '@/userService/role/role.service';
import { UserStoresService } from '@/userService/store/store.service';
import { CreateService } from '@/userService/user/create.service';
import { UserHelperService } from '@/userService/user/helper.service.';
import { UserService } from '@/userService/user/user.service.';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Roles, Store])],
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
    EntityQueryService,
  ],
  exports: [UserPipelineService, UserHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
