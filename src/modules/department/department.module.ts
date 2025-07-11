import { DepartmentController } from '@/department/department.controller';
import { Department } from '@/department/entities/department.entity';
import { DepartmentService } from '@/department/services/department.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DepartmentModule {}
