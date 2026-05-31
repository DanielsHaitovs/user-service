import { EntityQueryService } from '@/baseServices/query.service';
import { PermissionModule } from '@/permission/permission.module';
import { RolePermissionsController } from '@/role/controllers/permissions.controller';
import { RoleController } from '@/role/controllers/role.controller';
import { RolePipelineService } from '@/role/role.pipeline';
import { Roles } from '@/roleEntities/role.entity';
import { CreateService } from '@/roleServices/create.service';
import { DeleteService } from '@/roleServices/delete.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { RolePermissionService } from '@/roleServices/permission.service';
import { RoleService } from '@/roleServices/role.service';
import { UpdateService } from '@/roleServices/update.service';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { UserHelperService } from '@/userServices/helper.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, User, UserRoles]),
    PermissionModule,
  ],
  controllers: [RoleController, RolePermissionsController],
  providers: [
    RoleService,
    RolePermissionService,
    CreateService,
    UpdateService,
    DeleteService,
    UserHelperService,
    UserRolesService,
    RoleHelperService,
    RolePipelineService,
    EntityQueryService,
  ],
  exports: [RolePipelineService, RoleHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
