/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AuthModule } from '@/auth/auth.module';
import { BaseModule } from '@/base/base.module';
import { EnvConfigService } from '@/config/env/env.config.service';
import { EnvConfigModule } from '@/config/env/env.module';
import { TraceMiddleware } from '@/middleware/tracing.middleware';
import { RolesModule } from '@/role/role.module';
import { StoreModule } from '@/store/store.module';
import { UserModule } from '@/user/user.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [],
  providers: [],
  imports: [
    EnvConfigModule,
    ThrottlerModule.forRootAsync({
      useFactory: (configService: EnvConfigService) => {
        return {
          throttlers: [
            {
              ttl: configService.throttleTtl,
              limit: configService.throttleLimit,
            },
          ],
        };
      },
      inject: [EnvConfigService],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: EnvConfigService) => ({
        type: 'postgres',
        cache: {
          type: 'database',
          duration: 600000,
        },
        // poolSize: 50,
        // extra: { max: 50, idleTimeoutMillis: 30000, statement_timeout: 0 },
        host: configService.databaseHost,
        port: configService.databasePort,
        username: configService.databaseUsername,
        password: configService.databasePassword,
        database: configService.databaseName,
        synchronize: configService.databaseSync,
        logging: configService.databaseLogging ? 'all' : ['error'],
        entities: [`${__dirname}/**/*.entity{.ts,.js}`],
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        autoLoadEntities: true,
      }),
      // 4. This injects your custom service and passes it to the useFactory above
      inject: [EnvConfigService],
    }),
    UserModule,
    RolesModule,
    StoreModule,
    BaseModule,
    AuthModule,
    // ...(process.env.NODE_ENV === 'development' ? [SeedModule] : []),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
