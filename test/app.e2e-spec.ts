import type { INestApplication } from '@nestjs/common';

import type { App } from 'supertest/types';
import type { DataSource } from 'typeorm';

import { bootstrapTestApp } from './bootstrap-e2e';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await bootstrapTestApp());
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });
});
