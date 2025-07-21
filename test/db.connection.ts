import { AuthModule } from '@/auth/auth.module';
import { DepartmentModule } from '@/department/department.module';
import { RolesModule } from '@/role/role.module';
import { UserModule } from '@/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

export const createTestModule = async (): Promise<{
  module: TestingModule;
  dataSource: DataSource;
}> => {
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      DepartmentModule,
      UserModule,
      RolesModule,
      AuthModule,
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get('DATABASE_HOST') ?? 'localhost',
          port: parseInt(configService.get('USER_DATABASE_PORT') ?? '5432', 10),
          username: configService.get('DATABASE_USERNAME') ?? 'postgres',
          password: configService.get('DATABASE_PASSWORD') ?? 'postgres',
          database: configService.get('USER_DATABASE_NAME') ?? 'postgres',
          synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
          logging: configService.get('DATABASE_LOGGING') === 'true',
          entities: [`${__dirname}/**/*.entity{.ts,.js}`],
          migrations: [`${__dirname}/migrations/*{.ts,.js}`],
          autoLoadEntities: true,
        }),
        inject: [ConfigService],
      }),
    ],
  }).compile();

  const dataSource = module.get(DataSource);
  return { module, dataSource };
};
