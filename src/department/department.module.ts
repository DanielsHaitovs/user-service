import { Departments } from '@/departmentEntities/department.entity';
import { User } from '@/userEntities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Departments, User])],
  controllers: [],
  providers: [],
  exports: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DepartmentModule {}
