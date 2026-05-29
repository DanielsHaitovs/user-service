import { EntityQueryService } from '@/base/service/query.service';
import { PermissionModule } from '@/permission/permission.module';
import { RolePermissionsController } from '@/role/controllers/permissions.controller';
import { RoleController } from '@/role/controllers/role.controller';
import { RolePipelineService } from '@/role/role.pipeline';
import { Roles } from '@/roleEntities/role.entity';
import { CreateService } from '@/roleServices/create.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { RolePermissionService } from '@/roleServices/permission.service';
import { RoleService } from '@/roleServices/role.service';
import { UpdateService } from '@/roleServices/update.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, User]), PermissionModule],
  controllers: [RoleController, RolePermissionsController],
  providers: [
    RoleService,
    RolePermissionService,
    CreateService,
    UpdateService,
    UserHelperService,
    RoleHelperService,
    RolePipelineService,
    EntityQueryService,
  ],
  exports: [RolePipelineService, RoleHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
