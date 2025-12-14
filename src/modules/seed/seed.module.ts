import { SeedController } from '@/seed/seed.controller';
import { SeedService } from '@/seed/seed.service';
import { User } from '@/userEntities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SeedController],
  providers: [SeedService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SeedModule {}
