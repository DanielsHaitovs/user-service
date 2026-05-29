import { SystemIdentityService } from '@/system/identity.service';
import { SystemSeedService } from '@/system/system.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [SystemIdentityService, SystemSeedService],
  exports: [SystemIdentityService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SystemModule {}
