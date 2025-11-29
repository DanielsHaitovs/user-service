import { BaseModule } from '@/base/base.module';
import { DepartmentController } from '@/department/department.controller';
import { Departments } from '@/department/entities/department.entity';
import { DepartmentHelperService } from '@/department/helper/helper.service';
import { DepartmentService } from '@/department/services/department.service';
import { QueryService } from '@/department/services/query.service';
import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Departments, User]), BaseModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, QueryService, DepartmentHelperService],
  exports: [DepartmentService, QueryService, DepartmentHelperService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DepartmentModule {}
