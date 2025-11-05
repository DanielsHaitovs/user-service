import { EntityQueryService } from '@/base/service/query.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [EntityQueryService],
  exports: [EntityQueryService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BaseModule {}
