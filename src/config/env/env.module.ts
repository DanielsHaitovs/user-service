import { EnvConfigService } from '@/config/env/env.config.service';
import { validate } from '@/config/env/env.validation';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '../.env',
    }),
  ],
  providers: [EnvConfigService],
  exports: [EnvConfigService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EnvConfigModule {}
