/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AuthModule } from '@/auth/auth.module';
import { BaseModule } from '@/base/base.module';
import { EnvConfigService } from '@/config/env/env.config.service';
import { EnvConfigModule } from '@/config/env/env.module';
import { TraceMiddleware } from '@/middleware/tracing.middleware';
import { RolesModule } from '@/role/role.module';
import { StoreModule } from '@/store/store.module';
import { SystemModule } from '@/system/system.module';
import { UserModule } from '@/user/user.module';
import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from 'nestjs-pino';

@Module({
  controllers: [],
  providers: [],
  imports: [
    EnvConfigModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      useFactory: () => {
        return {
          pinoHttp: {
            autoLogging: false,
            level: 'trace',
            serializers: {
              req: () => undefined,
              res: () => undefined,
            },
            // transport: {
            //   target: 'pino-pretty',
            //   options: {
            //     pid: true,
            //     colorize: true,
            //     singleLine: true,
            //     translateTime: 'SYS:mm/dd/yyyy, h:MM:ss TT',
            //     messageFormat: '[{context}] {msg}',
            //     ignore: 'hostname,context,req',
            //   },
            // },
          },
        };
      },
    }),
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
          type: 'ioredis',
          options: {
            host: configService.redisHost,
            port: configService.redisPort,
            password: configService.redisPassword,
          },
          alwaysEnabled: false,
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
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [EnvConfigService],
      useFactory: (configService: EnvConfigService) => {
        const redisUrl = `redis://:${configService.redisPassword}@${configService.redisHost}:${configService.redisPort.toString()}`;

        return {
          // Notice it is 'stores' (plural) and uses createKeyv!
          stores: [createKeyv(redisUrl)],
          ttl: 10000,
        };
      },
    }),
    UserModule,
    RolesModule,
    StoreModule,
    BaseModule,
    AuthModule,
    SystemModule,
    // ...(process.env.NODE_ENV === 'development' ? [SeedModule] : []),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
