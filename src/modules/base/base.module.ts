import { QueryService } from '@/base/service/query.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [QueryService],
  exports: [QueryService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BaseModule {}
