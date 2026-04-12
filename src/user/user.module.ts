import { EntityQueryService } from '@/base/service/query.service';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { UserRolesController } from '@/user/controllers/roles.controller';
import { UserController } from '@/user/controllers/user.controller';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { UserPipelineService } from '@/user/user.pipeline';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userService/role/role.service';
import { CreateService } from '@/userService/user/create.service';
import { UserHelperService } from '@/userService/user/helper.service.';
import { UserService } from '@/userService/user/user.service.';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Roles])],
  controllers: [UserController, UserRolesController],
  providers: [
    CreateService,
    UserService,
    UserHelperService,
    UserRolesService,
    UserPipelineService,
    UserRolePipelineService,
    RoleHelperService,
    EntityQueryService,
  ],
  exports: [UserPipelineService, UserHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
