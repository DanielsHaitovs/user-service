import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [EntityQueryService, CacheService],
  exports: [EntityQueryService, CacheService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BaseModule {}
