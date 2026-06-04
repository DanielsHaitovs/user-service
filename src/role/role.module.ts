import { BaseCacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { PermissionModule } from '@/permission/permission.module';
import { RolePermissionsController } from '@/role/controllers/permissions.controller';
import { RoleController } from '@/role/controllers/role.controller';
import { RolePipelineService } from '@/role/role.pipeline';
import { Roles } from '@/roleEntities/role.entity';
import { CacheService } from '@/roleServices/cache.service';
import { CreateService } from '@/roleServices/create.service';
import { DeleteService } from '@/roleServices/delete.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { RolePermissionService } from '@/roleServices/permission.service';
import { RoleService } from '@/roleServices/role.service';
import { UpdateService } from '@/roleServices/update.service';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, User, UserRoles]),
    PermissionModule,
  ],
  controllers: [RoleController, RolePermissionsController],
  providers: [
    Logger,
    RoleService,
    CacheService,
    RolePermissionService,
    CreateService,
    UpdateService,
    DeleteService,
    UserHelperService,
    RoleHelperService,
    RolePipelineService,
    BaseCacheService,
    EntityQueryService,
  ],
  exports: [RolePipelineService, RoleHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
