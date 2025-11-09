import { BaseModule } from '@/base/base.module';
import { DepartmentModule } from '@/department/department.module';
import { RolesModule } from '@/role/role.module';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { HelperService } from '@/user/helper/helper.service';
import { UserDepartmentsService } from '@/user/services/departments/user-departments.service';
import { QueryService } from '@/user/services/query.service';
import { UserRoleService } from '@/user/services/roles/user-role.service';
import { UserService } from '@/user/services/user.service';
import { UserController } from '@/user/user.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([User, UserRole]),
    DepartmentModule,
    RolesModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserDepartmentsService,
    UserRoleService,
    QueryService,
    HelperService,
  ],
  exports: [UserService, QueryService, HelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
