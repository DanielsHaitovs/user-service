import { BaseCacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [EntityQueryService, BaseCacheService],
  exports: [EntityQueryService, BaseCacheService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BaseModule {}
