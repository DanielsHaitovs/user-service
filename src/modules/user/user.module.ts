import { BaseModule } from '@/base/base.module';
import { DepartmentModule } from '@/department/department.module';
import { User } from '@/user/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [BaseModule, DepartmentModule, TypeOrmModule.forFeature([User])],
  controllers: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
