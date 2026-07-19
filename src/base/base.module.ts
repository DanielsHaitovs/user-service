import { HealthController } from '@/base/health.controller';
import { CacheService } from '@/baseServices/cache.service';
import { EntityQueryService } from '@/baseServices/query.service';
import { RedisService } from '@/baseServices/redis.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  controllers: [HealthController],
  providers: [EntityQueryService, CacheService, RedisService],
  exports: [EntityQueryService, CacheService, RedisService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BaseModule {}
