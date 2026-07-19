/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { AuthenticateDto } from '@/auth/auth.dto';
import { AuthCacheService } from '@/auth/cache.service';
import { CacheService } from '@/baseServices/cache.service';
import { EnvConfigService } from '@/config/env/env.config.service';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { updateTestUser } from '@/test/db/user';
import { createTestUser } from '@/test/pipeline/user';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let userPipelineService: UserPipelineService;
  let envConfigService: EnvConfigService;
  let cacheService: AuthCacheService;

  let cacheSetSpy: jest.SpyInstance;
  let requireAuthSpy: jest.SpyInstance;
  let systemUserId: UUID;
  let testUser: UserResponseDto;

  const testPassword = 'E2ePassword123!';

  beforeAll(async () => {
    const bootstrap = await bootstrapTestApp();
    ({ dataSource, moduleFixture, userPipelineService, systemUserId } =
      bootstrap);
    app = bootstrap.app as NestFastifyApplication;

    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    envConfigService = moduleFixture.get<EnvConfigService>(EnvConfigService);
    cacheService = moduleFixture.get<AuthCacheService>(AuthCacheService);

    cacheSetSpy = jest.spyOn(cacheService, 'set').mockResolvedValue();

    requireAuthSpy = jest
      .spyOn(envConfigService, 'requireAuth', 'get')
      .mockReturnValue(true);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await createTestUser({
      userPipelineService,
      overrides: { password: testPassword },
      createdById: systemUserId,
    });

    await updateTestUser({
      dataSource,
      id: testUser.id,
      override: { isActive: true, isEmailVerified: true },
    });
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('POST /v1/auth/login', () => {
    it('201 CREATED - should successfully authenticate valid credentials and issue a JWT token', async () => {
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);

      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
    });

    it('401 UNAUTHORIZED - should reject handshakes with custom message if the email does not exist', async () => {
      const payload: AuthenticateDto = {
        email: 'ghost-account@example.com',
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);

      const body = JSON.parse(response.payload);
      expect(body.message).toBe('Invalid credentials');
    });

    it('401 UNAUTHORIZED - should reject handshakes with standard exception if the password fails verification', async () => {
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: 'wrong-password-attempt',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });

    it('401 UNAUTHORIZED - should block authentication if the account status is inactive', async () => {
      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isActive: false },
      });
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = JSON.parse(response.payload);
      expect(body.message).toBe('User account is inactive');
    });

    it('401 UNAUTHORIZED - should block authentication if the email verification status is false', async () => {
      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isEmailVerified: false },
      });
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      const body = JSON.parse(response.payload);
      expect(body.message).toBe('Email is not verified');
    });

    it('201 CREATED - should bypass status validation criteria completely if requireAuth is overridden to false', async () => {
      requireAuthSpy.mockReturnValue(false);

      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isActive: false, isEmailVerified: false },
      });

      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    });

    it('400 BAD REQUEST - should throw bad request if email is structurally malformed', async () => {
      const payload = {
        email: 'not-a-valid-email-string',
        password: testPassword,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });

    it('400 BAD REQUEST - should throw bad request if required password parameter is missing', async () => {
      const payload = { email: testUser.email };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
