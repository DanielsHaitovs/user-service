import type { INestApplication } from '@nestjs/common';

import type { Server } from 'http';
import * as request from 'supertest';
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

  it('/health (GET)', async () => {
    const httpServer = app.getHttpServer() as Server;

    return await request(httpServer).get('/health').expect(200).expect('OK');
  });
});
