import type { INestApplication } from '@nestjs/common';

import type { App } from 'supertest/types';

import { bootstrapTestApp } from './bootstrap-e2e';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    ({ app } = await bootstrapTestApp());
  });

  afterAll(async () => {
    await app.close();
  });
});
