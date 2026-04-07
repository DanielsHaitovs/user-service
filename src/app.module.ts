/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TraceMiddleware } from '@/middleware/tracing.middleware';
import { RolesModule } from '@/role/role.module';
import { StoreModule } from '@/store/store.module';
import { UserModule } from '@/user/user.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line sonarjs/function-return-type
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const ttl = parseInt(
          configService.get<string>('THROTTLE_TTL') ?? '60',
          10,
        );
        const limit = parseInt(
          configService.get<string>('THROTTLE_LIMIT') ?? '5',
          10,
        );

        return {
          throttlers: [
            {
              ttl,
              limit,
            },
          ],
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        cache: {
          type: 'database',
          duration: 600000,
        },
        host: configService.get('USER_DATABASE_HOST') ?? 'localhost',
        port: parseInt(configService.get('USER_DATABASE_PORT') ?? '5432', 10),
        username: configService.get('USER_DATABASE_USERNAME') ?? 'postgres',
        password: configService.get('USER_DATABASE_PASSWORD') ?? 'postgres',
        database: configService.get('USER_DATABASE_NAME') ?? 'postgres',
        synchronize: configService.get('USER_DATABASE_SYNC') === 'true',
        // poolSize: 50,
        // extra: { max: 50, idleTimeoutMillis: 30000, statement_timeout: 0 },
        logging:
          configService.get('USER_DATABASE_LOGGING') === 'true'
            ? ['error']
            : false,
        entities: [`${__dirname}/**/*.entity{.ts,.js}`],
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    RolesModule,
    StoreModule,
    // ...(process.env.NODE_ENV === 'development' ? [SeedModule] : []),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
