import { PermissionController } from '@/role/controllers/permission.controller';
import { RolesController } from '@/role/controllers/role.controller';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { PermissionService } from '@/role/services/permission.service';
import { RoleQueryService } from '@/role/services/query.service';
import { RoleService } from '@/role/services/role.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RolesController, PermissionController],
  providers: [RoleService, PermissionService, RoleQueryService],
  exports: [RoleService, PermissionService, RoleQueryService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
