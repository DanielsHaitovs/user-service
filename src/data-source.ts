import { ConfigService } from '@nestjs/config';

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST') ?? 'localhost',
  port: parseInt(configService.get('USER_USER_DATABASE_PORT') ?? '5432', 10),
  username: configService.get('DATABASE_USERNAME') ?? 'postgres',
  password: configService.get('DATABASE_PASSWORD') ?? 'postgres',
  database: configService.get('DATABASE_NAME') ?? 'postgres',
  synchronize: false, // Never use synchronize in production
  logging: configService.get('DATABASE_LOGGING') === 'true',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
