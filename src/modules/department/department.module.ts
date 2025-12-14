import { DepartmentController } from '@/department/department.controller';
import { Departments } from '@/departmentEntities/department.entity';
import { DepartmentHelperService } from '@/departmentHelper/helper.service';
import { DepartmentService } from '@/departmentServices/department.service';
import { QueryService } from '@/departmentServices/query.service';
import { User } from '@/userEntities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Departments, User])],
  controllers: [DepartmentController],
  providers: [DepartmentService, QueryService, DepartmentHelperService],
  exports: [DepartmentHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DepartmentModule {}
