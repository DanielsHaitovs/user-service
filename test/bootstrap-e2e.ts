import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';

export interface BootstrappedApp {
  app: INestApplication;
  moduleFixture: TestingModule;
  dataSource: DataSource;
}

export async function bootstrapTestApp(): Promise<BootstrappedApp> {
  process.env.USER_DATABASE_HOST = 'localhost';
  process.env.JWT_SECRET = 'your_jwt_secret';
  process.env.NODE_ENV = 'test';

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new EntityNotFoundFilter());

  await app.init();

  const dataSource = app.get(DataSource);

  return { app, moduleFixture, dataSource };
}
