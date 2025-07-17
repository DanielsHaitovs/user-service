import { DepartmentModule } from '@/department/department.module';
import { RolesModule } from '@/role/role.module';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { UserQueryService } from '@/user/services/query.service';
import { UserRoleService } from '@/user/services/roles/userRole.service';
import { UserService } from '@/user/services/user/user.service';
import { UserController } from '@/user/user.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserRoleController } from './user-role.controller';

@Module({
  imports: [
    DepartmentModule,
    RolesModule,
    TypeOrmModule.forFeature([User, UserRole]),
  ],
  controllers: [UserController, UserRoleController],
  providers: [UserService, UserQueryService, UserRoleService],
  exports: [UserService, UserQueryService, UserRoleService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
