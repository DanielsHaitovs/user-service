import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { UserController } from '@/user/controllers/user.controller';
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
  controllers: [UserController],
  providers: [
    CreateService,
    UserService,
    UserHelperService,
    UserRolesService,
    UserPipelineService,
    RoleHelperService,
  ],
  exports: [UserPipelineService, UserHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
