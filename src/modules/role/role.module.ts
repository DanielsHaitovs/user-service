import { PermissionController } from '@/role/controllers/permission.controller';
import { RolesController } from '@/role/controllers/role.controller';
import { Permission } from '@/roleEntities/permissions.entity';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleHelper/helper.service';
import { PermissionService } from '@/rolePermissionServices/permission.service';
import { QueryService as PermissionQueryService } from '@/rolePermissionServices/query.service';
import { QueryService as RoleQueryService } from '@/roleServices/query.service';
import { RoleService } from '@/roleServices/role.service';
import { User } from '@/userEntities/user.entity';
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
  exports: [RoleHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
