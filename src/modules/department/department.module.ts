import { BaseModule } from '@/base/base.module';
import { DepartmentController } from '@/department/department.controller';
import { Department } from '@/department/entities/department.entity';
import { DepartmentService } from '@/department/services/department.service';
import { DepartmentQueryService } from '@/department/services/query.service';
import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Department, User]), BaseModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentQueryService],
  exports: [DepartmentService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DepartmentModule {}
