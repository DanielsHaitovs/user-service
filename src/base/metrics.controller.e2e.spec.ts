import { CacheService } from '@/baseServices/cache.service';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

describe('MetricsController (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({ moduleFixture } = bootstrap);
    app = bootstrap.app as NestFastifyApplication;

    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('GET /metrics', () => {
    it('200 OK - should successfully return plain text Prometheus metrics without requiring authentication headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.statusCode).toBe(HttpStatus.OK);

      expect(typeof response.payload).toBe('string');
      expect(response.payload).toMatch(/# HELP|# TYPE/);
    });

    it('404 NOT FOUND - should return a 404 error if client explicitly tries to request metrics via the v1 API prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/metrics',
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
