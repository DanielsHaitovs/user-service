/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { DepartmentModule } from '@/department/department.module';
import { TraceMiddleware } from '@/middleware/tracing.middleware';
import { RolesModule } from '@/role/role.module';
import { UserModule } from '@/user/user.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { AppController } from './modules/app.controller';

@Module({
  controllers: [AppController],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        host: configService.get('DATABASE_HOST') ?? 'localhost',
        port: parseInt(configService.get('DATABASE_PORT') ?? '5432', 10),
        username: configService.get('DATABASE_USERNAME') ?? 'postgres',
        password: configService.get('DATABASE_PASSWORD') ?? 'postgres',
        database: configService.get('DATABASE_NAME') ?? 'postgres',
        synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
        logging: configService.get('DATABASE_LOGGING') === 'true',
        entities: [`${__dirname}/**/*.entity{.ts,.js}`],
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    RolesModule,
    DepartmentModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
