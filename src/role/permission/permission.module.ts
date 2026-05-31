import { EntityQueryService } from '@/baseServices/query.service';
import { PermissionController } from '@/permission/controllers/permission.controller';
import { PermissionPipelineService } from '@/permission/permission.pipeline';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { PermissionService } from '@/permissionServices/permission.service';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Roles, User])],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PermissionPipelineService,
    UserHelperService,
    PermissionHelperService,
    RoleHelperService,
    EntityQueryService,
  ],
  exports: [PermissionPipelineService, PermissionHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PermissionModule {}
