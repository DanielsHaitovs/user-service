/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AuthModule } from '@/auth/auth.module';
import { BaseModule } from '@/base/base.module';
import { MetricsController } from '@/base/metrics.controller';
import { EnvConfigService } from '@/config/env/env.config.service';
import { EnvConfigModule } from '@/config/env/env.module';
import { Environment } from '@/config/env/env.validation';
import { IdempotencyInterceptor } from '@/interceptors/idempotency.interceptor';
import { MetricsInterceptor } from '@/interceptors/metrics.interceptor';
import { ResourceLockInterceptor } from '@/interceptors/resource-lock.interceptor';
import { TraceMiddleware } from '@/middleware/tracing.middleware';
import { RolesModule } from '@/role/role.module';
import { StoreModule } from '@/store/store.module';
import { SystemModule } from '@/system/system.module';
import { UserModule } from '@/user/user.module';
import { createKeyv } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationShutdown,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';

import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';

export const httpRequestDurationProvider = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

@Module({
  controllers: [],
  imports: [
    EnvConfigModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [EnvConfigService],
      useFactory: (configService: EnvConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
          password: configService.redisPassword,
        },
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [EnvConfigService],
      useFactory: (configService: EnvConfigService) => {
        return {
          pinoHttp: {
            autoLogging: false,
            level: 'trace',
            serializers: {
              req: () => undefined,
              res: () => undefined,
              err: pino.stdSerializers.err,
            },
            ...(configService.nodeEnv === Environment.Test ||
            configService.nodeEnv === Environment.Development
              ? {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      pid: true,
                      colorize: true,
                      singleLine: true,
                      translateTime: 'SYS:mm/dd/yyyy, h:MM:ss TT',
                      messageFormat: '[{context}] {msg}',
                      ignore: 'hostname,context,req',
                    },
                  },
                }
              : {}),
            ...(configService.nodeEnv !== Environment.Test
              ? {
                  stream: pino.destination({ sync: false, minLength: 4096 }),
                }
              : {}),
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
      inject: [EnvConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [EnvConfigService],
      useFactory: (configService: EnvConfigService) => {
        const redisUrl = `redis://:${configService.redisPassword}@${configService.redisHost}:${configService.redisPort.toString()}`;

        return {
          stores: [createKeyv(redisUrl)],
          ttl: configService.userCacheTtl,
        };
      },
    }),
    PrometheusModule.registerAsync({
      controller: MetricsController,
      useFactory: () => ({
        path: '/metrics',
        global: true,
        defaultMetrics: {
          enabled: true,
        },
      }),
    }),
    UserModule,
    RolesModule,
    StoreModule,
    BaseModule,
    AuthModule,
    SystemModule,
    // ...(process.env.NODE_ENV === 'development' ? [SeedModule] : []),
  ],
  providers: [
    httpRequestDurationProvider,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: EnvConfigService) => {
        return new Redis({
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword,
        });
      },
      inject: [EnvConfigService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResourceLockInterceptor,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class AppModule implements NestModule, OnApplicationShutdown {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).exclude('metrics').forRoutes('*');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redisClient.quit();
  }
}
