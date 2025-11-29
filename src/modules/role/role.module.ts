import { PermissionController } from '@/role/controllers/permission.controller';
import { RolesController } from '@/role/controllers/role.controller';
import { Permission } from '@/role/entities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import { RoleHelperService } from '@/role/helper/helper.service';
import { PermissionService } from '@/role/services/permission/permission.service';
import { QueryService as PermissionQueryService } from '@/role/services/permission/query.service';
import { QueryService as RoleQueryService } from '@/role/services/role/query.service';
import { RoleService } from '@/role/services/role/role.service';
import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, Permission, User])],
  controllers: [RolesController, PermissionController],
  providers: [
    RoleService,
    RoleQueryService,
    RoleHelperService,
    PermissionService,
    PermissionQueryService,
  ],
  exports: [
    RoleService,
    RoleQueryService,
    RoleHelperService,
    PermissionService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
