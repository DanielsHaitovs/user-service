import { BaseModule } from '@/base/base.module';
import { DepartmentModule } from '@/department/department.module';
import { UserController } from '@/modules/user/controllers/user.controller';
import { RolesModule } from '@/role/role.module';
import { UserDepartmentsController } from '@/user/controllers/department.controller';
import { User } from '@/user/entities/user.entity';
import { UserDepartments } from '@/user/entities/userDepartments.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { UserHelperService } from '@/user/helper/helper.service';
import { UserCreateService } from '@/user/services/create.service';
import { UserDepartmentsService } from '@/user/services/departments/user-departments.service';
import { QueryService } from '@/user/services/query.service';
import { UserRoleService } from '@/user/services/roles/user-role.service';
import { UserService } from '@/user/services/user.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([User, UserRole, UserDepartments]),
    DepartmentModule,
    RolesModule,
  ],
  controllers: [UserController, UserDepartmentsController],
  providers: [
    UserService,
    UserDepartmentsService,
    UserRoleService,
    QueryService,
    UserHelperService,
    UserCreateService,
  ],
  exports: [UserService, QueryService, UserHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
