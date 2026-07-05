import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { SYSTEM_USER_EMAIL } from '@/commonConst/user.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import { DataSource } from 'typeorm';

export interface BootstrappedApp {
  app: INestApplication;
  moduleFixture: TestingModule;
  dataSource: DataSource;
  systemUserId: UUID;
  envConfigService: EnvConfigService;
}

export async function bootstrapTestApp(): Promise<BootstrappedApp> {
  process.env.USER_DATABASE_HOST = 'localhost';
  process.env.JWT_SECRET = 'your_jwt_secret';
  process.env.NODE_ENV = 'test';
  process.env.REDIS_HOST = 'localhost';

  const { AppModule } = await import('../src/app.module');

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new EntityNotFoundFilter());

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const dataSource = app.get(DataSource);
  const envConfigService = app.get(EnvConfigService);

  // if (dataSource.isInitialized) {
  //   await dataSource.synchronize(true);
  // }

  const { User } = await import('../src/user/entities/user.entity');
  const userRepository = dataSource.getRepository(User);

  const systemUser = await userRepository.findOneOrFail({
    where: { email: SYSTEM_USER_EMAIL },
  });

  return {
    app,
    moduleFixture,
    dataSource,
    systemUserId: systemUser.id,
    envConfigService,
  };
}
