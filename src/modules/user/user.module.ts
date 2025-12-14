import { DepartmentModule } from '@/department/department.module';
import { RolesModule } from '@/role/role.module';
import { UserDepartmentsController } from '@/user/controllers/department.controller';
import { UserRolesController } from '@/user/controllers/role.controller';
import { UserController } from '@/user/controllers/user.controller';
import { UserDepartmentsService } from '@/userDepartmentService/user-departments.service';
import { User } from '@/userEntities/user.entity';
import { UserDepartments } from '@/userEntities/userDepartments.entity';
import { UserRole } from '@/userEntities/userRoles.entity';
import { UserHelperService } from '@/userHelper/helper.service';
import { UserRoleService } from '@/userRoleService/user-role.service';
import { UserCreateService } from '@/userService/create.service';
import { QueryService } from '@/userService/query.service';
import { UserService } from '@/userService/user.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, UserDepartments]),
    DepartmentModule,
    RolesModule,
  ],
  controllers: [UserController, UserDepartmentsController, UserRolesController],
  providers: [
    UserService,
    UserDepartmentsService,
    UserRoleService,
    QueryService,
    UserHelperService,
    UserCreateService,
  ],
  exports: [UserHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
