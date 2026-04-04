import { UserController } from '@/user/controllers/user.controller';
import { UserPipelineService } from '@/user/user.pipeline';
import { User } from '@/userEntities/user.entity';
import { CreateService } from '@/userService/user/create.service';
import { UserService } from '@/userService/user/user.service.';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [CreateService, UserService, UserPipelineService],
  exports: [UserPipelineService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserModule {}
