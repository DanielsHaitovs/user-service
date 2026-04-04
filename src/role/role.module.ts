import { Permission } from '@/roleEntities/permissions.entity';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, Permission, User])],
  controllers: [],
  providers: [],
  exports: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RolesModule {}
